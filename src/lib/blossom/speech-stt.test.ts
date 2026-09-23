import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  appendSpeechTurn,
  captureOnlyEvidence,
  emptySpeechSummary,
  skippedEvidence,
  speechAttemptNote,
  weaveSpeechIntoDebrief,
} from "./speech-stt.ts";
import { summarisePronlabItem, type PronlabAttempt } from "./engine.ts";

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

  it("skipped evidence has zero seconds", () => {
    const e = skippedEvidence();
    assert.equal(e.assessment, "skipped");
    assert.equal(e.seconds, 0);
  });

  it("speechAttemptNote never invents a score", () => {
    const note = speechAttemptNote(captureOnlyEvidence(4));
    assert.ok(!note.match(/\d{2,3}\s*%/));
    assert.ok(note.includes("capturée") || note.includes("inventé"));
  });
});

describe("pronlab practice mastery without scores", () => {
  it("does not master on a single short capture", () => {
    const attempts: PronlabAttempt[] = [
      {
        id: "1",
        itemId: "x",
        score: 0,
        tip: "",
        createdAt: new Date().toISOString(),
        seconds: 1,
        metadata: { assessment: "capture-only" },
      },
    ];
    assert.equal(summarisePronlabItem("x", attempts).mastered, false);
  });

  it("masters after two solid practice captures", () => {
    const attempts: PronlabAttempt[] = [
      {
        id: "1",
        itemId: "x",
        score: 0,
        tip: "",
        createdAt: new Date().toISOString(),
        seconds: 3,
        metadata: { assessment: "capture-only" },
      },
      {
        id: "2",
        itemId: "x",
        score: 0,
        tip: "",
        createdAt: new Date().toISOString(),
        seconds: 4,
        metadata: { assessment: "capture-only" },
      },
    ];
    assert.equal(summarisePronlabItem("x", attempts).mastered, true);
  });
});
