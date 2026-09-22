-- A real-world activity source should be recorded once per learner.
-- The partial index preserves multiple audit-less events that have no source id
-- while preventing duplicate completion records across devices.
create unique index if not exists blossom_activity_user_source_idx
  on blossom_activity_event (user_id, event_type, source_id)
  where source_id is not null;
