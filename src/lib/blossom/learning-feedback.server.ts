import { randomUUID } from "node:crypto";
import { getSql } from "@/lib/db";
import type { JsonObject } from "./backend.server";
import {
  BlossomForbiddenError,
  createNotification,
  writeAuditEvent,
} from "./domain.server";

export type LearningFeedbackRow = {
  id: string;
  submissionId: string;
  teacherUserId: string;
  learnerUserId: string;
  body: string;
  rubric: Record<string, string | number | boolean | null>;
  createdAt: string;
  updatedAt: string;
};

export type LearningFeedbackBundle = {
  submissionId: string;
  taskId: string;
  kind: "grammar" | "listening" | "writing" | "review";
  content: string;
  checks: string[];
  result: JsonObject;
  createdAt: string;
  feedback: LearningFeedbackRow | null;
};

async function assertTeacherRelation(teacherUserId: string, learnerUserId: string) {
  if (teacherUserId === learnerUserId) {
    throw new BlossomForbiddenError("Un enseignant et un apprenant doivent être distincts.");
  }
  const sql = await getSql();
  const rows = await sql.query(
    "select 1 from blossom_teacher_link where teacher_user_id = $1 and learner_user_id = $2 and status = 'active' limit 1",
    [teacherUserId, learnerUserId],
  );
  if (!rows[0]) {
    const org = await sql.query(
      "select 1 from blossom_organization_member staff join blossom_organization_member learner on learner.organization_id = staff.organization_id where staff.user_id = $1 and staff.status = 'active' and staff.role in ('owner','admin','teacher') and learner.user_id = $2 and learner.status = 'active' and learner.role = 'learner' limit 1",
      [teacherUserId, learnerUserId],
    );
    if (!org[0]) {
      throw new BlossomForbiddenError("Ce lien pédagogique n'est plus actif.");
    }
  }
}

function jsonObject(value: unknown): JsonObject {
  try {
    const parsed = JSON.parse(JSON.stringify(value));
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return parsed as JsonObject;
  } catch {
    return {};
  }
}

function mapFeedback(row: Record<string, unknown>): LearningFeedbackRow {
  const rubric =
    row.rubric && typeof row.rubric === "object"
      ? Object.fromEntries(
          Object.entries(row.rubric).filter(
            ([, value]) =>
              value === null ||
              typeof value === "string" ||
              typeof value === "number" ||
              typeof value === "boolean",
          ),
        )
      : {};
  return {
    id: String(row.id),
    submissionId: String(row.submission_id),
    teacherUserId: String(row.teacher_user_id),
    learnerUserId: String(row.learner_user_id),
    body: String(row.body),
    rubric,
    createdAt: new Date(String(row.created_at)).toISOString(),
    updatedAt: new Date(String(row.updated_at)).toISOString(),
  };
}

export async function getLearningFeedbackBundle(
  teacherUserId: string,
  learnerUserId: string,
  limit = 24,
): Promise<LearningFeedbackBundle[]> {
  await assertTeacherRelation(teacherUserId, learnerUserId);
  const sql = await getSql();
  const bounded = Math.min(50, Math.max(1, Math.round(limit)));
  const rows = await sql.query(
    "select s.id as submission_id, s.task_id, s.kind, s.content, s.checks, s.result, s.created_at, f.id, f.teacher_user_id, f.learner_user_id, f.body, f.rubric, f.updated_at as feedback_updated_at, f.created_at as feedback_created_at from blossom_learning_submission s left join blossom_learning_feedback f on f.submission_id = s.id and f.teacher_user_id = $1 where s.user_id = $2 order by s.created_at desc limit " + bounded,
    [teacherUserId, learnerUserId],
  );
  return rows.map((row) => ({
    submissionId: String(row.submission_id),
    taskId: String(row.task_id),
    kind: String(row.kind) as LearningFeedbackBundle["kind"],
    content: String(row.content),
    checks: Array.isArray(row.checks) ? row.checks.map(String) : [],
    result: jsonObject(row.result),
    createdAt: new Date(String(row.created_at)).toISOString(),
    feedback: row.id ? mapFeedback({
      id: row.id,
      submission_id: row.submission_id,
      teacher_user_id: row.teacher_user_id,
      learner_user_id: row.learner_user_id,
      body: row.body,
      rubric: row.rubric,
      created_at: row.feedback_created_at,
      updated_at: row.feedback_updated_at,
    }) : null,
  }));
}

