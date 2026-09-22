-- Server-authoritative K’Osez plan entitlements.
-- Client profile preferences never grant access. A missing row means Centre.
create table if not exists blossom_subscription (
  user_id text primary key,
  plan text not null check (plan in ('centre','digital','premium')),
  status text not null default 'active'
    check (status in ('active','past_due','paused','cancelled')),
  provider_customer_reference text,
  provider_subscription_reference text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  updated_at timestamptz not null default current_timestamp
);

create index if not exists blossom_subscription_status_idx
  on blossom_subscription (status, plan);
