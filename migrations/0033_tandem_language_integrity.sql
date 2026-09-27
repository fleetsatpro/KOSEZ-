-- Bind each side of a Tandem session to its own learning language.
-- A bilateral exchange is two-language data: each learner may practice a different target.

alter table blossom_tandem_session
  add column if not exists language_id text not null default 'en';

alter table blossom_tandem_session
  add column if not exists partner_language_id text not null default 'en';

update blossom_tandem_session s
set language_id = coalesce(
  (
    select p.target_language
    from blossom_profile p
    where p.user_id = s.user_id
    limit 1
  ),
  'en'
),
partner_language_id = coalesce(
  (
    select p.target_language
    from blossom_profile p
    where p.user_id = s.partner_user_id
    limit 1
  ),
  'en'
);

create index if not exists blossom_tandem_session_user_language_idx
  on blossom_tandem_session (user_id, language_id, partner_language_id, created_at desc);
