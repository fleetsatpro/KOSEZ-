import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { projectRoot } from "./with-app-env.mjs";

test("activity source uniqueness has a distinct repaired index name", () => {
  const root = join(projectRoot(), "migrations");
  const legacy = readFileSync(
    join(root, "0002_blossom_backend.sql"),
    "utf8",
  );
  const historicalAttempt = readFileSync(
    join(root, "0014_activity_source_idempotency.sql"),
    "utf8",
  );
  const repair = readFileSync(
    join(root, "0016_activity_source_unique_index_repair.sql"),
    "utf8",
  );

  assert.match(legacy, /blossom_activity_user_source_idx/);
  assert.match(historicalAttempt, /create unique index if not exists blossom_activity_user_source_idx/);
  assert.match(repair, /drop index if exists blossom_activity_user_source_idx/);
  assert.match(
    repair,
    /create unique index if not exists blossom_activity_user_event_source_unique_idx/,
  );
});
