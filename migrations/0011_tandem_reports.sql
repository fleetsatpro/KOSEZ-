-- Durable learner safety reports.
create table if not exists blossom_tandem_report (
  id uuid primary key,
  reporter_user_id text not null,
  partner_user_id text not null,
  reason text not null default 'unspecified',
  status text not null default 'open'
    check (status in ('open','reviewing','resolved','dismissed')),
  created_at timestamptz not null default current_timestamp,
  updated_at timestamptz not null default current_timestamp,
  check (reporter_user_id <> partner_user_id)
);

create index if not exists blossom_tandem_report_partner_idx
  on blossom_tandem_report (partner_user_id, status, created_at desc);

create index if not exists blossom_tandem_report_reporter_idx
  on blossom_tandem_report (reporter_user_id, created_at desc);
