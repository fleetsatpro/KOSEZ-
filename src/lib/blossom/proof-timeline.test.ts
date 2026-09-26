import test from "node:test";
import assert from "node:assert/strict";
import { proofFromActivity, proofFromSubmission } from "./proof-timeline";

test("proof mapping is action-specific and never fabricates CEFR scores", () => {
  const item = proofFromActivity({ id: "1", type: "SPEAK_COMPLETED", createdAt: "2026-09-26T10:00:00.000Z", sourceId: "market", note: "3 réponses" });
  assert.equal(item?.kind, "speech");
  assert.equal(item?.href, "/osez/market");
  assert.equal(item?.detail, "3 réponses");
});

test("curriculum-link metadata is not shown as a second learner proof", () => {
  const item = proofFromActivity({ id: "2", type: "CURRICULUM_EVIDENCE_RECORDED", createdAt: "2026-09-26T10:00:00.000Z", sourceId: "lesson-1", note: null });
  assert.equal(item, null);
});

test("submissions remain evidence without claiming an external proficiency score", () => {
  const item = proofFromSubmission({ id: "3", kind: "writing", taskId: "write-1", createdAt: "2026-09-26T11:00:00.000Z" });
  assert.equal(item.kind, "learn");
  assert.equal(item.href, "/learn/labs");
});