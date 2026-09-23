-- Explicit platform role grants (admin, teacher, org_staff).
-- Complements blossom_platform_admin and teacher_link so operators can promote
-- users without a pre-existing learner link.
create table if not exists blossom_role_grant (
  user_id text not null,
  role text not null check (role in ('admin', 'teacher', 'org_staff')),
  status text not null default 'active'
    check (status in ('active', 'revoked')),
  granted_by text,
  note text,
  created_at timestamptz not null default current_timestamp,
  updated_at timestamptz not null default current_timestamp,
  primary key (user_id, role)
);

create index if not exists blossom_role_grant_role_status_idx
  on blossom_role_grant (role, status, updated_at desc);

create index if not exists blossom_role_grant_user_idx
  on blossom_role_grant (user_id, status);
