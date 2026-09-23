export const SERVER_AUTHORITATIVE_MINUTE_EVENTS = new Set([
  "SPEAK_COMPLETED",
  "TANDEM_COMPLETED",
]);

export function sanitizeSyncedActivity(
  eventType: string,
  payload: Record<string, unknown>,
  metadata: Record<string, unknown>,
) {
  if (!SERVER_AUTHORITATIVE_MINUTE_EVENTS.has(eventType)) {
    return { payload: { ...payload }, metadata: { ...metadata } };
  }

  const safePayload = { ...payload };
  const safeMetadata = { ...metadata };
  delete safePayload.minutes;
  delete safePayload.durationSeconds;
  delete safePayload.serverAuthoritativeMinutes;
  delete safeMetadata.minutes;
  delete safeMetadata.durationSeconds;
  delete safeMetadata.serverAuthoritativeMinutes;

  return { payload: safePayload, metadata: safeMetadata };
}
