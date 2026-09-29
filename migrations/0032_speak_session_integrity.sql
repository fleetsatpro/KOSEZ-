-- Server-authoritative Speak sessions. Reward-bearing SPEAK_COMPLETED evidence
-- must reference a server-created and completed session.
create table if not exists blossom_speak_session (
  id uuid primary key,
  user_id text not null,
  room_id text not null,
  language_id text not null,
  status text not null check (status in ('active','completed','cancelled')),
  started_at timestamptz not null default current_timestamp,
  ended_at timestamptz,
  duration_seconds integer check (duration_seconds is null or duration_seconds between 0 and 14400),
  created_at timestamptz not null default current_timestamp,
  updated_at timestamptz not null default current_timestamp
);

alter table blossom_speak_session add column if not exists language_id text;
update blossom_speak_session set language_id = 'en' where language_id is null;
alter table blossom_speak_session alter column language_id set not null;

create index if not exists blossom_speak_session_user_idx
  on blossom_speak_session (user_id, started_at desc);

create unique index if not exists blossom_speak_session_active_user_uidx
  on blossom_speak_session (user_id)
  where status = 'active';

create unique index if not exists blossom_activity_speak_session_uidx
  on blossom_activity_event (user_id, source_id)
  where event_type = 'SPEAK_COMPLETED'
    and source_id like 'speak-session-%';
