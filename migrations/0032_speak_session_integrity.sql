-- Server-authoritative OSEZ Speak sessions.
-- A reward-bearing SPEAK_COMPLETED event must be backed by a completed
-- server session with positive server-observed session and evidence time.

create table if not exists blossom_speak_session (
  id uuid primary key,
  user_id text not null,
  room_id text not null,
  language_id text not null,
  status text not null check (status in ('active','completed','cancelled')),
  started_at timestamptz not null default current_timestamp,
  ended_at timestamptz,
  duration_seconds integer check (duration_seconds is null or duration_seconds between 0 and 3600),
  evidence_seconds integer not null default 0 check (evidence_seconds between 0 and 3600),
  turn_count integer not null default 0 check (turn_count between 0 and 600),
  created_at timestamptz not null default current_timestamp,
  updated_at timestamptz not null default current_timestamp
);

create index if not exists blossom_speak_session_user_idx
  on blossom_speak_session (user_id, created_at desc);

create unique index if not exists blossom_speak_session_active_user_uidx
  on blossom_speak_session (user_id)
  where status = 'active';

create unique index if not exists blossom_activity_speak_session_uidx
  on blossom_activity_event (user_id, source_id)
  where event_type = 'SPEAK_COMPLETED'
    and source_id like 'speak-session-%';
