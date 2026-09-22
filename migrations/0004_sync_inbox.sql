-- Offline-first synchronization primitives.
-- The sync inbox is an idempotent command ledger. Domain tables remain the
-- durable projections; the inbox prevents replay and records conflicts without
-- silently discarding client work.

alter table blossom_mission_session
  add column if not exists last_mutation_id uuid;

create table if not exists blossom_sync_device (
  user_id text not null,
  device_id text not null,
  last_seen_at timestamptz not null default current_timestamp,
  last_sync_at timestamptz,
  user_agent text,
  primary key (user_id, device_id)
);

create table if not exists blossom_sync_mutation (
  mutation_id uuid primary key,
  user_id text not null,
  device_id text not null,
  operation text not null,
  entity_id text not null,
  payload jsonb not null default '{}'::jsonb,
  expected_revision integer,
  status text not null check (status in ('pending','processing','applied','conflict','rejected')),
  result jsonb not null default '{}'::jsonb,
  error_code text,
  created_at timestamptz not null default current_timestamp,
  updated_at timestamptz not null default current_timestamp,
  applied_at timestamptz
);

create index if not exists blossom_sync_user_status_idx
  on blossom_sync_mutation (user_id, status, created_at);

create index if not exists blossom_sync_device_time_idx
  on blossom_sync_mutation (user_id, device_id, created_at desc);

create table if not exists blossom_sync_conflict (
  id uuid primary key,
  user_id text not null,
  mutation_id uuid not null,
  operation text not null,
  entity_id text not null,
  local_payload jsonb not null default '{}'::jsonb,
  local_revision integer,
  server_revision integer,
  server_state jsonb not null default '{}'::jsonb,
  detected_at timestamptz not null default current_timestamp,
  resolved_at timestamptz
);

create index if not exists blossom_sync_conflict_user_time_idx
  on blossom_sync_conflict (user_id, detected_at desc);
