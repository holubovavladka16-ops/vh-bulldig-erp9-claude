import type { createClient } from "@/lib/supabase/client";

type TypedSupabaseClient = ReturnType<typeof createClient>;

const SIGNED_URL_EXPIRY_SECONDS = 60 * 60; // 1 hodina

export async function uploadCheckFile(
  supabase: TypedSupabaseClient,
  companyId: string,
  checkId: string,
  file: File
): Promise<{ path: string; fileType: string }> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${companyId}/${checkId}/${Date.now()}.${ext}`;

  const { error } = await supabase.storage.from("paper-form-checks").upload(path, file, {
    upsert: true,
    contentType: file.type || undefined,
  });

  if (error) throw error;

  return { path, fileType: file.type || `application/${ext}` };
}

export async function getSignedCheckFileUrl(supabase: TypedSupabaseClient, path: string): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from("paper-form-checks")
    .createSignedUrl(path, SIGNED_URL_EXPIRY_SECONDS);

  if (error || !data) return null;
  return data.signedUrl;
}
