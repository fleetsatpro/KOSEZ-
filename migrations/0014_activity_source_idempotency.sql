-- A real-world activity source should be recorded once per learner.
-- Deduplicate legacy rows first so the unique index is safe on an already-used
-- database. The earliest event is retained as the canonical record.
with ranked as (
  select
    id,
    row_number() over (
      partition by user_id, event_type, source_id
      order by occurred_at asc, id asc
    ) as rn
  from blossom_activity_event
  where source_id is not null
)
delete from blossom_activity_event
where id in (
  select id from ranked where rn > 1
);

-- The partial index preserves multiple audit-less events that have no source id
-- while preventing duplicate completion records across devices.
create unique index if not exists blossom_activity_user_source_idx
  on blossom_activity_event (user_id, event_type, source_id)
  where source_id is not null;
