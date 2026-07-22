import { createClient } from "@/lib/supabase/server";

export interface CreateBackupResult {
  success: boolean;
  backupId: string | null;
  errorMessage?: string;
}

/**
 * Vytvoří konzistentní zálohu dat firmy: zavolá RPC funkci
 * create_company_backup (SECURITY DEFINER, sama ověřuje oprávnění),
 * uloží výsledný JSON snímek do privátního Storage bucketu a založí
 * odpovídající řádek evidence v database_backups.
 */
export async function createCompanyBackup(
  companyId: string,
  createdByProfileId: string,
  createdByName: string
): Promise<CreateBackupResult> {
  const supabase = createClient();

  const { data: backupRow, error: insertError } = await supabase
    .from("database_backups")
    .insert({
      company_id: companyId,
      status: "probiha",
      created_by: createdByProfileId,
      created_by_name: createdByName,
    } as never)
    .select()
    .single();

  if (insertError || !backupRow) {
    return { success: false, backupId: null, errorMessage: insertError?.message };
  }

  const backupId = (backupRow as unknown as { id: string }).id;

  try {
    const { data: snapshot, error: rpcError } = await supabase.rpc(
      "create_company_backup",
      { p_company_id: companyId } as never
    );

    if (rpcError) throw new Error(rpcError.message);

    const json = JSON.stringify(snapshot);
    const bytes = new TextEncoder().encode(json);
    const path = `${companyId}/${backupId}.json`;

    const { error: uploadError } = await supabase.storage
      .from("database-backups")
      .upload(path, bytes, { contentType: "application/json", upsert: true });

    if (uploadError) throw new Error(uploadError.message);

    await supabase
      .from("database_backups")
      .update({
        status: "dokonceno",
        storage_path: path,
        size_bytes: bytes.byteLength,
        completed_at: new Date().toISOString(),
      } as never)
      .eq("id", backupId);

    return { success: true, backupId };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Zálohu se nepodařilo dokončit. Původní data zůstala zachována.";

    await supabase
      .from("database_backups")
      .update({ status: "selhalo", error_message: message, completed_at: new Date().toISOString() } as never)
      .eq("id", backupId);

    return { success: false, backupId, errorMessage: message };
  }
}
