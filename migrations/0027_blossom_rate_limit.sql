-- Application-level rate limiting for authenticated, abuse-prone mutations.
-- Stored in Postgres so limits apply across Vercel/serverless instances.
create table if not exists blossom_rate_limit_bucket (
  user_id text not null,
  bucket_key text not null,
  window_started_at timestamptz not null default current_timestamp,
  hit_count integer not null check (hit_count >= 0),
  primary key (user_id, bucket_key)
);

create index if not exists blossom_rate_limit_window_idx
  on blossom_rate_limit_bucket (window_started_at);
