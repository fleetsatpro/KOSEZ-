import { randomUUID } from "node:crypto";
import { getSql } from "@/lib/db";

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

export async function getNotificationPreferences(
  userId: string,
): Promise<NotificationPreferences> {
  const sql = await getSql();
  const rows = await sql.query(
    "select kind, enabled from blossom_notification_preference where user_id = $1",
    [userId],
  );
  return normalizeNotificationPreferences(
    rows.map((row) => ({
      kind: String(row.kind),
      enabled: Boolean(row.enabled),
    })),
  );
}

export async function setNotificationPreference(
  userId: string,
  kind: NotificationPreferenceKind,
  enabled: boolean,
): Promise<NotificationPreferences> {
  const sql = await getSql();
  await sql.query(
    `insert into blossom_notification_preference (user_id, kind, enabled)
     values ($1, $2, $3)
     on conflict (user_id, kind) do update
       set enabled = excluded.enabled, updated_at = current_timestamp`,
    [userId, kind, enabled],
  );
  await sql.query(
    `insert into blossom_audit_event
      (id, actor_user_id, action, subject_user_id, resource_type, resource_id, metadata)
     values ($1::uuid, $2, $3, $2, 'notification_preference', $4, $5::jsonb)`,
    [
      randomUUID(),
      userId,
      `notification.preference.${enabled ? "enabled" : "disabled"}`,
      kind,
      JSON.stringify({ kind, enabled }),
    ],
  );
  return getNotificationPreferences(userId);
}

export async function shouldDeliverNotification(
  userId: string,
  kind: string,
): Promise<boolean> {
  if (kind === "system") return true;
  if (
    !NOTIFICATION_PREFERENCE_KINDS.includes(
      kind as NotificationPreferenceKind,
    )
  ) {
    return true;
  }
  const sql = await getSql();
  const rows = await sql.query(
    "select enabled from blossom_notification_preference where user_id = $1 and kind = $2 limit 1",
    [userId, kind],
  );
  return rows[0] ? Boolean(rows[0].enabled) : true;
}