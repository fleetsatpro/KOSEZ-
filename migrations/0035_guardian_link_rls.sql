-- Database backstop for guardian relationship isolation.
--
-- This is deliberately numbered after the current 0032/0033/0034 migrations;
-- migration names are filenames, so reusing 0032 would create confusing ordering
-- and would be a second migration sharing an existing sequence number.

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'app_runtime') then
    create role app_runtime
      nosuperuser
      nocreatedb
      nocreaterole
      noinherit
      nobypassrls
      nologin;
  end if;
end
$$;

-- SET LOCAL ROLE requires membership. Granting membership to the migration's
-- session role makes the wrapper work with both PGLite's superuser and a normal
-- Neon application role. The grant is idempotent.
grant app_runtime to current_user;

-- Least privilege: withAuthedSql is introduced for this RLS-protected surface.
-- Do not grant the wrapper blanket access to every table in public.
grant usage on schema public to app_runtime;
grant select, insert, update, delete on blossom_guardian_link to app_runtime;
grant select on blossom_platform_admin, blossom_role_grant to app_runtime;

alter table blossom_guardian_link enable row level security;
alter table blossom_guardian_link force row level security;

drop policy if exists blossom_guardian_link_party_or_admin on blossom_guardian_link;
create policy blossom_guardian_link_party_or_admin
  on blossom_guardian_link
  for all
  using (
    current_setting('app.user_id', true) in (guardian_user_id, learner_user_id)
    or exists (
      select 1
      from blossom_platform_admin
      where user_id = current_setting('app.user_id', true)
        and status = 'active'
      union all
      select 1
      from blossom_role_grant
      where user_id = current_setting('app.user_id', true)
        and role = 'admin'
        and status = 'active'
    )
  )
  with check (
    exists (
      select 1
      from blossom_platform_admin
      where user_id = current_setting('app.user_id', true)
        and status = 'active'
      union all
      select 1
      from blossom_role_grant
      where user_id = current_setting('app.user_id', true)
        and role = 'admin'
        and status = 'active'
    )
  );
