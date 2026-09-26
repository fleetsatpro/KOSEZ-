import assert from "node:assert/strict";
import { test } from "node:test";
import { pronlabEvidenceProjection } from "./evidence-projection.ts";
import { activityDescriptor } from "./evidence.server.ts";

test("Pron’Lab capture-only never becomes a numeric score", () => {
  const value = pronlabEvidenceProjection({
    score: 0,
    seconds: 4,
    assessment: "capture-only",
  });
  assert.equal(value.verifiedScore, null);
  assert.match(value.summary, /aucune note acoustique/);
});

test("Pron’Lab transcript is not represented as phonetic scoring", () => {
  const value = pronlabEvidenceProjection({
    score: 99,
    seconds: 4,
    assessment: "transcript",
  });
  assert.equal(value.verifiedScore, null);
  assert.match(value.summary, /aucune note phonétique/);
});

test("Only an explicitly phonetic provider score is rendered as a score", () => {
  const value = pronlabEvidenceProjection({
    score: 88,
    seconds: 4,
    assessment: "phonetic-provider",
  });
  assert.equal(value.verifiedScore, 88);
  assert.match(value.summary, /88\/100/);
});


test("organism-facing activity descriptors carry the same mineral semantics", () => {
  assert.equal(activityDescriptor("TANDEM_COMPLETED").mineral, "social");
  assert.equal(activityDescriptor("SPEAK_COMPLETED").mineral, "parole");
  assert.equal(activityDescriptor("CURRICULUM_EVIDENCE_RECORDED").mineral, "atelier");
  assert.equal(activityDescriptor("PRONLAB_COMPLETED").mineral, "pron");
  assert.equal(activityDescriptor("MISSION_COMPLETED").mineral, "mission");
});

test("non-growth planning records do not pretend to nourish a mineral", () => {
  assert.equal(activityDescriptor("unknown_planning_record").mineral, null);
});
