export const NOTIFICATION_PREFERENCE_KINDS = [
  "homework",
  "booking",
  "event",
  "tandem",
  "learning",
  "communication",
] as const;

export type NotificationPreferenceKind =
  (typeof NOTIFICATION_PREFERENCE_KINDS)[number];

export type NotificationPreferences = Record<
  NotificationPreferenceKind,
  boolean
>;

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  homework: true,
  booking: true,
  event: true,
  tandem: true,
  learning: true,
  communication: true,
};

export function normalizeNotificationPreferences(
  rows: Array<{ kind: string; enabled: boolean }>,
): NotificationPreferences {
  const next = { ...DEFAULT_NOTIFICATION_PREFERENCES };
  for (const row of rows) {
    if (row.kind in next) {
      next[row.kind as NotificationPreferenceKind] = Boolean(row.enabled);
    }
  }
  return next;
}