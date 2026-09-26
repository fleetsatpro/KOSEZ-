create table if not exists blossom_teacher_session (
  id uuid primary key,
  teacher_user_id text not null,
  learner_user_id text not null,
  title text not null check (char_length(trim(title)) between 1 and 180),
  starts_at timestamptz not null,
  duration_minutes integer not null check (duration_minutes between 15 and 180),
  notes text,
  status text not null default 'scheduled' check (status in ('scheduled','cancelled')),
  created_at timestamptz not null default current_timestamp,
  updated_at timestamptz not null default current_timestamp
);

create index if not exists blossom_teacher_session_teacher_time_idx
  on blossom_teacher_session (teacher_user_id, starts_at asc)
  where status = 'scheduled';

create index if not exists blossom_teacher_session_learner_time_idx
  on blossom_teacher_session (learner_user_id, starts_at asc)
  where status = 'scheduled';