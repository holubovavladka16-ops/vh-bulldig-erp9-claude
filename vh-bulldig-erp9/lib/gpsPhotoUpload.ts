import type { createClient } from "@/lib/supabase/client";

type TypedSupabaseClient = ReturnType<typeof createClient>;

export async function uploadGpsPhoto(
  supabase: TypedSupabaseClient,
  companyId: string,
  file: File
): Promise<{ url: string; path: string }> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${companyId}/gps-photo-${Date.now()}.${ext}`;

  const { error } = await supabase.storage.from("gps-photos").upload(path, file, {
    upsert: true,
    contentType: file.type || undefined,
  });

  if (error) throw error;

  const { data } = supabase.storage.from("gps-photos").getPublicUrl(path);
  return { url: data.publicUrl, path };
}
