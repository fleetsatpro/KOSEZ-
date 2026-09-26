import { randomUUID } from "node:crypto";
import { getSql } from "@/lib/db";
import { BlossomForbiddenError, createNotification, writeAuditEvent } from "./domain.server";

export type TeacherSession = {
  id: string;
  teacherUserId: string;
  learnerUserId: string;
  learnerName: string;
  title: string;
  startsAt: string;
  durationMinutes: number;
  notes: string | null;
  status: "scheduled" | "cancelled";
  createdAt: string;
  updatedAt: string;
};

async function assertTeacherLearnerRelation(teacherUserId: string, learnerUserId: string) {
  if (teacherUserId === learnerUserId) {
    throw new BlossomForbiddenError("Une séance exige un enseignant et un apprenant distincts.");
  }
  const sql = await getSql();
  const rows = await sql.query(
    `select 1
     from blossom_teacher_link
     where teacher_user_id = $1 and learner_user_id = $2 and status = 'active'
     union all
     select 1
     from blossom_organization_group g
     join blossom_organization_group_member gm
       on gm.group_id = g.id and gm.user_id = $2
     where g.teacher_user_id = $1 and g.status = 'active'
     limit 1`,
    [teacherUserId, learnerUserId],
  );
  if (!rows[0]) {
    throw new BlossomForbiddenError("Cet apprenant n’est pas rattaché à votre périmètre pédagogique.");
  }
}

function mapSession(row: Record<string, unknown>): TeacherSession {
  return {
    id: String(row.id),
    teacherUserId: String(row.teacher_user_id),
    learnerUserId: String(row.learner_user_id),
    learnerName: String(row.learner_name),
    title: String(row.title),
    startsAt: new Date(String(row.starts_at)).toISOString(),
    durationMinutes: Number(row.duration_minutes),
    notes: row.notes ? String(row.notes) : null,
    status: String(row.status) as TeacherSession["status"],
    createdAt: new Date(String(row.created_at)).toISOString(),
    updatedAt: new Date(String(row.updated_at)).toISOString(),
  };
}

async function loadTeacherSessions(
  whereSql: string,
  params: unknown[],
  limit: number,
): Promise<TeacherSession[]> {
  const sql = await getSql();
  const bounded = Math.min(50, Math.max(1, Math.round(limit)));
  const rows = await sql.query(
    `select
       s.id, s.teacher_user_id, s.learner_user_id,
       coalesce(nullif(p.display_name, ''), s.learner_user_id) as learner_name,
       s.title, s.starts_at, s.duration_minutes, s.notes, s.status,
       s.created_at, s.updated_at
     from blossom_teacher_session s
     left join blossom_profile p on p.user_id = s.learner_user_id
     where ${whereSql}
     order by s.starts_at asc
     limit ${bounded}`,
    params,
  );
  return rows.map(mapSession);
}

export async function getTeacherSessions(teacherUserId: string, limit = 20) {
  return loadTeacherSessions(
    "s.teacher_user_id = $1 and s.status = 'scheduled' and s.starts_at >= current_timestamp - interval '1 day'",
    [teacherUserId],
    limit,
  );
}

export async function getLearnerSessions(learnerUserId: string, limit = 20) {
  return loadTeacherSessions(
    "s.learner_user_id = $1 and s.status = 'scheduled' and s.starts_at >= current_timestamp - interval '1 day'",
    [learnerUserId],
    limit,
  );
}

export async function getGuardianSessions(
  guardianUserId: string,
  learnerUserId: string,
  limit = 20,
) {
  const sql = await getSql();
  const access = await sql.query(
    `select 1 from blossom_guardian_link
     where guardian_user_id = $1 and learner_user_id = $2 and status = 'active'
     limit 1`,
    [guardianUserId, learnerUserId],
  );
  if (!access[0]) {
    throw new BlossomForbiddenError("Cette programmation n'est pas disponible pour ce compte.");
  }
  return getLearnerSessions(learnerUserId, limit);
}

