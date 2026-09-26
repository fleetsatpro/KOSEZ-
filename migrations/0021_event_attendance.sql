create table if not exists blossom_event_attendance (
  event_id text not null,
  user_id text not null,
  recorded_by_user_id text not null,
  note text,
  recorded_at timestamptz not null default current_timestamp,
  primary key (event_id, user_id)
);

create index if not exists blossom_event_attendance_user_time_idx
  on blossom_event_attendance (user_id, recorded_at desc);
create index if not exists blossom_event_attendance_event_time_idx
  on blossom_event_attendance (event_id, recorded_at desc);
