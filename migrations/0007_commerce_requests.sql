-- Durable commerce requests.
-- These records intentionally separate "requested" from "confirmed" and "paid".
-- No payment provider is claimed until a verified webhook changes the state.

create table if not exists blossom_booking_request (
  id uuid primary key,
  user_id text not null,
  catalogue_item_id text not null,
  status text not null check (status in ('requested','confirmed','cancelled')),
  payment_status text not null default 'unpaid' check (payment_status in ('unpaid','paid','refunded')),
  provider_reference text,
  created_at timestamptz not null default current_timestamp,
  updated_at timestamptz not null default current_timestamp,
  unique (user_id, catalogue_item_id)
);

create index if not exists blossom_booking_user_status_idx
  on blossom_booking_request (user_id, status, updated_at desc);

create table if not exists blossom_waitlist_request (
  id uuid primary key,
  user_id text not null,
  item_id text not null,
  status text not null check (status in ('requested','notified','cancelled')),
  created_at timestamptz not null default current_timestamp,
  updated_at timestamptz not null default current_timestamp,
  unique (user_id, item_id)
);

create index if not exists blossom_waitlist_user_status_idx
  on blossom_waitlist_request (user_id, status, updated_at desc);
