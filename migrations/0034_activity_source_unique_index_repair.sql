-- Repair the activity-source uniqueness guarantee without rewriting historical
-- migration files. 0014 reused the non-unique index name created by 0002,
-- so PostgreSQL could legally keep the old index and skip the UNIQUE upgrade.

drop index if exists blossom_activity_user_source_idx;

create unique index if not exists blossom_activity_user_event_source_unique_idx
  on blossom_activity_event (user_id, event_type, source_id)
  where source_id is not null;

create index if not exists blossom_activity_user_source_idx
  on blossom_activity_event (user_id, source_id);
