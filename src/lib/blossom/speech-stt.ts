/**
 * Speech capture → STT evidence (honest).
 * Without a configured provider, returns capture-only — never invents scores or transcripts.
 */

export type SpeechAssessment =
  | "transcript"
  | "capture-only"
  | "skipped"
  | "error";

export type SpeechTurnEvidence = {
  seconds: number;
  assessment: SpeechAssessment;
  transcript?: string;
  language?: string;
  providerId?: string;
  at: string;
};

export type SessionSpeechSummary = {
  turns: SpeechTurnEvidence[];
  spokenSeconds: number;
  transcriptCount: number;
  captureOnlyCount: number;
  /** Best short snippet for debrief (when any transcript exists) */
  highlight?: string;
};

export function emptySpeechSummary(): SessionSpeechSummary {
  return {
    turns: [],
    spokenSeconds: 0,
    transcriptCount: 0,
    captureOnlyCount: 0,
  };
}

export function appendSpeechTurn(
  summary: SessionSpeechSummary,
  turn: SpeechTurnEvidence,
): SessionSpeechSummary {
  const turns = [...summary.turns, turn].slice(-12);
  const spokenSeconds = turns.reduce((s, t) => s + Math.max(0, t.seconds), 0);
  const transcriptCount = turns.filter((t) => t.assessment === "transcript").length;
  const captureOnlyCount = turns.filter((t) => t.assessment === "capture-only").length;
  const withText = turns
    .map((t) => t.transcript?.trim())
    .filter((t): t is string => Boolean(t && t.length > 2));
  const highlight = withText.length
    ? withText[withText.length - 1]!.slice(0, 160)
    : undefined;
  return {
    turns,
    spokenSeconds,
    transcriptCount,
    captureOnlyCount,
    highlight,
  };
}

export function captureOnlyEvidence(seconds: number): SpeechTurnEvidence {
  return {
    seconds: Math.max(0, Math.round(seconds)),
    assessment: "capture-only",
    at: new Date().toISOString(),
  };
}

export function skippedEvidence(): SpeechTurnEvidence {
  return {
    seconds: 0,
    assessment: "skipped",
    at: new Date().toISOString(),
  };
}

/** Weave honest speech evidence into debrief copy (French learner-facing). */
export function weaveSpeechIntoDebrief(
  base: { strength: string; improvement: string; model: string },
  summary: SessionSpeechSummary,
): { strength: string; improvement: string; model: string; speechNote: string } {
  if (summary.transcriptCount > 0 && summary.highlight) {
    return {
      strength: base.strength,
      improvement: base.improvement,
      model: base.model,
      speechNote: `Vous avez dit : « ${summary.highlight} » — ${summary.transcriptCount} tour${summary.transcriptCount > 1 ? "s" : ""} transcrit${summary.transcriptCount > 1 ? "s" : ""}, ${summary.spokenSeconds}s de parole.`,
    };
  }
  if (summary.spokenSeconds > 0 || summary.captureOnlyCount > 0) {
    return {
      strength: base.strength,
      improvement: base.improvement,
      model: base.model,
      speechNote: `Parole capturée · ${summary.spokenSeconds}s · ${summary.captureOnlyCount || summary.turns.length} prise${(summary.captureOnlyCount || summary.turns.length) > 1 ? "s" : ""}. L'analyse phonétique s'activera lorsqu'un moteur sera branché — rien n'est inventé.`,
    };
  }
  return {
    strength: base.strength,
    improvement: base.improvement,
    model: base.model,
    speechNote: "Session sans enregistrement micro — le geste compte quand même.",
  };
}

/** Client: blob → base64 for server fn (capped). */
export async function blobToBase64(blob: Blob, maxBytes = 1_200_000): Promise<string | null> {
  if (blob.size <= 0 || blob.size > maxBytes) return null;
  const buffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}
