import type { BlossomNotification } from "./activities.server";
import { BlossomForbiddenError } from "./access.server";
import { randomUUID } from "node:crypto";
import { getSql } from "@/lib/db";
import type { JsonObject } from "./backend.server";
import { shouldDeliverNotification } from "./notification-preferences.server";

export async function writeAuditEvent(
  actorUserId: string,
  input: {
    action: string;
    subjectUserId?: string | null;
    resourceType: string;
    resourceId?: string | null;
    metadata?: JsonObject;
  },
) {
  const sql = await getSql();
  await sql.query(
    "insert into blossom_audit_event (id, actor_user_id, action, subject_user_id, resource_type, resource_id, metadata) values ($1::uuid, $2, $3, $4, $5, $6, $7::jsonb)",
    [
      randomUUID(),
      actorUserId,
      input.action,
      input.subjectUserId ?? null,
      input.resourceType,
      input.resourceId ?? null,
      JSON.stringify(input.metadata ?? {}),
    ],
  );
}

export async function createNotification(
  userId: string,
  input: {
    kind: BlossomNotification["kind"];
    title: string;
    body: string;
    href?: string | null;
    metadata?: Record<string, unknown>;
  },
) {
  if (!(await shouldDeliverNotification(userId, input.kind))) {
    return null;
  }
  const sql = await getSql();
  const rows = await sql.query(
    `insert into blossom_notification (id, user_id, kind, title, body, href, metadata)
     values ($1::uuid, $2, $3, $4, $5, $6, $7::jsonb)
     returning id, kind, title, body, href, metadata, read_at, created_at`,
    [
      randomUUID(),
      userId,
      input.kind,
      input.title,
      input.body,
      input.href ?? null,
      JSON.stringify(input.metadata ?? {}),
    ],
  );
  return rows[0] ?? null;
}

export async function getNotifications(
  userId: string,
  limit = 30,
): Promise<BlossomNotification[]> {
  const sql = await getSql();
  const bounded = Math.min(100, Math.max(1, Math.round(limit)));
  const rows = await sql.query(
    `select id, kind, title, body, href, metadata, read_at, created_at
     from blossom_notification
     where user_id = $1
     order by created_at desc
     limit ${bounded}`,
    [userId],
  );
  return rows.map((row) => ({
    id: String(row.id),
    kind: String(row.kind) as BlossomNotification["kind"],
    title: String(row.title),
    body: String(row.body),
    href: row.href ? String(row.href) : null,
    metadata:
      row.metadata && typeof row.metadata === "object"
        ? (row.metadata as JsonObject)
        : {},
    readAt: row.read_at ? new Date(String(row.read_at)).toISOString() : null,
    createdAt: new Date(String(row.created_at)).toISOString(),
  }));
}

export async function markNotificationRead(userId: string, notificationId: string) {
  const sql = await getSql();
  const rows = await sql.query(
    `update blossom_notification
     set read_at = coalesce(read_at, current_timestamp)
     where id = $1::uuid and user_id = $2
     returning id, read_at`,
    [notificationId, userId],
  );
  if (!rows[0]) throw new BlossomForbiddenError("Cette notification n'est pas disponible.");
  return {
    id: String(rows[0].id),
    readAt: new Date(String(rows[0].read_at)).toISOString(),
  };
}

export type AdminBookingRow = {
  id: string;
  learnerUserId: string;
  learnerName: string;
  catalogueItemId: string;
  catalogueTitle: string;
  status: "requested" | "confirmed" | "cancelled";
  paymentStatus: "unpaid" | "paid" | "refunded";
  providerReference: string | null;
  createdAt: string;
  updatedAt: string;
};