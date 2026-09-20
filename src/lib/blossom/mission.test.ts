import assert from "node:assert/strict";
import { test } from "node:test";
import { TODAY_MISSION, LEARNER_MEMORY } from "./data.ts";
import {
  activeMissionRun,
  appendMissionAttempt,
  beginMissionRun,
  createMissionSession,
  evaluateMission,
  finishMissionRun,
  missionAttemptCount,
  missionExecutionReady,
  missionObjective,
  missionStepFromRun,
  reopenMissionRun,
  saveMissionReflection,
} from "./mission.ts";

test("mission runs persist and resume instead of resetting", () => {
  const first = beginMissionRun(createMissionSession("mission-today"), "practice", "core", "2026-09-20T07:00:00.000Z", "run-1");
  const resumed = beginMissionRun(first, "real-world", "stretch", "2026-09-20T07:05:00.000Z", "run-2");
  assert.equal(resumed.runs.length, 1);
  assert.equal(activeMissionRun(resumed)?.mode, "practice");
  assert.equal(activeMissionRun(resumed)?.id, "run-1");
});

test("completed runs create a new run while preserving history", () => {
  let session = beginMissionRun(createMissionSession("mission-today"), "real-world", "core", "2026-09-20T07:00:00.000Z", "run-1");
  session = appendMissionAttempt(session, {
    kind: "mission",
    capture: "manual",
    seconds: 0,
  }, "2026-09-20T07:02:00.000Z", "attempt-1");
  session = saveMissionReflection(session, {
    objectiveAchieved: true,
    stayedInTargetLanguage: "yes",
    confidence: 4,
    friction: "none",
  }, "2026-09-20T07:02:30.000Z");
  session = finishMissionRun(session, "2026-09-20T07:03:00.000Z");
  session = beginMissionRun(session, "practice", "core", "2026-09-20T08:00:00.000Z", "run-2");
  assert.equal(session.runs.length, 2);
  assert.equal(activeMissionRun(session)?.id, "run-2");
  assert.equal(session.runs[0]?.completedAt, "2026-09-20T07:03:00.000Z");
});

test("mission attempts preserve capture method and duration", () => {
  let session = beginMissionRun(createMissionSession("mission-today"), "practice", "core", "2026-09-20T07:00:00.000Z", "run-1");
  session = appendMissionAttempt(session, {
    kind: "warmup",
    capture: "microphone",
    seconds: 11,
  }, "2026-09-20T07:00:12.000Z", "attempt-1");
  const run = activeMissionRun(session);
  assert.equal(missionAttemptCount(run, "warmup"), 1);
  assert.equal(run?.attempts[0]?.seconds, 11);
  assert.equal(run?.attempts[0]?.capture, "microphone");
});

test("mission execution is limited to two attempts per run", () => {
  let session = beginMissionRun(createMissionSession("mission-today"), "practice", "core", "2026-09-20T07:00:00.000Z", "run-1");
  session = appendMissionAttempt(session, {
    kind: "mission",
    capture: "microphone",
    seconds: 8,
  }, "2026-09-20T07:00:09.000Z", "attempt-1");
  session = appendMissionAttempt(session, {
    kind: "mission",
    capture: "microphone",
    seconds: 12,
  }, "2026-09-20T07:00:22.000Z", "attempt-2");
  assert.equal(missionAttemptCount(activeMissionRun(session), "mission"), 2);
  assert.equal(missionExecutionReady(activeMissionRun(session)), false);
  const blocked = appendMissionAttempt(session, {
    kind: "mission",
    capture: "microphone",
    seconds: 20,
  }, "2026-09-20T07:00:30.000Z", "attempt-3");
  assert.equal(missionAttemptCount(activeMissionRun(blocked), "mission"), 2);
});

test("mission evaluation distinguishes evidence from invented audio scores", () => {
  const strong = evaluateMission({
    objectiveAchieved: true,
    stayedInTargetLanguage: "yes",
    confidence: 5,
    friction: "none",
  });
  assert.equal(strong.outcome, "advance");
  assert.equal(strong.evidenceCount, 3);

  const partial = evaluateMission({
    objectiveAchieved: true,
    stayedInTargetLanguage: "partly",
    confidence: 3,
    friction: "hesitation",
  });
  assert.equal(partial.outcome, "stabilise");

  const retry = evaluateMission({
    objectiveAchieved: false,
    stayedInTargetLanguage: "no",
    confidence: 2,
    friction: "switching",
  });
  assert.equal(retry.outcome, "repeat");
});

