import { getSql } from "@/lib/db";
import { z } from "zod";
import {
  appendBlossomActivity,
  saveBlossomMissionSession,
  upsertBlossomProfile,
  type JsonObject,
  type JsonValue,
} from "./backend.server";
import {
  completeChallenge,
  recordPronlabAttempt,
  registerEvent,
  saveVocabulary,
  setTandemStatus,
  saveLearningSubmission,
  requestCatalogueBooking,
  requestWaitlist,
  addTeacherNote,
  saveHomework,
  completeHomeworkForLearner,
} from "./domain.server";
import { reportTandem } from "./safety.server";
import { SYNC_OPERATIONS, type SyncMutation, type SyncResult } from "./sync-types";
import { CURRICULUM_UNITS, type LessonKind } from "./learning-os";
import { GRAMMAR_TASKS, LISTENING_TASKS, WRITING_PROMPTS, evaluateWritingStructure } from "./lab-content";

const SYNC_TIMEOUT_MS = 120_000;

function objectValue(value: unknown): JsonObject {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as JsonObject;
}

export async function assertCurriculumEvidence(
  userId: string,
  lessonId: string,
  metadata: Record<string, unknown>,
) {
  const lesson = CURRICULUM_UNITS.flatMap((unit) => unit.lessons).find((item) => item.id === lessonId);
  if (!lesson) throw new Error("curriculum-lesson-unknown");
  const supportId = stringValue(metadata.supportId);
  if (!supportId) throw new Error("curriculum-evidence-missing-support");

  const sql = await getSql();
  const checks: Record<LessonKind, () => Promise<boolean>> = {
    mission: async () => Boolean((await sql.query("select 1 from blossom_activity_event where user_id = $1 and event_type = 'MISSION_COMPLETED' and source_id = $2 limit 1", [userId, supportId]))[0]),
    speak: async () => Boolean((await sql.query("select 1 from blossom_activity_event where user_id = $1 and event_type = 'SPEAK_COMPLETED' and source_id = $2 limit 1", [userId, supportId]))[0]),
    pronlab: async () => Boolean((await sql.query("select 1 from blossom_pronlab_attempt where user_id = $1 and item_id = $2 limit 1", [userId, supportId]))[0]),
    review: async () => Boolean((await sql.query("select 1 from blossom_activity_event where user_id = $1 and event_type = 'REVIEW_COMPLETED' and source_id = $2 limit 1", [userId, supportId]))[0]),
    grammar: async () => Boolean((await sql.query("select 1 from blossom_learning_submission where user_id = $1 and task_id = $2 and kind = 'grammar' limit 1", [userId, supportId]))[0]),
    listening: async () => Boolean((await sql.query("select 1 from blossom_learning_submission where user_id = $1 and task_id = $2 and kind = 'listening' limit 1", [userId, supportId]))[0]),
    writing: async () => Boolean((await sql.query("select 1 from blossom_learning_submission where user_id = $1 and task_id = $2 and kind = 'writing' limit 1", [userId, supportId]))[0]),
    library: async () => Boolean((await sql.query(
      "select 1 from blossom_activity_event where user_id = $1 and event_type = 'LIBRARY_COMPLETED' and source_id = $2 limit 1",
      [userId, supportId],
    ))[0]),
  };

  if (lesson.taskId && supportId !== lesson.taskId) {
    throw new Error("curriculum-evidence-wrong-task");
  }

  if (!(await checks[lesson.kind]())) throw new Error("curriculum-evidence-without-support");
}


function jsonValue(value: unknown): JsonValue {
  try {
    const encoded = JSON.stringify(value);
    return encoded === undefined ? null : (JSON.parse(encoded) as JsonValue);
  } catch {
    return null;
  }
}

function stringValue(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function intValue(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.round(value)
    : fallback;
}

function boundedJson(value: unknown, maxBytes: number, maxKeys = 40) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  if (Object.keys(value as Record<string, unknown>).length > maxKeys) return false;
  try {
    return JSON.stringify(value).length <= maxBytes;
  } catch {
    return false;
  }
}