export async function saveLearningFeedback(
  teacherUserId: string,
  input: {
    submissionId: string;
    learnerUserId: string;
    body: string;
    rubric?: Record<string, string | number | boolean | null>;
  },
): Promise<LearningFeedbackRow> {
  await assertTeacherRelation(teacherUserId, input.learnerUserId);
  const body = input.body.trim();
  if (body.length < 1 || body.length > 4000) {
    throw new BlossomForbiddenError("Le retour enseignant doit contenir entre 1 et 4000 caractères.");
  }
  const sql = await getSql();
  const submission = await sql.query(
    "select id, user_id, task_id from blossom_learning_submission where id = $1::uuid and user_id = $2 limit 1",
    [input.submissionId, input.learnerUserId],
  );
  if (!submission[0]) {
    throw new BlossomForbiddenError("Cette production n'est plus disponible.");
  }
  const rows = await sql.query(
    "insert into blossom_learning_feedback (id, submission_id, teacher_user_id, learner_user_id, body, rubric) values ($1::uuid, $2::uuid, $3, $4, $5, $6::jsonb) on conflict (submission_id, teacher_user_id) do update set body = excluded.body, rubric = excluded.rubric, updated_at = current_timestamp returning id, submission_id, teacher_user_id, learner_user_id, body, rubric, created_at, updated_at",
    [
      randomUUID(),
      input.submissionId,
      teacherUserId,
      input.learnerUserId,
      body,
      JSON.stringify(input.rubric ?? {}),
    ],
  );
  if (!rows[0]) throw new Error("learning-feedback-write-failed");
  await createNotification(input.learnerUserId, {
    kind: "learning",
    title: "Retour de votre enseignant",
    body: body.length > 140 ? body.slice(0, 137) + "…" : body,
    href: "/moi",
    metadata: { submissionId: input.submissionId, taskId: String(submission[0].task_id) },
  });
  await writeAuditEvent(teacherUserId, {
    action: "learning.feedback.saved",
    subjectUserId: input.learnerUserId,
    resourceType: "learning_submission",
    resourceId: input.submissionId,
  });
  return mapFeedback(rows[0]);
}

export async function getLearnerFeedback(
  actorUserId: string,
  learnerUserId = actorUserId,
  limit = 24,
): Promise<LearningFeedbackRow[]> {
  if (actorUserId !== learnerUserId) {
    const sql = await getSql();
    const allowed = await sql.query(
      "select 1 from blossom_teacher_link where teacher_user_id = $1 and learner_user_id = $2 and status = 'active' union all select 1 from blossom_guardian_link where guardian_user_id = $1 and learner_user_id = $2 and status = 'active' union all select 1 from blossom_platform_admin where user_id = $1 and status = 'active' limit 1",
      [actorUserId, learnerUserId],
    );
    if (!allowed[0]) throw new BlossomForbiddenError("Vous n'avez pas accès à ces retours.");
  }
  const sql = await getSql();
  const bounded = Math.min(50, Math.max(1, Math.round(limit)));
  const rows = await sql.query(
    "select id, submission_id, teacher_user_id, learner_user_id, body, rubric, created_at, updated_at from blossom_learning_feedback where learner_user_id = $1 order by updated_at desc limit " + bounded,
    [learnerUserId],
  );
  return rows.map(mapFeedback);
}
