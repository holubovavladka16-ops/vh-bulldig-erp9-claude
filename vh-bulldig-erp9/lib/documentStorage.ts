import type { createClient } from "@/lib/supabase/client";

type TypedSupabaseClient = ReturnType<typeof createClient>;

/** Odstraní diakritiku a nepovolené znaky, aby název souboru byl bezpečný (bod 9). */
export function sanitizeFileName(name: string): string {
  const noDiacritics = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  return noDiacritics.replace(/[^a-zA-Z0-9-_]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}

export async function uploadGeneratedDocument(
  supabase: TypedSupabaseClient,
  companyId: string,
  fileName: string,
  blob: Blob
): Promise<{ url: string; path: string }> {
  const path = `${companyId}/${Date.now()}-${sanitizeFileName(fileName)}`;

  const { error } = await supabase.storage.from("generated-documents").upload(path, blob, {
    upsert: true,
    contentType: "application/pdf",
  });

  if (error) throw error;

  const { data } = supabase.storage.from("generated-documents").getPublicUrl(path);
  return { url: data.publicUrl, path };
}
