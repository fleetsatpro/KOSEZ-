-- Server-backed reading evidence for LIBRARY_COMPLETED.
create table if not exists blossom_library_reading (
  user_id text not null,
  document_id text not null,
  started_at timestamptz not null,
  completed_at timestamptz,
  primary key (user_id, document_id)
);

create index if not exists blossom_library_reading_completed_idx
  on blossom_library_reading (completed_at);
