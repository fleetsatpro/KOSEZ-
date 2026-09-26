create table if not exists blossom_saved_explore_item (
  user_id text not null,
  item_type text not null check (item_type in ('event','catalogue')),
  item_id text not null,
  created_at timestamptz not null default current_timestamp,
  primary key (user_id, item_type, item_id)
);

create index if not exists blossom_saved_explore_user_time_idx
  on blossom_saved_explore_item (user_id, created_at desc);
