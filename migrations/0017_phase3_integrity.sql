-- Persist server-observed session duration so analytics never has to trust
-- a client-reported "60 minutes" value.
alter table blossom_tandem_session
  add column if not exists duration_seconds integer
  check (duration_seconds is null or duration_seconds >= 0);

-- Phase 3 integrity hardening: collapse any duplicate active tandem pairs
-- before adding the uniqueness guarantee. We preserve the older session rows as
-- cancelled so their prompt/audit history is not silently deleted.
with ranked as (
  select
    id,
    row_number() over (
      partition by least(user_id, partner_user_id), greatest(user_id, partner_user_id)
      order by created_at desc, id desc
    ) as rn
  from blossom_tandem_session
  where status = 'active'
)
update blossom_tandem_session s
set status = 'cancelled',
    ended_at = coalesce(s.ended_at, current_timestamp),
    updated_at = current_timestamp
from ranked r
where s.id = r.id
  and r.rn > 1;

create unique index if not exists blossom_tandem_session_active_pair_uidx
  on blossom_tandem_session (
    least(user_id, partner_user_id),
    greatest(user_id, partner_user_id)
  )
  where status = 'active';

create index if not exists blossom_tandem_prompt_user_idx
  on blossom_tandem_prompt_log (user_id, created_at desc);
