-- P1: make saved vocabulary explicitly language-scoped.
-- Existing rows are treated as English unless their metadata already carries a
-- recognized language id; this preserves legacy data without leaking it into
-- newly selected non-English languages.

alter table blossom_vocabulary
  add column if not exists language_id text not null default 'en';

update blossom_vocabulary
set language_id = metadata->>'languageId'
where metadata->>'languageId' in ('en','fr','es','pt','it','de','cr','lsf');

alter table blossom_vocabulary
  drop constraint if exists blossom_vocabulary_pkey;

alter table blossom_vocabulary
  add primary key (user_id, language_id, word);

create index if not exists blossom_vocabulary_user_language_updated_idx
  on blossom_vocabulary (user_id, language_id, updated_at desc);
