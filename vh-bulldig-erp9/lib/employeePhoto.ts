import type { createClient } from "@/lib/supabase/client";
import { validateCompanyImage } from "@/lib/companyAssets";

type TypedSupabaseClient = ReturnType<typeof createClient>;

export const validateEmployeePhoto = validateCompanyImage;

export async function uploadEmployeePhoto(
  supabase: TypedSupabaseClient,
  companyId: string,
  employeeId: string,
  file: File
): Promise<{ url: string; path: string }> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "png";
  const path = `${companyId}/${employeeId}/photo-${Date.now()}.${ext}`;

  const { error } = await supabase.storage.from("employee-photos").upload(path, file, {
    upsert: true,
    contentType: file.type || undefined,
  });

  if (error) throw error;

  const { data } = supabase.storage.from("employee-photos").getPublicUrl(path);
  return { url: data.publicUrl, path };
}

export async function removeEmployeePhoto(supabase: TypedSupabaseClient, path: string | null) {
  if (!path) return;
  await supabase.storage.from("employee-photos").remove([path]);
}
