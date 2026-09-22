-- BLOSSOM learning-domain persistence.
-- These tables deliberately do not reference Better Auth's "user" table directly:
-- the auth schema is opt-in and may be copied into migrations/ only when sign-in
-- is enabled. Authorization is enforced server-side with verified user ids.

create table if not exists blossom_pronlab_attempt (
  id uuid primary key,
  user_id text not null,
  item_id text not null,
  idempotency_key uuid,
  score integer not null check (score >= 0),
  seconds integer not null check (seconds >= 0),
  tip text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default current_timestamp
);

create table if not exists blossom_vocabulary (
  user_id text not null,
  word text not null,
  gloss text not null,
  metadata jsonb not null default '{}'::jsonb,
  first_saved_at timestamptz not null default current_timestamp,
  updated_at timestamptz not null default current_timestamp,
  primary key (user_id, word)
);

create table if not exists blossom_tandem_connection (
  id uuid primary key,
  user_id text not null,
  partner_user_id text not null,
  status text not null check (status in ('suggested','pending','accepted','blocked','paused')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default current_timestamp,
  updated_at timestamptz not null default current_timestamp,
  check (user_id <> partner_user_id)
);

create unique index if not exists blossom_tandem_pair_idx
  on blossom_tandem_connection (user_id, partner_user_id);
create index if not exists blossom_tandem_partner_idx
  on blossom_tandem_connection (partner_user_id);

create unique index if not exists blossom_pronlab_user_idempotency_idx
  on blossom_pronlab_attempt (user_id, idempotency_key)
  where idempotency_key is not null;

create table if not exists blossom_homework (
  id uuid primary key,
  author_user_id text not null,
  learner_user_id text not null,
  title text not null,
  body text not null,
  status text not null check (status in ('draft','sent','done')),
  created_at timestamptz not null default current_timestamp,
  updated_at timestamptz not null default current_timestamp
);

create index if not exists blossom_homework_learner_idx
  on blossom_homework (learner_user_id, updated_at desc);
create index if not exists blossom_homework_author_idx
  on blossom_homework (author_user_id, updated_at desc);

create table if not exists blossom_teacher_note (
  id uuid primary key,
  teacher_user_id text not null,
  learner_user_id text not null,
  tags jsonb not null default '[]'::jsonb,
  note text not null,
  created_at timestamptz not null default current_timestamp,
  updated_at timestamptz not null default current_timestamp
);

create index if not exists blossom_teacher_note_learner_idx
  on blossom_teacher_note (learner_user_id, created_at desc);
create index if not exists blossom_teacher_note_teacher_idx
  on blossom_teacher_note (teacher_user_id, created_at desc);

create table if not exists blossom_event_registration (
  user_id text not null,
  event_id text not null,
  status text not null check (status in ('joined','waitlist','cancelled')),
  created_at timestamptz not null default current_timestamp,
  updated_at timestamptz not null default current_timestamp,
  primary key (user_id, event_id)
);

create table if not exists blossom_challenge_completion (
  user_id text not null,
  challenge_id text not null,
  completed_at timestamptz not null default current_timestamp,
  primary key (user_id, challenge_id)
);

create table if not exists blossom_guardian_link (
  guardian_user_id text not null,
  learner_user_id text not null,
  status text not null check (status in ('pending','active','revoked')),
  created_at timestamptz not null default current_timestamp,
  updated_at timestamptz not null default current_timestamp,
  primary key (guardian_user_id, learner_user_id),
  check (guardian_user_id <> learner_user_id)
);

create table if not exists blossom_teacher_link (
  teacher_user_id text not null,
  learner_user_id text not null,
  status text not null check (status in ('pending','active','revoked')),
  created_at timestamptz not null default current_timestamp,
  updated_at timestamptz not null default current_timestamp,
  primary key (teacher_user_id, learner_user_id),
  check (teacher_user_id <> learner_user_id)
);

create table if not exists blossom_organization (
  id uuid primary key,
  name text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default current_timestamp,
  updated_at timestamptz not null default current_timestamp
);

create table if not exists blossom_organization_member (
  organization_id uuid not null references blossom_organization(id) on delete cascade,
  user_id text not null,
  role text not null check (role in ('owner','admin','teacher','learner')),
  status text not null check (status in ('invited','active','suspended','removed')),
  created_at timestamptz not null default current_timestamp,
  updated_at timestamptz not null default current_timestamp,
  primary key (organization_id, user_id)
);

create index if not exists blossom_org_member_user_idx
  on blossom_organization_member (user_id, status);

create table if not exists blossom_audit_event (
  id uuid primary key,
  actor_user_id text not null,
  action text not null,
  subject_user_id text,
  resource_type text not null,
  resource_id text,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default current_timestamp
);

create index if not exists blossom_audit_actor_time_idx
  on blossom_audit_event (actor_user_id, occurred_at desc);
create index if not exists blossom_audit_subject_time_idx
  on blossom_audit_event (subject_user_id, occurred_at desc);
