-- Server-authoritative Pulse sessions.
-- The client may run the exercise offline, but only a server-started session
-- can produce a duration-bearing reward/evidence event.

create table if not exists blossom_pulse_session (
  id uuid primary key,
  user_id text not null,
  dare_id text not null,
  status text not null check (status in ('active','completed','cancelled')),
  started_at timestamptz not null default current_timestamp,
  ended_at timestamptz,
  duration_seconds integer check (duration_seconds is null or duration_seconds between 0 and 3600),
  created_at timestamptz not null default current_timestamp,
  updated_at timestamptz not null default current_timestamp
);

create index if not exists blossom_pulse_session_user_idx
  on blossom_pulse_session (user_id, created_at desc);

create unique index if not exists blossom_pulse_session_active_user_uidx
  on blossom_pulse_session (user_id)
  where status = 'active';
