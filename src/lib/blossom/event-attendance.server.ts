import { randomUUID } from "node:crypto";
import { getSql } from "@/lib/db";
import { getPublishedContent } from "./content.server";
import { BlossomForbiddenError, createNotification, writeAuditEvent } from "./domain.server";
import { eventStartEpoch } from "./event-attendance";

export type AdminEventAttendanceRow = {
  eventId: string;
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  learnerUserId: string;
  learnerName: string;
  attendanceRecorded: boolean;
  recordedAt: string | null;
};

async function assertAdmin(userId: string) {
  const sql = await getSql();
  const rows = await sql.query(
    "select 1 from blossom_platform_admin where user_id = $1 and status = 'active' limit 1",
    [userId],
  );
  if (!rows[0]) throw new BlossomForbiddenError("Admin access is required.");
}

export async function getAdminEventAttendance(userId: string): Promise<AdminEventAttendanceRow[]> {
  await assertAdmin(userId);
  const { events } = await getPublishedContent();
  if (!events.length) return [];
  const sql = await getSql();
  const rows = await sql.query(
    `select r.event_id, r.user_id,
      coalesce(nullif(p.display_name, ''), r.user_id) as learner_name,
      a.recorded_at
     from blossom_event_registration r
     left join blossom_profile p on p.user_id = r.user_id
     left join blossom_event_attendance a
       on a.event_id = r.event_id and a.user_id = r.user_id
     where r.event_id = any($1::text[]) and r.status = 'joined'
     order by r.event_id, learner_name`,
    [events.map((event) => event.id)],
  );
  const byId = new Map(events.map((event) => [event.id, event]));
  return rows.flatMap((row) => {
    const event = byId.get(String(row.event_id));
    if (!event) return [];
    return [{
      eventId: String(row.event_id),
      eventTitle: event.title,
      eventDate: event.date,
      eventTime: event.time,
      learnerUserId: String(row.user_id),
      learnerName: String(row.learner_name),
      attendanceRecorded: Boolean(row.recorded_at),
      recordedAt: row.recorded_at ? new Date(String(row.recorded_at)).toISOString() : null,
    }];
  });
}

export async function recordEventAttendance(
  userId: string,
  input: { eventId: string; learnerUserId: string; note?: string },
) {
  await assertAdmin(userId);
  const { events } = await getPublishedContent();
  const event = events.find((entry) => entry.id === input.eventId);
  if (!event) throw new BlossomForbiddenError("Cet événement n'est plus publié.");
  if (Date.now() < eventStartEpoch(event)) {
    throw new BlossomForbiddenError("La présence ne peut pas être pointée avant le début de l’événement.");
  }
  const note = input.note?.trim() ?? "";
  if (note.length > 500) throw new BlossomForbiddenError("La note de présence est limitée à 500 caractères.");

  const sql = await getSql();
  const registration = await sql.query(
    "select 1 from blossom_event_registration where event_id = $1 and user_id = $2 and status = 'joined' limit 1",
    [input.eventId, input.learnerUserId],
  );
  if (!registration[0]) throw new BlossomForbiddenError("Seule une inscription confirmée peut recevoir une preuve de présence.");

  const attendance = await sql.query(
    `insert into blossom_event_attendance (event_id, user_id, recorded_by_user_id, note)
     values ($1, $2, $3, $4)
     on conflict (event_id, user_id) do nothing
     returning event_id, user_id, recorded_at`,
    [input.eventId, input.learnerUserId, userId, note || null],
  );

  if (attendance[0]) {
    await sql.query(
      `insert into blossom_activity_event
       (id, user_id, idempotency_key, event_type, source_id, payload, occurred_at)
       values ($1::uuid, $2, $3::uuid, 'EVENT_ATTENDED', $4, $5::jsonb, current_timestamp)
       on conflict (user_id, idempotency_key) do nothing`,
      [
        randomUUID(),
        input.learnerUserId,
        randomUUID(),
        input.eventId,
        JSON.stringify({ metadata: { eventId: input.eventId, recordedBy: userId } }),
      ],
    );
    await writeAuditEvent(userId, {
      action: "event.attendance.recorded",
      subjectUserId: input.learnerUserId,
      resourceType: "event_attendance",
      resourceId: input.eventId + ":" + input.learnerUserId,
      metadata: { note: note || null },
    });
    await createNotification(input.learnerUserId, {
      kind: "event",
      title: "Présence enregistrée",
      body: event.title,
      href: "/explore",
      metadata: { eventId: input.eventId },
    });
  }

  const current = attendance[0] ?? (
    await sql.query(
      "select event_id, user_id, recorded_at from blossom_event_attendance where event_id = $1 and user_id = $2",
      [input.eventId, input.learnerUserId],
    )
  )[0];
  if (!current) throw new Error("event-attendance-write-failed");
  return {
    eventId: String(current.event_id),
    learnerUserId: String(current.user_id),
    recordedAt: new Date(String(current.recorded_at)).toISOString(),
    recorded: Boolean(attendance[0]),
  };
}
