import type { createClient } from "@/lib/supabase/client";

type TypedSupabaseClient = ReturnType<typeof createClient>;

export async function uploadConnectionPhoto(
  supabase: TypedSupabaseClient,
  companyId: string,
  connectionId: string,
  file: File
): Promise<{ url: string; path: string }> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${companyId}/${connectionId}/photo-${Date.now()}.${ext}`;

  const { error } = await supabase.storage.from("connection-photos").upload(path, file, {
    upsert: true,
    contentType: file.type || undefined,
  });

  if (error) throw error;

  const { data } = supabase.storage.from("connection-photos").getPublicUrl(path);
  return { url: data.publicUrl, path };
}

export async function removeConnectionPhoto(supabase: TypedSupabaseClient, path: string) {
  await supabase.storage.from("connection-photos").remove([path]);
}
