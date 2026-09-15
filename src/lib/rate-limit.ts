type Bucket = { count: number; resetAt: number };

// Fallback in-memory: cukup untuk dev/single instance. Di Vercel (multi-instance) limit ini
// tidak dibagi antar-lambda — ganti ke Upstash Redis saat UPSTASH_REDIS_REST_URL tersedia.
const buckets = new Map<string, Bucket>();

export type RateLimitResult = { ok: boolean; retryAfterSeconds: number };

export function rateLimit(key: string, limit: number, windowSeconds: number): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowSeconds * 1000 });
    return { ok: true, retryAfterSeconds: 0 };
  }

  bucket.count += 1;
  if (bucket.count > limit) {
    return { ok: false, retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000) };
  }
  return { ok: true, retryAfterSeconds: 0 };
}

/** Buang bucket kedaluwarsa sesekali supaya Map tidak tumbuh tanpa batas di proses yang lama hidup. */
export function pruneRateLimitBuckets() {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}
