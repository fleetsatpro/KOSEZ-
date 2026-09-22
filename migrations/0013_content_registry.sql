-- Server-published content overrides.
-- Runtime code remains the safe bootstrap source; published rows override it
-- without changing learner state. Draft and published revisions are independent.

create table if not exists blossom_content_item (
  content_key text primary key,
  kind text not null check (kind in ('event','catalogue')),
  draft_payload jsonb not null default '{}'::jsonb,
  published_payload jsonb,
  draft_revision integer not null default 1 check (draft_revision > 0),
  published_revision integer not null default 0 check (published_revision >= 0),
  state text not null default 'draft'
    check (state in ('draft','published','archived')),
  updated_by text not null,
  published_by text,
  published_at timestamptz,
  created_at timestamptz not null default current_timestamp,
  updated_at timestamptz not null default current_timestamp
);

create index if not exists blossom_content_kind_state_idx
  on blossom_content_item (kind, state, updated_at desc);
