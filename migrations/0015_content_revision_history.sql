-- Immutable editorial revision history.
create table if not exists blossom_content_revision (
  id uuid primary key,
  content_key text not null,
  kind text not null check (kind in ('event','catalogue')),
  revision integer not null check (revision > 0),
  channel text not null check (channel in ('draft','published','archived')),
  payload jsonb not null,
  actor_user_id text,
  created_at timestamptz not null default current_timestamp,
  unique (content_key, channel, revision)
);

create index if not exists blossom_content_revision_lookup_idx
  on blossom_content_revision (content_key, created_at desc);
