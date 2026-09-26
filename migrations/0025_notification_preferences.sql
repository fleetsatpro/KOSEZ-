create table if not exists blossom_notification_preference (
  user_id text not null,
  kind text not null check (kind in ('homework','booking','event','tandem','learning','communication')),
  enabled boolean not null default true,
  updated_at timestamptz not null default current_timestamp,
  primary key (user_id, kind)
);

create index if not exists blossom_notification_preference_user_idx
  on blossom_notification_preference (user_id);