-- Server-authoritative Speak (OSEZ) sessions.
-- The client may practice offline, but only a server-started, server-completed
-- session can produce SPEAK_COMPLETED growth evidence.

create table if not exists blossom_speak_session (
  id uuid primary key,
  user_id text not null,
  room_id text not null,
  language_id text not null,
  status text not null check (status in ('active','completed','cancelled')),
  started_at timestamptz not null default current_timestamp,
  ended_at timestamptz,
  duration_seconds integer check (duration_seconds is null or duration_seconds between 0 and 7200),
  created_at timestamptz not null default current_timestamp,
  updated_at timestamptz not null default current_timestamp
);

create index if not exists blossom_speak_session_user_idx
  on blossom_speak_session (user_id, created_at desc);

create unique index if not exists blossom_speak_session_active_user_uidx
  on blossom_speak_session (user_id)
  where status = 'active';

-- One reward-bearing SPEAK_COMPLETED per server session.
create unique index if not exists blossom_activity_speak_session_uidx
  on blossom_activity_event (user_id, source_id)
  where event_type = 'SPEAK_COMPLETED'
    and source_id like 'speak-session-%';
