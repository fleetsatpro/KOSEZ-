-- Bind every Tandem session to the learner's learning language.
-- Prevents a session started under one language from being completed under another.

alter table blossom_tandem_session
  add column if not exists language_id text not null default 'en';

update blossom_tandem_session s
set language_id = coalesce(
  (
    select p.target_language
    from blossom_profile p
    where p.user_id = s.user_id
      and p.target_language is not null
    limit 1
  ),
  'en'
)
where s.language_id is null
   or s.language_id = 'en';

create index if not exists blossom_tandem_session_user_language_idx
  on blossom_tandem_session (user_id, language_id, created_at desc);
