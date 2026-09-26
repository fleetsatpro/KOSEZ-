export function pronlabEvidenceProjection(input: {
  score: number;
  seconds: number;
  assessment: unknown;
}) {
  const assessment = typeof input.assessment === "string" ? input.assessment : null;
  const verified =
    assessment === "phonetic-provider" &&
    Number.isFinite(input.score) &&
    input.score > 0;

  return {
    verifiedScore: verified ? Number(input.score) : null,
    summary:
      assessment === "capture-only"
        ? `Capture de ${Math.max(0, Number(input.seconds) || 0)} s · aucune note acoustique affirmée.`
        : assessment === "transcript"
          ? `Transcription de ${Math.max(0, Number(input.seconds) || 0)} s · aucune note phonétique affirmée.`
          : verified
            ? `Observation phonétique ${Number(input.score)}/100 · source vérifiée déclarée.`
            : `Prise enregistrée · aucune note phonétique vérifiée disponible.`,
  };
}
