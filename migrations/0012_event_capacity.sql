-- Database-enforced event capacity.
-- Each joined registration owns one event-local seat. The partial unique index
-- makes two concurrent joins contend on the same seat instead of both passing
-- a count(*) pre-check.

alter table blossom_event_registration
  add column if not exists seat_no integer;

update blossom_event_registration r
set seat_no = ranked.seat_no
from (
  select
    user_id,
    event_id,
    row_number() over (
      partition by event_id
      order by created_at asc, user_id asc
    )::integer as seat_no
  from blossom_event_registration
  where status = 'joined'
    and seat_no is null
) ranked
where r.user_id = ranked.user_id
  and r.event_id = ranked.event_id
  and r.status = 'joined'
  and r.seat_no is null;

create unique index if not exists blossom_event_registration_seat_idx
  on blossom_event_registration (event_id, seat_no)
  where seat_no is not null;

create index if not exists blossom_event_registration_event_status_idx
  on blossom_event_registration (event_id, status, updated_at desc);
