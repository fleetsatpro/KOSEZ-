import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  appendSpeechTurn,
  captureOnlyEvidence,
  emptySpeechSummary,
  weaveSpeechIntoDebrief,
} from "./speech-stt.ts";

describe("speech-stt honesty", () => {
  it("starts empty", () => {
    const s = emptySpeechSummary();
    assert.equal(s.turns.length, 0);
    assert.equal(s.transcriptCount, 0);
  });

  it("accumulates capture-only without inventing transcript", () => {
    let s = emptySpeechSummary();
    s = appendSpeechTurn(s, captureOnlyEvidence(4));
    s = appendSpeechTurn(s, captureOnlyEvidence(6));
    assert.equal(s.spokenSeconds, 10);
    assert.equal(s.transcriptCount, 0);
    assert.equal(s.captureOnlyCount, 2);
    assert.equal(s.highlight, undefined);
  });

  it("weaves transcript into speech note when present", () => {
    let s = emptySpeechSummary();
    s = appendSpeechTurn(s, {
      seconds: 3,
      assessment: "transcript",
      transcript: "I'd like a vanilla coffee please",
      at: new Date().toISOString(),
    });
    const d = weaveSpeechIntoDebrief(
      {
        strength: "Clarté",
        improvement: "Ralentir",
        model: "Could I have…",
      },
      s,
    );
    assert.ok(d.speechNote.includes("vanilla coffee"));
    assert.ok(d.speechNote.includes("transcrit"));
  });

  it("honest capture-only debrief copy", () => {
    let s = emptySpeechSummary();
    s = appendSpeechTurn(s, captureOnlyEvidence(5));
    const d = weaveSpeechIntoDebrief(
      { strength: "A", improvement: "B", model: "C" },
      s,
    );
    assert.ok(d.speechNote.includes("rien n'est inventé") || d.speechNote.includes("capturée"));
  });
});
