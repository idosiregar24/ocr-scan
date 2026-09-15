import { randomUUID } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { env } from "@/lib/env";

export type StoredObject = { body: Buffer; contentType: string };

export class StorageNotConfiguredError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StorageNotConfiguredError";
  }
}

const EXTENSION_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
  "image/heif": "heif",
};

/** Key selalu digenerate server-side — nama file asli user tidak pernah dipakai (path traversal/PII). */
export function buildReceiptImageKey(userId: string, contentType: string) {
  const ext = EXTENSION_BY_MIME[contentType] ?? "bin";
  return `receipts/${userId}/${randomUUID()}.${ext}`;
}

function localRoot() {
  return path.resolve(process.cwd(), env.STORAGE_LOCAL_DIR);
}

/** Tolak key yang keluar dari root storage sebelum menyentuh filesystem. */
function resolveLocalPath(key: string) {
  const root = localRoot();
  const target = path.resolve(root, key);
  if (target !== root && !target.startsWith(root + path.sep)) {
    throw new Error("Key storage tidak valid");
  }
  return target;
}

const isR2Configured = Boolean(
  env.R2_ACCOUNT_ID && env.R2_ACCESS_KEY_ID && env.R2_SECRET_ACCESS_KEY && env.R2_BUCKET_NAME,
);

// Driver R2/S3 belum terpasang: butuh @aws-sdk/client-s3 yang belum ada di dependencies.
// Gagal keras di sini supaya environment ber-R2 tidak diam-diam menulis ke disk lokal node.
function assertDriverAvailable() {
  if (isR2Configured) {
    throw new StorageNotConfiguredError(
      "R2 terkonfigurasi tapi driver S3 belum terpasang — install @aws-sdk/client-s3 dan implementasikan driver R2 di lib/storage.ts",
    );
  }
}

export async function putObject(key: string, body: Buffer, contentType: string) {
  assertDriverAvailable();
  const target = resolveLocalPath(key);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, body);
  await writeFile(`${target}.meta`, contentType, "utf8");
  return key;
}

export async function getObject(key: string): Promise<StoredObject | null> {
  assertDriverAvailable();
  const target = resolveLocalPath(key);
  try {
    const [body, contentType] = await Promise.all([
      readFile(target),
      readFile(`${target}.meta`, "utf8").catch(() => "application/octet-stream"),
    ]);
    return { body, contentType: contentType.trim() };
  } catch {
    return null;
  }
}

export async function deleteObject(key: string) {
  assertDriverAvailable();
  const target = resolveLocalPath(key);
  await Promise.allSettled([unlink(target), unlink(`${target}.meta`)]);
}
