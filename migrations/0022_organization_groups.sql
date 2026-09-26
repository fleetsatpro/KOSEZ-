create table if not exists blossom_organization_group (
  id uuid primary key,
  organization_id uuid not null references blossom_organization(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 2 and 100),
  kind text not null check (kind in ('class','cohort')),
  status text not null default 'active'
    check (status in ('active','archived')),
  teacher_user_id text,
  created_by_user_id text not null,
  created_at timestamptz not null default current_timestamp,
  updated_at timestamptz not null default current_timestamp
);

create unique index if not exists blossom_org_group_active_name_idx
  on blossom_organization_group (organization_id, lower(name))
  where status = 'active';

create index if not exists blossom_org_group_org_status_idx
  on blossom_organization_group (organization_id, status, updated_at desc);

create table if not exists blossom_organization_group_member (
  group_id uuid not null references blossom_organization_group(id) on delete cascade,
  user_id text not null,
  added_by_user_id text not null,
  joined_at timestamptz not null default current_timestamp,
  primary key (group_id, user_id)
);

create index if not exists blossom_org_group_member_user_idx
  on blossom_organization_group_member (user_id, joined_at desc);
create index if not exists blossom_org_group_member_group_idx
  on blossom_organization_group_member (group_id, joined_at desc);
