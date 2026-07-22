import type { createClient } from "@/lib/supabase/client";

type TypedSupabaseClient = ReturnType<typeof createClient>;
const SIGNED_URL_EXPIRY_SECONDS = 60 * 60;

export async function uploadDocumentAttachment(
  supabase: TypedSupabaseClient,
  companyId: string,
  documentId: string,
  file: File
): Promise<{ path: string }> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
  const path = `${companyId}/${documentId}/${Date.now()}-${Math.round(Math.random() * 1e6)}.${ext}`;
  const { error } = await supabase.storage.from("document-attachments").upload(path, file, {
    upsert: true,
    contentType: file.type || undefined,
  });
  if (error) throw error;
  return { path };
}

export async function uploadSignatureFile(
  supabase: TypedSupabaseClient,
  companyId: string,
  documentId: string,
  file: File | Blob,
  ext = "png"
): Promise<{ path: string }> {
  const path = `${companyId}/${documentId}/${Date.now()}-signature.${ext}`;
  const { error } = await supabase.storage.from("document-signatures").upload(path, file, {
    upsert: true,
    contentType: file instanceof File ? file.type || undefined : "image/png",
  });
  if (error) throw error;
  return { path };
}

export async function getSignedAttachmentUrl(supabase: TypedSupabaseClient, path: string): Promise<string | null> {
  const { data, error } = await supabase.storage.from("document-attachments").createSignedUrl(path, SIGNED_URL_EXPIRY_SECONDS);
  if (error || !data) return null;
  return data.signedUrl;
}

export async function getSignedSignatureUrl(supabase: TypedSupabaseClient, path: string): Promise<string | null> {
  const { data, error } = await supabase.storage.from("document-signatures").createSignedUrl(path, SIGNED_URL_EXPIRY_SECONDS);
  if (error || !data) return null;
  return data.signedUrl;
}
