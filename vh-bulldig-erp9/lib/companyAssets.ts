import type { createClient } from "@/lib/supabase/client";

type TypedSupabaseClient = ReturnType<typeof createClient>;

const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp"];
const ALLOWED_EXTENSIONS = ["png", "jpg", "jpeg", "webp"];

export function validateCompanyImage(file: File): string | null {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!ALLOWED_TYPES.includes(file.type) && !ALLOWED_EXTENSIONS.includes(ext)) {
    return "Nepodporovaný formát souboru. Použijte PNG, JPG, JPEG nebo WEBP.";
  }
  return null;
}

export async function uploadCompanyAsset(
  supabase: TypedSupabaseClient,
  bucket: "company-logos" | "company-watermarks",
  companyId: string,
  file: File
): Promise<{ url: string; path: string }> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "png";
  const path = `${companyId}/${bucket}-${Date.now()}.${ext}`;

  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    upsert: true,
    contentType: file.type || undefined,
  });

  if (error) {
    throw error;
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return { url: data.publicUrl, path };
}

export async function removeCompanyAsset(
  supabase: TypedSupabaseClient,
  bucket: "company-logos" | "company-watermarks",
  path: string | null
) {
  if (!path) return;
  await supabase.storage.from(bucket).remove([path]);
}
