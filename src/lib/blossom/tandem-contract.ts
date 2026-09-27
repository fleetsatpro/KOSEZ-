export const TANDEM_HALF_DURATION_SECONDS = 30 * 60;
export const TANDEM_TOTAL_DURATION_SECONDS = TANDEM_HALF_DURATION_SECONDS * 2;

export const TANDEM_CONTRACT = {
  halfMinutes: TANDEM_HALF_DURATION_SECONDS / 60,
  totalMinutes: TANDEM_TOTAL_DURATION_SECONDS / 60,
  minParticipants: 2,
  minPrompts: 2,
} as const;