export async function createTeacherSession(
  teacherUserId: string,
  input: {
    learnerUserId: string;
    title: string;
    startsAt: string;
    durationMinutes: number;
    notes?: string | null;
  },
): Promise<TeacherSession> {
  await assertTeacherLearnerRelation(teacherUserId, input.learnerUserId);
  const startsAt = new Date(input.startsAt);
  if (Number.isNaN(startsAt.getTime()) || startsAt.getTime() < Date.now() - 60_000) {
    throw new BlossomForbiddenError("Une nouvelle séance doit être planifiée dans le futur.");
  }
  const title = input.title.trim();
  if (!title || title.length > 180) {
    throw new BlossomForbiddenError("Le titre de séance est requis.");
  }
  if (input.durationMinutes < 15 || input.durationMinutes > 180) {
    throw new BlossomForbiddenError("La durée doit être comprise entre 15 et 180 minutes.");
  }
  const notes = input.notes?.trim() || null;
  if (notes && notes.length > 2000) {
    throw new BlossomForbiddenError("Les notes de séance sont trop longues.");
  }

  const sql = await getSql();
  const id = randomUUID();
  const rows = await sql.query(
    `insert into blossom_teacher_session
      (id, teacher_user_id, learner_user_id, title, starts_at, duration_minutes, notes)
     values ($1::uuid, $2, $3, $4, $5::timestamptz, $6, $7)
     returning id, teacher_user_id, learner_user_id, title, starts_at, duration_minutes, notes, status, created_at, updated_at`,
    [id, teacherUserId, input.learnerUserId, title, startsAt.toISOString(), input.durationMinutes, notes],
  );
  if (!rows[0]) throw new Error("teacher-session-write-failed");

  const profile = await sql.query(
    "select coalesce(nullif(display_name, ''), user_id) as name from blossom_profile where user_id = $1 limit 1",
    [input.learnerUserId],
  );
  const session = mapSession({
    ...rows[0],
    learner_name: String(profile[0]?.name ?? input.learnerUserId),
  });

  await createNotification(input.learnerUserId, {
    kind: "learning",
    title: "Une séance a été planifiée",
    body: `${title} · ${new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short", timeZone: "Indian/Reunion" }).format(startsAt)}`,
    href: "/moi",
    metadata: { sessionId: id },
  });

  const guardians = await sql.query(
    "select guardian_user_id from blossom_guardian_link where learner_user_id = $1 and status = 'active'",
    [input.learnerUserId],
  );
  for (const guardian of guardians) {
    await createNotification(String(guardian.guardian_user_id), {
      kind: "learning",
      title: "Une séance a été planifiée",
      body: `${title} · ${new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short", timeZone: "Indian/Reunion" }).format(startsAt)}`,
      href: "/moi",
      metadata: { sessionId: id, learnerUserId: input.learnerUserId },
    });
  }

  await writeAuditEvent(teacherUserId, {
    action: "learning.session.scheduled",
    subjectUserId: input.learnerUserId,
    resourceType: "teacher_session",
    resourceId: id,
    metadata: { startsAt: startsAt.toISOString(), durationMinutes: input.durationMinutes },
  });

  return session;
}

export async function cancelTeacherSession(teacherUserId: string, sessionId: string) {
  const sql = await getSql();
  const rows = await sql.query(
    `update blossom_teacher_session
     set status = 'cancelled', updated_at = current_timestamp
     where id = $1::uuid and teacher_user_id = $2 and status = 'scheduled'
     returning id, teacher_user_id, learner_user_id, title, starts_at, duration_minutes, notes, status, created_at, updated_at`,
    [sessionId, teacherUserId],
  );
  if (!rows[0]) {
    throw new BlossomForbiddenError("Cette séance n'est plus disponible pour modification.");
  }

  const profile = await sql.query(
    "select coalesce(nullif(display_name, ''), user_id) as name from blossom_profile where user_id = $1 limit 1",
    [String(rows[0].learner_user_id)],
  );
  const session = mapSession({ ...rows[0], learner_name: String(profile[0]?.name ?? rows[0].learner_user_id) });

  await createNotification(session.learnerUserId, {
    kind: "learning",
    title: "Une séance a été annulée",
    body: session.title,
    href: "/moi",
    metadata: { sessionId },
  });

  const guardians = await sql.query(
    "select guardian_user_id from blossom_guardian_link where learner_user_id = $1 and status = 'active'",
    [session.learnerUserId],
  );
  for (const guardian of guardians) {
    await createNotification(String(guardian.guardian_user_id), {
      kind: "learning",
      title: "Une séance a été annulée",
      body: session.title,
      href: "/moi",
      metadata: { sessionId, learnerUserId: session.learnerUserId },
    });
  }

  await writeAuditEvent(teacherUserId, {
    action: "learning.session.cancelled",
    subjectUserId: session.learnerUserId,
    resourceType: "teacher_session",
    resourceId: sessionId,
  });

  return session;
}
