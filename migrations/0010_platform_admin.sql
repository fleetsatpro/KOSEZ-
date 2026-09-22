-- Platform-admin grants are deliberately separate from learner / teacher /
-- organization roles. A row must exist and be active before Admin is exposed.
create table if not exists blossom_platform_admin (
  user_id text primary key,
  status text not null default 'active'
    check (status in ('active','revoked')),
  created_at timestamptz not null default current_timestamp,
  updated_at timestamptz not null default current_timestamp
);

create index if not exists blossom_platform_admin_status_idx
  on blossom_platform_admin (status, updated_at desc);