async function claimMutation(
  userId: string,
  mutation: SyncMutation,
): Promise<"claimed" | "duplicate" | "busy"> {
  const sql = await getSql();
  const inserted = await sql.query(
    "insert into blossom_sync_mutation (mutation_id, user_id, device_id, operation, entity_id, payload, expected_revision, status, created_at, updated_at) values ($1::uuid, $2, $3, $4, $5, $6::jsonb, $7, 'processing', coalesce($8::timestamptz, current_timestamp), current_timestamp) on conflict (mutation_id) do nothing returning mutation_id",
    [
      mutation.mutationId,
      userId,
      mutation.deviceId,
      mutation.operation,
      mutation.entityId,
      JSON.stringify(mutation.payload),
      mutation.expectedRevision ?? null,
      mutation.createdAt,
    ],
  );
  if (inserted[0]) return "claimed";

  const rows = await sql.query(
    "select status, updated_at from blossom_sync_mutation where mutation_id = $1::uuid and user_id = $2",
    [mutation.mutationId, userId],
  );
  if (!rows[0]) return "busy";

  const status = String(rows[0].status);
  if (status === "applied" || status === "conflict" || status === "rejected") return "duplicate";

  const claimed = await sql.query(
    "update blossom_sync_mutation set status = 'processing', updated_at = current_timestamp where mutation_id = $1::uuid and user_id = $2 and (status = 'pending' or (status = 'processing' and updated_at < current_timestamp - interval '2 minutes')) returning mutation_id",
    [mutation.mutationId, userId],
  );
  return claimed[0] ? "claimed" : "busy";
}

const operationSchema = z.enum(SYNC_OPERATIONS);

const mutationSchema = z.object({
  mutationId: z.string().uuid(),
  deviceId: z.string().trim().min(10).max(200),
  operation: operationSchema,
  entityId: z.string().trim().min(1).max(200),
  expectedRevision: z.number().int().nonnegative().optional(),
  payload: z.record(z.string(), z.unknown()),
  createdAt: z.string().datetime(),
});

const activityPayloadSchema = z.object({
  eventType: z.string().trim().min(1).max(100),
  sourceId: z.string().trim().max(200).nullable().optional(),
  payload: z.record(z.string(), z.unknown()).optional().refine((value) => boundedJson(value, 12000, 40)),
  metadata: z.record(z.string(), z.unknown()).optional().refine((value) => boundedJson(value, 8000, 24)),
  occurredAt: z.string().datetime().optional(),
});

const missionPayloadSchema = z.object({
  session: z.unknown(),
});

const pronlabPayloadSchema = z.object({
  itemId: z.string().trim().min(1).max(120),
  score: z.number().int().min(0).max(100),
  seconds: z.number().int().nonnegative().max(3600),
  tip: z.string().trim().max(500).nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).optional().refine((value) => boundedJson(value, 8000, 24)),
});

const vocabularyPayloadSchema = z.object({
  word: z.string().trim().min(1).max(120),
  gloss: z.string().trim().min(1).max(240),
  metadata: z.record(z.string(), z.unknown()).optional().refine((value) => boundedJson(value, 8000, 24)),
});

const eventPayloadSchema = z.object({
  status: z.enum(["joined", "waitlist", "cancelled"]),
});

