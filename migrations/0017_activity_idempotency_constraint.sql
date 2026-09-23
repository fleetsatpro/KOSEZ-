-- Normalize activity idempotency to a full unique index so INSERT ... ON CONFLICT
-- (user_id, idempotency_key) can be inferred by PostgreSQL on every backend.
-- NULL idempotency keys may still repeat under normal SQL unique-index semantics.
drop index if exists blossom_activity_user_idempotency_idx;

create unique index if not exists blossom_activity_user_idempotency_full_idx
  on blossom_activity_event (user_id, idempotency_key);
