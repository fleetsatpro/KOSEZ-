import { getSql } from "@/lib/db";

export class BlossomRateLimitError extends Error {
  readonly status = 429;
  readonly retryAfterSeconds: number;

  constructor(retryAfterSeconds: number) {
    super("Too many requests");
    this.name = "BlossomRateLimitError";
    this.retryAfterSeconds = Math.max(1, Math.ceil(retryAfterSeconds));
  }
}

export async function enforceRateLimit(
  userId: string,
  bucketKey: string,
  maxRequests: number,
  windowSeconds: number,
): Promise<void> {
  if (!userId.trim()) throw new Error("rate-limit-missing-user");
  if (!bucketKey.trim()) throw new Error("rate-limit-missing-bucket");
  if (!Number.isInteger(maxRequests) || maxRequests < 1) {
    throw new Error("rate-limit-invalid-max");
  }
  if (!Number.isInteger(windowSeconds) || windowSeconds < 1) {
    throw new Error("rate-limit-invalid-window");
  }

  const sql = await getSql();
  const rows = await sql.query(
    `insert into blossom_rate_limit_bucket (user_id, bucket_key, window_started_at, hit_count)
     values ($1, $2, current_timestamp, 1)
     on conflict (user_id, bucket_key) do update
       set window_started_at = case
             when current_timestamp - blossom_rate_limit_bucket.window_started_at
               >= ($3::integer * interval '1 second')
             then current_timestamp
             else blossom_rate_limit_bucket.window_started_at
           end,
           hit_count = case
             when current_timestamp - blossom_rate_limit_bucket.window_started_at
               >= ($3::integer * interval '1 second')
             then 1
             else blossom_rate_limit_bucket.hit_count + 1
           end
       where current_timestamp - blossom_rate_limit_bucket.window_started_at
               >= ($3::integer * interval '1 second')
          or blossom_rate_limit_bucket.hit_count < $4
     returning hit_count, window_started_at`,
    [userId, bucketKey, windowSeconds, maxRequests],
  );

  if (rows[0]) return;

  const current = await sql.query(
    "select greatest(1, ceil(extract(epoch from ($2::interval - (current_timestamp - window_started_at)))))::integer as retry_after from blossom_rate_limit_bucket where user_id = $1 and bucket_key = $3",
    [userId, `${windowSeconds} seconds`, bucketKey],
  );
  const retryAfter = Number(current[0]?.retry_after ?? windowSeconds);
  throw new BlossomRateLimitError(retryAfter);
}
