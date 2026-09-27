import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TANDEM_CONTRACT,
  TANDEM_HALF_DURATION_SECONDS,
  TANDEM_TOTAL_DURATION_SECONDS,
} from "./tandem-contract.ts";

test("tandem contract is one shared 30+30 minute frame", () => {
  assert.equal(TANDEM_HALF_DURATION_SECONDS, 1800);
  assert.equal(TANDEM_TOTAL_DURATION_SECONDS, 3600);
  assert.equal(TANDEM_CONTRACT.halfMinutes, 30);
  assert.equal(TANDEM_CONTRACT.totalMinutes, 60);
  assert.equal(TANDEM_CONTRACT.minParticipants, 2);
  assert.equal(TANDEM_CONTRACT.minPrompts, 2);
});
