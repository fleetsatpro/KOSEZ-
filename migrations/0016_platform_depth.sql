-- Platform depth expansion: durable learner notifications and tandem session lifecycle.
create table if not exists blossom_notification (
  id uuid primary key,
  user_id text not null,
  kind text not null check (kind in (
    'homework','booking','event','tandem','learning','system'
  )),
  title text not null,
  body text not null,
  href text,
  metadata jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default current_timestamp
);

create index if not exists blossom_notification_user_time_idx
  on blossom_notification (user_id, created_at desc);
create index if not exists blossom_notification_unread_idx
  on blossom_notification (user_id, read_at, created_at desc);

create table if not exists blossom_tandem_session (
  id uuid primary key,
  user_id text not null,
  partner_user_id text not null,
  status text not null check (status in ('active','completed','cancelled')),
  target_language_seconds integer not null default 1800 check (target_language_seconds > 0),
  partner_language_seconds integer not null default 1800 check (partner_language_seconds > 0),
  started_at timestamptz not null default current_timestamp,
  ended_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default current_timestamp,
  updated_at timestamptz not null default current_timestamp,
  check (user_id <> partner_user_id)
);

create index if not exists blossom_tandem_session_user_idx
  on blossom_tandem_session (user_id, created_at desc);
create index if not exists blossom_tandem_session_partner_idx
  on blossom_tandem_session (partner_user_id, created_at desc);
create index if not exists blossom_tandem_session_active_idx
  on blossom_tandem_session (user_id, partner_user_id, status);

create table if not exists blossom_tandem_prompt_log (
  id uuid primary key,
  session_id uuid not null references blossom_tandem_session(id) on delete cascade,
  user_id text not null,
  language text not null,
  prompt text not null,
  created_at timestamptz not null default current_timestamp
);

create index if not exists blossom_tandem_prompt_session_idx
  on blossom_tandem_prompt_log (session_id, created_at);
