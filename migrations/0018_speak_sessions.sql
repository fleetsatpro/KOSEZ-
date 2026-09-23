-- Server-timed Speak Room sessions.
-- Client-side elapsed time remains UI-only; analytics use the authoritative
-- completion event emitted when the server closes a session.

create table if not exists blossom_speak_session (
  id uuid primary key,
  user_id text not null,
  room_id text not null,
  status text not null check (status in ('active','completed','cancelled')),
  started_at timestamptz not null default current_timestamp,
  ended_at timestamptz,
  duration_seconds integer check (duration_seconds is null or duration_seconds between 0 and 3600),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default current_timestamp,
  updated_at timestamptz not null default current_timestamp
);

create index if not exists blossom_speak_session_user_idx
  on blossom_speak_session (user_id, created_at desc);

create unique index if not exists blossom_speak_session_active_user_uidx
  on blossom_speak_session (user_id)
  where status = 'active';
