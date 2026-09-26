-- Durable 1:1 communication.
-- Conversations are relationship-gated at the server; the schema stores only
-- conversations the application is authorized to create.
create table if not exists blossom_conversation (
  id uuid primary key,
  kind text not null check (kind in ('teacher','guardian','tandem')),
  conversation_key text not null unique,
  created_by text not null,
  created_at timestamptz not null default current_timestamp,
  updated_at timestamptz not null default current_timestamp
);

create table if not exists blossom_conversation_participant (
  conversation_id uuid not null references blossom_conversation(id) on delete cascade,
  user_id text not null,
  last_read_at timestamptz,
  joined_at timestamptz not null default current_timestamp,
  primary key (conversation_id, user_id)
);
create index if not exists blossom_conversation_participant_user_idx
  on blossom_conversation_participant (user_id, joined_at desc);
create index if not exists blossom_conversation_updated_idx
  on blossom_conversation (updated_at desc);

create table if not exists blossom_message (
  id uuid primary key,
  conversation_id uuid not null references blossom_conversation(id) on delete cascade,
  sender_user_id text not null,
  client_message_id uuid,
  body text not null check (char_length(body) between 1 and 4000),
  created_at timestamptz not null default current_timestamp,
  edited_at timestamptz,
  deleted_at timestamptz,
  metadata jsonb not null default '{}'::jsonb
);
create unique index if not exists blossom_message_sender_client_idx
  on blossom_message (sender_user_id, client_message_id)
  where client_message_id is not null;
create index if not exists blossom_message_conversation_time_idx
  on blossom_message (conversation_id, created_at asc);