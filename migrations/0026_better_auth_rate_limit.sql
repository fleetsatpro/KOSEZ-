-- Better Auth persistent rate-limit storage.
-- Matches the v1.6 database rateLimit model: id, unique key, count, lastRequest.
create table if not exists "rateLimit" (
  "id" text not null primary key,
  "key" text not null unique,
  "count" integer not null,
  "lastRequest" bigint not null
);

create index if not exists "rateLimit_lastRequest_idx"
  on "rateLimit" ("lastRequest");
