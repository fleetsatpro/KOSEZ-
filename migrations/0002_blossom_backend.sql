-- Durable BLOSSOM application data.
-- Authentication identity remains owned by Better Auth. These tables are scoped
-- by the verified user id supplied by authMiddleware.

create table if not exists blossom_profile (
  user_id text primary key references "user" ("id") on delete cascade,
  display_name text,
  target_language text not null default 'en',
  level text,
  timezone text,
  preferences jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default current_timestamp,
  updated_at timestamptz not null default current_timestamp
);

create table if not exists blossom_activity_event (
  id uuid primary key,
  user_id text not null references "user" ("id") on delete cascade,
  event_type text not null,
  source_id text,
  payload jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default current_timestamp
);

create table if not exists blossom_mission_session (
  user_id text not null references "user" ("id") on delete cascade,
  mission_id text not null,
  session jsonb not null,
  updated_at timestamptz not null default current_timestamp,
  primary key (user_id, mission_id)
);

create index if not exists blossom_activity_user_time_idx
  on blossom_activity_event (user_id, occurred_at desc);
create index if not exists blossom_activity_user_source_idx
  on blossom_activity_event (user_id, source_id);
create index if not exists blossom_mission_updated_idx
  on blossom_mission_session (user_id, updated_at desc);
