create table if not exists blossom_learning_feedback (
  id uuid primary key,
  submission_id uuid not null references blossom_learning_submission(id) on delete cascade,
  teacher_user_id text not null,
  learner_user_id text not null,
  body text not null check (char_length(trim(body)) between 1 and 4000),
  rubric jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default current_timestamp,
  updated_at timestamptz not null default current_timestamp,
  unique (submission_id, teacher_user_id)
);

create index if not exists blossom_learning_feedback_learner_idx
  on blossom_learning_feedback (learner_user_id, updated_at desc);
create index if not exists blossom_learning_feedback_teacher_idx
  on blossom_learning_feedback (teacher_user_id, updated_at desc);
