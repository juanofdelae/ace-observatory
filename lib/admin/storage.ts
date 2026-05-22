import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { env } from "@/lib/env";

const DEFAULT_BUCKET = "agreements";
const DEFAULT_SIGNED_URL_TTL_SECONDS = 60 * 60; // 1h

let cachedClient: SupabaseClient | null = null;

function getBucket(): string {
  return env.SUPABASE_STORAGE_BUCKET ?? DEFAULT_BUCKET;
}

function client(): SupabaseClient {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      "Supabase Storage is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local.",
    );
  }
  if (!cachedClient) {
    cachedClient = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });
  }
  return cachedClient;
}

/** True only when the env vars are present so the UI can hide upload affordances. */
export function isStorageConfigured(): boolean {
  return Boolean(env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY);
}

/**
 * Object-storage key convention. Keep the agreementId in the path so we can
 * delete an agreement's bucket subtree later if we ever need to.
 */
export function buildAgreementKey(agreementId: string, filename: string): string {
  const cleanName = filename
    .normalize("NFKD")
    .replace(/[^\w.-]/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
  const stamp = Date.now();
  return `agreements/${agreementId}/${stamp}-${cleanName}`;
}

export type UploadInput = {
  key: string;
  contentType: string;
  data: ArrayBuffer | Buffer | Blob;
  upsert?: boolean;
};

export async function uploadObject({ key, contentType, data, upsert = false }: UploadInput) {
  const { error } = await client()
    .storage.from(getBucket())
    .upload(key, data, { contentType, upsert });
  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }
  return { key };
}

export async function deleteObject(key: string): Promise<void> {
  const { error } = await client().storage.from(getBucket()).remove([key]);
  if (error) {
    // Treat "not found" as success — we already wanted it gone.
    if (!/not.?found|does not exist/i.test(error.message)) {
      throw new Error(`Delete failed: ${error.message}`);
    }
  }
}

export async function getSignedUrl(
  key: string,
  expiresIn: number = DEFAULT_SIGNED_URL_TTL_SECONDS,
): Promise<string> {
  const { data, error } = await client()
    .storage.from(getBucket())
    .createSignedUrl(key, expiresIn);
  if (error || !data?.signedUrl) {
    throw new Error(`Signed URL failed: ${error?.message ?? "unknown"}`);
  }
  return data.signedUrl;
}

/**
 * Health probe. Lists the bucket root to confirm credentials + bucket exist.
 * Used during boot smoke tests and admin /settings page. Never throws — returns
 * a structured result so callers can render the diagnosis.
 */
export async function probeStorage(): Promise<
  | { ok: true; bucket: string }
  | { ok: false; reason: string }
> {
  if (!isStorageConfigured()) {
    return { ok: false, reason: "SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing." };
  }
  try {
    const { error } = await client().storage.from(getBucket()).list("", { limit: 1 });
    if (error) return { ok: false, reason: error.message };
    return { ok: true, bucket: getBucket() };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, reason: message };
  }
}
