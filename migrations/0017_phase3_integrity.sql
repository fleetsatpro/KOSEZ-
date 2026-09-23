-- Phase 3 integrity hardening: prevent duplicate active tandem sessions for the same pair.
create unique index if not exists blossom_tandem_session_active_pair_uidx
  on blossom_tandem_session (
    least(user_id, partner_user_id),
    greatest(user_id, partner_user_id)
  )
  where status = 'active';

-- Keep the prompt log performant for session ownership/history checks.
create index if not exists blossom_tandem_prompt_user_idx
  on blossom_tandem_prompt_log (user_id, created_at desc);
