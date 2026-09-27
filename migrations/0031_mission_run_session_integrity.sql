-- Server-authoritative mission run sessions.
-- Local mission state remains syncable/offline, but reward-bearing completion
-- must reference a server-created and completed run session.

create table if not exists blossom_mission_run_session (
  id uuid primary key,
  user_id text not null,
  mission_id text not null,
  run_id text not null,
  status text not null check (status in ('active','completed','cancelled')),
  started_at timestamptz not null default current_timestamp,
  ended_at timestamptz,
  duration_seconds integer check (duration_seconds is null or duration_seconds between 0 and 14400),
  created_at timestamptz not null default current_timestamp,
  updated_at timestamptz not null default current_timestamp
);

with ranked as (
  select id,
    row_number() over (
      partition by user_id, mission_id
      order by created_at desc, id desc
    ) as rn
  from blossom_mission_run_session
  where status = 'active'
)
update blossom_mission_run_session s
set status = 'cancelled',
    ended_at = coalesce(s.ended_at, current_timestamp),
    duration_seconds = greatest(0, extract(epoch from (coalesce(s.ended_at, current_timestamp) - s.started_at))::integer),
    updated_at = current_timestamp
from ranked r
where s.id = r.id and r.rn > 1;

create unique index if not exists blossom_mission_run_session_active_uidx
  on blossom_mission_run_session (user_id, mission_id)
  where status = 'active';

create index if not exists blossom_mission_run_session_user_time_idx
  on blossom_mission_run_session (user_id, started_at desc);

create unique index if not exists blossom_activity_mission_session_uidx
  on blossom_activity_event (user_id, source_id)
  where event_type = 'MISSION_COMPLETED'
    and source_id like 'mission-session-%';