-- Repair the activity-source uniqueness migration without rewriting history.
--
-- Migration 0014 used the same index name as the older non-unique index created
-- by 0002. PostgreSQL therefore treated CREATE UNIQUE INDEX IF NOT EXISTS as
-- already satisfied and retained the non-unique index, leaving the intended
-- uniqueness guarantee unenforced.
--
-- Keep the query-friendly (user_id, source_id) index, but give the actual
-- uniqueness guarantee its own stable name.

drop index if exists blossom_activity_user_source_idx;

create unique index if not exists blossom_activity_user_event_source_unique_idx
  on blossom_activity_event (user_id, event_type, source_id)
  where source_id is not null;

create index if not exists blossom_activity_user_source_idx
  on blossom_activity_event (user_id, source_id);
