import assert from "node:assert/strict";
import { test } from "node:test";
import { mergeMissionSessions } from "./sync-merge.ts";
import type { BackendMission } from "./sync-types.ts";
import type { MissionSession } from "./mission.ts";

const session = (id: string, updated: string): MissionSession => ({
  missionId: "m1",
  activeRunId: id,
  runs: [{
    id,
    mode: "practice",
    challenge: "core",
    startedAt: updated,
    lastUpdatedAt: updated,
    attempts: [],
    reflection: null,
    completedAt: null,
    supportUsed: false,
  }],
});

test("mission merge unions concurrent runs instead of dropping one", () => {
  const local = session("local", "2026-09-22T07:00:00.000Z");
  const remote: BackendMission = {
    session: session("remote", "2026-09-22T07:01:00.000Z"),
    revision: 3,
    updatedAt: "2026-09-22T07:01:00.000Z",
  };
  const merged = mergeMissionSessions(local, remote);
  assert.equal(merged.runs.length, 2);
  assert.equal(merged.activeRunId, "remote");
});

test("mission merge prefers the freshest reflection but preserves support evidence", () => {
  const local = session("same", "2026-09-22T07:02:00.000Z");
  local.runs[0].supportUsed = true;
  const remote: BackendMission = {
    session: {
      ...session("same", "2026-09-22T07:03:00.000Z"),
      runs: [{
        ...session("same", "2026-09-22T07:03:00.000Z").runs[0],
        reflection: {
          objectiveAchieved: true,
          stayedInTargetLanguage: "yes",
          confidence: 5,
          friction: "none",
        },
      }],
    },
    revision: 4,
    updatedAt: "2026-09-22T07:03:00.000Z",
  };
  const merged = mergeMissionSessions(local, remote);
  assert.equal(merged.runs[0].reflection?.confidence, 5);
  assert.equal(merged.runs[0].supportUsed, true);
});
