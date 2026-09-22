-- Durable, privacy-conscious product telemetry.
-- Payloads are limited to scalar properties and are keyed to the authenticated
-- user through the server-side sync pipeline.

create table if not exists blossom_analytics_event (
  id uuid primary key,
  user_id text not null,
  name text not null check (length(name) between 1 and 120),
  props jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default current_timestamp
);

create index if not exists blossom_analytics_user_time_idx
  on blossom_analytics_event (user_id, occurred_at desc);

create index if not exists blossom_analytics_name_time_idx
  on blossom_analytics_event (name, occurred_at desc);