const tandemPayloadSchema = z.object({
  status: z.enum(["suggested", "pending", "accepted", "blocked", "paused"]),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

const tandemReportPayloadSchema = z.object({
  reason: z.string().trim().max(500).optional(),
  previousStatus: z.enum(["suggested", "pending", "accepted", "blocked", "paused"]).optional(),
});


const submissionPayloadSchema = z.object({
  taskId: z.string().trim().min(1).max(160),
  kind: z.enum(["grammar", "listening", "writing", "review"]),
  content: z.string().max(20000),
  checks: z.array(z.string().trim().max(160)).max(24).optional(),
  result: z.record(z.string(), z.unknown()).optional(),
});

function validateLearningSubmission(payload: z.infer<typeof submissionPayloadSchema>) {
  if (payload.kind === "grammar") {
    const task = GRAMMAR_TASKS.find((item) => item.id === payload.taskId);
    if (!task) throw new Error("unknown-grammar-task");
    const correct = payload.content === task.answer;
    const expectedChecks = [correct ? "correct" : "incorrect"];
    if (JSON.stringify(payload.checks ?? []) !== JSON.stringify(expectedChecks)) {
      throw new Error("forged-grammar-checks");
    }
    return {
      checks: expectedChecks,
      result: { ...objectValue(payload.result), correct, target: task.target },
    };
  }
  if (payload.kind === "listening") {
    const task = LISTENING_TASKS.find((item) => item.id === payload.taskId);
    if (!task) throw new Error("unknown-listening-task");
    const correct = payload.content === task.answer;
    const expectedChecks = [correct ? "correct" : "incorrect"];
    if (JSON.stringify(payload.checks ?? []) !== JSON.stringify(expectedChecks)) {
      throw new Error("forged-listening-checks");
    }
    return {
      checks: expectedChecks,
      result: { ...objectValue(payload.result), correct, level: task.level },
    };
  }
  if (payload.kind === "writing") {
    const prompt = WRITING_PROMPTS.find((item) => item.id === payload.taskId);
    if (!prompt) throw new Error("unknown-writing-task");
    const evaluation = evaluateWritingStructure(prompt, payload.content);
    if (JSON.stringify(payload.checks ?? []) !== JSON.stringify(evaluation.passed)) {
      throw new Error("forged-writing-checks");
    }
    return {
      checks: evaluation.passed,
      result: {
        ...objectValue(payload.result),
        checkCount: evaluation.passed.length,
        checkTotal: evaluation.total,
        structureScore: evaluation.score,
        method: evaluation.method,
      },
    };
  }
  return {
    checks: payload.checks ?? [],
    result: payload.result ?? {},
  };
}

const profilePayloadSchema = z.object({
  displayName: z.string().trim().max(120).nullable().optional(),
  targetLanguage: z.string().trim().min(2).max(16),
  level: z.string().trim().max(16).nullable().optional(),
  timezone: z.string().trim().max(80).nullable().optional(),
  preferences: z.record(z.string(), z.unknown())
    .optional()
    .refine((value) => boundedJson(value, 12000, 40)),
});

const catalogueBookingPayloadSchema = z.object({
  catalogueItemId: z.string().trim().min(1).max(160),
});

const waitlistPayloadSchema = z.object({
  itemId: z.string().trim().min(1).max(160),
});

const analyticsPayloadSchema = z.object({
  name: z.string().trim().min(1).max(120),
  occurredAt: z.string().datetime(),
  props: z
    .record(
      z.string().trim().max(80),
      z.union([z.string().max(500), z.number().finite(), z.boolean()]),
    )
    .refine((value) => Object.keys(value).length <= 24)
    .refine(
      (value) =>
        !Object.keys(value).some((key) =>
          /password|secret|token|authorization|cookie|email|phone|address/i.test(key),
        ),
      "analytics-sensitive-field",
    ),
});

const teacherNotePayloadSchema = z.object({
  id: z.string().uuid().optional(),
  learnerUserId: z.string().trim().min(1).max(200),
  tags: z.array(z.string().trim().min(1).max(60)).max(20),
  note: z.string().trim().max(5000),
});

const teacherHomeworkPayloadSchema = z.object({
  id: z.string().uuid().optional(),
  learnerUserId: z.string().trim().min(1).max(200),
  title: z.string().trim().min(1).max(200),
  body: z.string().trim().min(1).max(5000),
  status: z.enum(["draft", "sent"]),
});

const homeworkCompletePayloadSchema = z.object({
  homeworkId: z.string().uuid(),
});


async function storeResult(
  userId: string,
  mutationId: string,
  status: "applied" | "conflict" | "rejected",
  result: Record<string, unknown>,
  errorCode?: string,
) {
  const sql = await getSql();
  await sql.query(
    "update blossom_sync_mutation set status = $3, result = $4::jsonb, error_code = $5, updated_at = current_timestamp, applied_at = case when $3 = 'applied' then current_timestamp else applied_at end where mutation_id = $1::uuid and user_id = $2",
    [mutationId, userId, status, JSON.stringify(result), errorCode ?? null],
  );
}

async function applyMutation(
  userId: string,
  mutation: SyncMutation,
): Promise<SyncResult> {
  switch (mutation.operation) {
    case "activity.append": {
      const payload = activityPayloadSchema.parse(mutation.payload);
      if (payload.eventType === "CURRICULUM_EVIDENCE_RECORDED") {
        await assertCurriculumEvidence(
          userId,
          payload.sourceId ?? mutation.entityId,
          objectValue(payload.metadata),
        );
      }
      await appendBlossomActivity(userId, {
        eventType: payload.eventType,
        sourceId: payload.sourceId ?? null,
        payload: {
          ...objectValue(payload.payload),
          metadata: objectValue(payload.metadata),
        },
        idempotencyKey: mutation.mutationId,
        occurredAt: payload.occurredAt,
      });
      return { mutationId: mutation.mutationId, status: "applied" };
    }
    case "mission.save": {
      const payload = missionPayloadSchema.parse(mutation.payload);
      const session = payload.session;
      const expectedRevision = mutation.expectedRevision ?? 0;
      const result = await saveBlossomMissionSession(
        userId,
        mutation.entityId,
        jsonValue(session),
        expectedRevision,
        mutation.mutationId,
      );
      if (!result.ok) {
        const sql = await getSql();
        await sql.query(
          "insert into blossom_sync_conflict (id, user_id, mutation_id, operation, entity_id, local_payload, local_revision, server_revision, server_state) values ($1::uuid, $2, $3::uuid, $4, $5, $6::jsonb, $7, $8, $9::jsonb)",
          [
            mutation.mutationId,
            userId,
            mutation.mutationId,
            mutation.operation,
            mutation.entityId,
            JSON.stringify(mutation.payload),
            expectedRevision,
            result.current?.revision ?? null,
            JSON.stringify(result.current?.session ?? {}),
          ],
        );
        return {
          mutationId: mutation.mutationId,
          status: "conflict",
          currentRevision: result.current?.revision ?? 0,
          currentSessionJson: JSON.stringify(result.current?.session ?? null),
        };
      }
      return {
        mutationId: mutation.mutationId,
        status: "applied",
        revision: result.revision,
      };
    }
    case "pronlab.attempt": {
      const payload = pronlabPayloadSchema.parse(mutation.payload);
      await recordPronlabAttempt(userId, {
        itemId: payload.itemId,
        score: payload.score,
        seconds: payload.seconds,
        tip: payload.tip ?? null,
        metadata: objectValue(payload.metadata),
        idempotencyKey: mutation.mutationId,
      });
      return { mutationId: mutation.mutationId, status: "applied" };
    }
    case "vocabulary.upsert": {
      const payload = vocabularyPayloadSchema.parse(mutation.payload);
      await saveVocabulary(userId, {
        word: payload.word,
        gloss: payload.gloss,
        metadata: objectValue(payload.metadata),
        mutationCreatedAt: mutation.createdAt,
      });
      return { mutationId: mutation.mutationId, status: "applied" };
    }
    case "event.register": {
      const payload = eventPayloadSchema.parse(mutation.payload);
      await registerEvent(userId, mutation.entityId, payload.status);
      return { mutationId: mutation.mutationId, status: "applied" };
    }
    case "challenge.complete":
      await completeChallenge(userId, mutation.entityId);
      return { mutationId: mutation.mutationId, status: "applied" };
    case "tandem.status": {
      const payload = tandemPayloadSchema.parse(mutation.payload);
      await setTandemStatus(userId, {
        partnerUserId: mutation.entityId,
        status: payload.status,
        metadata: objectValue(payload.metadata),
      });
      return { mutationId: mutation.mutationId, status: "applied" };
    }
    case "tandem.report": {
      const payload = tandemReportPayloadSchema.parse(mutation.payload);
      await reportTandem(
        userId,
        mutation.entityId,
        mutation.mutationId,
        payload.reason ?? "unspecified",
      );
      return { mutationId: mutation.mutationId, status: "applied" };
    }
    case "learning.submission": {
      const payload = submissionPayloadSchema.parse(mutation.payload);
      const validated = validateLearningSubmission(payload);
      await saveLearningSubmission(userId, {
        id: mutation.mutationId,
        taskId: payload.taskId,
        kind: payload.kind,
        content: payload.content,
        checks: validated.checks,
        result: validated.result,
      });
      return { mutationId: mutation.mutationId, status: "applied" };
    }
    case "profile.upsert": {
      const payload = profilePayloadSchema.parse(mutation.payload);
      await upsertBlossomProfile(userId, {
        ...payload,
        preferences: objectValue(payload.preferences),
        mutationCreatedAt: mutation.createdAt,
      });
      return { mutationId: mutation.mutationId, status: "applied" };
    }
    case "booking.request": {
      const payload = catalogueBookingPayloadSchema.parse(mutation.payload);
      await requestCatalogueBooking(userId, payload.catalogueItemId);
      return { mutationId: mutation.mutationId, status: "applied" };
    }
    case "waitlist.request": {
      const payload = waitlistPayloadSchema.parse(mutation.payload);
      await requestWaitlist(userId, payload.itemId);
      return { mutationId: mutation.mutationId, status: "applied" };
    }
    case "analytics.record": {
      const payload = analyticsPayloadSchema.parse(mutation.payload);
      const sql = await getSql();
      await sql.query(
        "insert into blossom_analytics_event (id, user_id, name, props, occurred_at) values ($1::uuid, $2, $3, $4::jsonb, $5::timestamptz) on conflict (id) do nothing",
        [
          mutation.mutationId,
          userId,
          payload.name,
          JSON.stringify(payload.props ?? {}),
          payload.occurredAt,
        ],
      );
      return { mutationId: mutation.mutationId, status: "applied" };
    }
    case "teacher.note": {
      const payload = teacherNotePayloadSchema.parse(mutation.payload);
      await addTeacherNote(userId, {
        id: payload.id ?? mutation.mutationId,
        learnerUserId: payload.learnerUserId,
        tags: payload.tags,
        note: payload.note,
      });
      return { mutationId: mutation.mutationId, status: "applied" };
    }
    case "teacher.homework": {
      const payload = teacherHomeworkPayloadSchema.parse(mutation.payload);
      await saveHomework(userId, {
        id: payload.id ?? mutation.mutationId,
        learnerUserId: payload.learnerUserId,
        title: payload.title,
        body: payload.body,
        status: payload.status,
      });
      return { mutationId: mutation.mutationId, status: "applied" };
    }
    case "homework.complete": {
      const payload = homeworkCompletePayloadSchema.parse(mutation.payload);
      await completeHomeworkForLearner(userId, payload.homeworkId);
      return { mutationId: mutation.mutationId, status: "applied" };
    }
  }

  throw new Error("sync-unsupported-operation");
}

export async function syncBlossomBatch(
  userId: string,
  deviceId: string,
  mutations: SyncMutation[],
): Promise<SyncResult[]> {
  if (mutations.length > 50) {
    throw new Error("sync-batch-too-large");
  }
  if (
    mutations.some((mutation) => {
      try {
        return JSON.stringify(mutation).length > 40_000;
      } catch {
        return true;
      }
    })
  ) {
    throw new Error("sync-mutation-too-large");
  }

  const sql = await getSql();
  await sql.query(
    "insert into blossom_sync_device (user_id, device_id, user_agent, last_seen_at) values ($1, $2, $3, current_timestamp) on conflict (user_id, device_id) do update set last_seen_at = current_timestamp, user_agent = excluded.user_agent",
    [userId, deviceId, null],
  );

  const results: SyncResult[] = [];
  for (const mutation of mutations.slice(0, 50)) {
    if (mutation.deviceId !== deviceId) {
      results.push({ mutationId: mutation.mutationId, status: "rejected", errorCode: "device-mismatch" });
      continue;
    }

    const claimed = await claimMutation(userId, mutation);
    if (claimed === "busy") {
      results.push({ mutationId: mutation.mutationId, status: "busy" });
      continue;
    }

    if (claimed === "duplicate") {
      const rows = await sql.query(
        "select status, result from blossom_sync_mutation where mutation_id = $1::uuid and user_id = $2",
        [mutation.mutationId, userId],
      );
      const status = String(rows[0]?.status ?? "processing");
      const result = objectValue(rows[0]?.result);
      if (status === "applied") {
        results.push({
          mutationId: mutation.mutationId,
          status: "duplicate",
          revision: typeof result.revision === "number" ? result.revision : undefined,
        });
      } else if (status === "conflict") {
        results.push({
          mutationId: mutation.mutationId,
          status: "conflict",
          currentRevision: intValue(result.currentRevision),
          currentSessionJson: stringValue(result.currentSessionJson, "null"),
        });
      } else if (status === "rejected") {
        results.push({
          mutationId: mutation.mutationId,
          status: "rejected",
          errorCode: stringValue(result.errorCode, "rejected"),
        });
      } else {
        results.push({ mutationId: mutation.mutationId, status: "busy" });
      }
      continue;
    }

    try {
      const result = await Promise.race([
        applyMutation(userId, mutation),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("sync-timeout")), SYNC_TIMEOUT_MS),
        ),
      ]);
      await storeResult(
        userId,
        mutation.mutationId,
        result.status === "conflict" ? "conflict" : "applied",
        result.status === "conflict"
          ? {
              currentRevision: result.currentRevision,
              currentSessionJson: result.currentSessionJson,
            }
          : result.status === "applied"
            ? { revision: result.revision ?? null }
            : result.status === "duplicate"
              ? { revision: result.revision ?? null }
              : { errorCode: result.status === "rejected" ? result.errorCode : "busy" },
        undefined,
      );
      results.push(result);
    } catch (error) {
      const errorCode = error instanceof Error ? error.message : "sync-failed";
      await storeResult(userId, mutation.mutationId, "rejected", { errorCode }, errorCode);
      results.push({
        mutationId: mutation.mutationId,
        status: "rejected",
        errorCode,
      });
    }
  }

  await sql.query(
    "update blossom_sync_device set last_sync_at = current_timestamp, last_seen_at = current_timestamp where user_id = $1 and device_id = $2",
    [userId, deviceId],
  );
  return results;
}