test("mission objective is explicit about success signals", () => {
  const objective = missionObjective(TODAY_MISSION, LEARNER_MEMORY, true);
  assert.equal(objective.successSignals.length, 3);
  assert.equal(objective.supportPhrase, "What do you recommend?");
  assert.match(objective.support, /Léo/);
  assert.ok(objective.stretch.length > 10);
});

test("reflection requires an execution and finishing preserves the completed run", () => {
  let session = beginMissionRun(createMissionSession("mission-today"), "real-world", "core", "2026-09-20T07:00:00.000Z", "run-1");
  const blocked = finishMissionRun(session, "2026-09-20T07:01:00.000Z");
  assert.equal(activeMissionRun(blocked)?.completedAt, null);
  const noExecutionReflection = saveMissionReflection(session, {
    objectiveAchieved: true,
    stayedInTargetLanguage: "yes",
    confidence: 4,
    friction: "none",
  }, "2026-09-20T07:01:30.000Z");
  assert.equal(activeMissionRun(noExecutionReflection)?.reflection, null);
  session = appendMissionAttempt(session, {
    kind: "mission",
    capture: "manual",
    seconds: 0,
  }, "2026-09-20T07:02:00.000Z", "attempt-1");
  session = saveMissionReflection(session, {
    objectiveAchieved: true,
    stayedInTargetLanguage: "yes",
    confidence: 4,
    friction: "confidence",
  }, "2026-09-20T07:02:30.000Z");
  const finished = finishMissionRun(session, "2026-09-20T07:03:00.000Z");
  assert.equal(activeMissionRun(finished)?.completedAt, "2026-09-20T07:03:00.000Z");
});


test("mission step resolver resumes at the correct stage", () => {
  assert.equal(missionStepFromRun(null), "brief");
  const started = beginMissionRun(
    createMissionSession("mission-today"),
    "practice",
    "core",
    "2026-09-20T09:00:00.000Z",
    "run-step",
  );
  assert.equal(missionStepFromRun(activeMissionRun(started)), "prepare");

  const executed = appendMissionAttempt(started, {
    kind: "mission",
    capture: "microphone",
    seconds: 9,
  }, "2026-09-20T09:00:10.000Z", "attempt-step");
  assert.equal(missionStepFromRun(activeMissionRun(executed)), "reflect");
});

test("previous outcome changes the next mission focus without changing its identity", () => {
  const repeat = missionObjective(TODAY_MISSION, LEARNER_MEMORY, true, "repeat");
  const stabilise = missionObjective(TODAY_MISSION, LEARNER_MEMORY, true, "stabilise");
  const advance = missionObjective(TODAY_MISSION, LEARNER_MEMORY, true, "advance");

  assert.equal(repeat.adaptation, "Sécuriser");
  assert.equal(stabilise.adaptation, "Stabiliser");
  assert.equal(advance.adaptation, "Prolonger");
  assert.notEqual(repeat.stretch, stabilise.stretch);
});


test("mission challenge is carried into the run and history", () => {
  const session = beginMissionRun(
    createMissionSession("mission-today"),
    "practice",
    "stretch",
    "2026-09-20T10:00:00.000Z",
    "run-challenge",
  );
  assert.equal(activeMissionRun(session)?.challenge, "stretch");
});


test("reopening a mission clears saved reflection without deleting execution history", () => {
  let session = beginMissionRun(
    createMissionSession("mission-today"),
    "practice",
    "core",
    "2026-09-20T11:00:00.000Z",
    "run-reopen",
  );
  session = appendMissionAttempt(session, {
    kind: "mission",
    capture: "manual",
    seconds: 0,
  }, "2026-09-20T11:01:00.000Z", "attempt-reopen");
  session = saveMissionReflection(session, {
    objectiveAchieved: true,
    stayedInTargetLanguage: "yes",
    confidence: 4,
    friction: "none",
  }, "2026-09-20T11:02:00.000Z");
  const reopened = reopenMissionRun(session, "2026-09-20T11:03:00.000Z");
  assert.equal(activeMissionRun(reopened)?.reflection, null);
  assert.equal(missionAttemptCount(activeMissionRun(reopened), "mission"), 1);
  assert.equal(missionStepFromRun(activeMissionRun(reopened)), "reflect");
});
