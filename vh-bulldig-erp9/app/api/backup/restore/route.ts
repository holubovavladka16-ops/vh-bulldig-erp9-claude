import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createCompanyBackup } from "@/lib/backup";

export async function POST(request: Request) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Nejste přihlášeni." }, { status: 401 });
  }

  const { data: profileData } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  const profile = profileData as unknown as {
    id: string;
    company_id: string;
    role: string;
    full_name: string | null;
    email: string;
  } | null;

  if (!profile) {
    return NextResponse.json({ error: "Nesprávný e-mail nebo heslo." }, { status: 403 });
  }

  // Bod 18 - obnovu smí spustit POUZE Majitel.
  if (profile.role !== "majitel") {
    return NextResponse.json({ error: "Nemáte oprávnění ke vstupu do aplikace." }, { status: 403 });
  }

  const body = (await request.json()) as { backupId?: string };
  const backupId = body.backupId;

  if (!backupId) {
    return NextResponse.json({ error: "Vyberte konkrétní zálohu." }, { status: 400 });
  }

  const { data: backupRow } = await supabase
    .from("database_backups")
    .select("*")
    .eq("id", backupId)
    .eq("company_id", profile.company_id)
    .maybeSingle();

  const backup = backupRow as unknown as { id: string; status: string; storage_path: string | null } | null;

  // Bod 11 - obnova jen z existující DOKONČENÉ zálohy.
  if (!backup || backup.status !== "dokonceno" || !backup.storage_path) {
    return NextResponse.json({ error: "Obnova je dostupná pouze z dokončené zálohy." }, { status: 400 });
  }

  // Bod 13 - bezpečnostní záloha PŘED obnovou. Pokud selže, obnova se
  // vůbec nespustí.
  const safetyBackup = await createCompanyBackup(
    profile.company_id,
    profile.id,
    `${profile.full_name || profile.email} (automatická záloha před obnovou)`
  );

  if (!safetyBackup.success) {
    return NextResponse.json(
      { error: "Obnovu databáze se nepodařilo dokončit. Původní data byla zachována." },
      { status: 500 }
    );
  }

  const { data: restoreRow, error: restoreInsertError } = await supabase
    .from("database_restores")
    .insert({
      company_id: profile.company_id,
      backup_id: backup.id,
      safety_backup_id: safetyBackup.backupId,
      status: "probiha",
      initiated_by: profile.id,
      initiated_by_name: profile.full_name || profile.email,
    } as never)
    .select()
    .single();

  if (restoreInsertError || !restoreRow) {
    return NextResponse.json(
      { error: "Obnovu databáze se nepodařilo dokončit. Původní data byla zachována." },
      { status: 500 }
    );
  }

  const restoreId = (restoreRow as unknown as { id: string }).id;

  try {
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("database-backups")
      .download(backup.storage_path);

    if (downloadError || !fileData) throw new Error(downloadError?.message ?? "Soubor zálohy nebyl nalezen.");

    const text = await fileData.text();
    const snapshot = JSON.parse(text);

    const { error: rpcError } = await supabase.rpc("restore_company_backup", {
      p_company_id: profile.company_id,
      p_snapshot: snapshot,
    } as never);

    if (rpcError) throw new Error(rpcError.message);

    await supabase
      .from("database_restores")
      .update({ status: "dokonceno", completed_at: new Date().toISOString() } as never)
      .eq("id", restoreId);

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Neznámá chyba.";

    await supabase
      .from("database_restores")
      .update({ status: "selhalo", error_message: message, completed_at: new Date().toISOString() } as never)
      .eq("id", restoreId);

    // Díky tomu, že restore_company_backup běží v jedné transakci,
    // selhání kdekoliv uvnitř automaticky vrátí VŠECHNY změny zpět -
    // původní data v databázi zůstávají beze změny.
    return NextResponse.json(
      { error: "Obnovu databáze se nepodařilo dokončit. Původní data byla zachována." },
      { status: 500 }
    );
  }
}
