export const MAX_FUTURE_MUTATION_SKEW_MS = 5 * 60_000;

export function normalizeMutationTime(
  value?: string | null,
  nowMs = Date.now(),
): string | null {
  if (!value) return null;
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) return null;
  return new Date(
    Math.min(parsed, nowMs + MAX_FUTURE_MUTATION_SKEW_MS),
  ).toISOString();
}

export function causalTimestampIsAtLeast(
  candidate: string,
  current: string,
): boolean {
  return Date.parse(candidate) >= Date.parse(current);
}
