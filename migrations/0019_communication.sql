alter table blossom_notification drop constraint if exists blossom_notification_kind_check;
alter table blossom_notification add constraint blossom_notification_kind_check check (kind in ('homework','booking','event','tandem','learning','system','communication'));

-- Durable communication primitives.
create table if not exists blossom_conversation (
  id uuid primary key,
  kind text not null check (kind in ('tandem','teacher','support')),
  created_by_user_id text not null,
  created_at timestamptz not null default current_timestamp,
  updated_at timestamptz not null default current_timestamp
);

create table if not exists blossom_conversation_member (
  conversation_id uuid not null references blossom_conversation(id) on delete cascade,
  user_id text not null,
  role text not null default 'participant'
    check (role in ('participant','agent')),
  last_read_at timestamptz,
  joined_at timestamptz not null default current_timestamp,
  primary key (conversation_id, user_id)
);

create index if not exists blossom_conversation_member_user_idx
  on blossom_conversation_member (user_id, joined_at desc);

create table if not exists blossom_message (
  id uuid primary key,
  conversation_id uuid not null references blossom_conversation(id) on delete cascade,
  sender_user_id text not null,
  client_message_id uuid,
  body text not null check (char_length(trim(body)) between 1 and 4000),
  created_at timestamptz not null default current_timestamp
);

create unique index if not exists blossom_message_sender_client_idx
  on blossom_message (sender_user_id, client_message_id)
  where client_message_id is not null;

create index if not exists blossom_message_conversation_time_idx
  on blossom_message (conversation_id, created_at desc);

create table if not exists blossom_message_report (
  id uuid primary key,
  reporter_user_id text not null,
  conversation_id uuid not null references blossom_conversation(id) on delete cascade,
  message_id uuid references blossom_message(id) on delete set null,
  reason text not null check (char_length(trim(reason)) between 1 and 500),
  status text not null default 'open'
    check (status in ('open','reviewing','resolved','dismissed')),
  created_at timestamptz not null default current_timestamp,
  updated_at timestamptz not null default current_timestamp
);

create index if not exists blossom_message_report_status_idx
  on blossom_message_report (status, created_at desc);
