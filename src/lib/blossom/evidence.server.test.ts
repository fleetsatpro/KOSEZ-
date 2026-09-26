import assert from "node:assert/strict";
import { test } from "node:test";
import { pronlabEvidenceProjection } from "./evidence.server.ts";

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
