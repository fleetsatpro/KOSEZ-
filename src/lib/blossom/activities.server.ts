import { randomUUID } from "node:crypto";
import { getSql } from "@/lib/db";
import { normalizeMutationTime } from "./sync-causality";
import { IMMERSION, PRONLAB_SETS, setsForLanguage, TODAY_MISSION } from "./data";
import { LEARN_LANGUAGES, isLearnLanguageId } from "@/lib/i18n/locales";
import { GRAMMAR_TASKS, LISTENING_TASKS, WRITING_PROMPTS, evaluateWritingStructure } from "./lab-content";
import type { JsonObject } from "./backend.server";
import { getPublishedContent } from "./content.server";
import { enforceRateLimit } from "./rate-limit.server";
import type { PronlabAttemptInput } from "./booking.server";
import { writeAuditEvent, createNotification } from "./notifications.server";
import { assertLearnerAccess, BlossomForbiddenError } from "./access.server";

export type BlossomNotification = {
  id: string;
  kind: "homework" | "booking" | "event" | "tandem" | "learning" | "system" | "communication";
  title: string;
  body: string;
  href: string | null;
  metadata: JsonObject;
  readAt: string | null;
  createdAt: string;
};

export async function recordPronlabAttempt(
  userId: string,
  input: PronlabAttemptInput,
) {
  await enforceRateLimit(userId, "learning.pronlab-attempt", 60, 60);
  const sql = await getSql();
  const profileRows = await sql.query(
    "select target_language from blossom_profile where user_id = $1 limit 1",
    [userId],
  );
  const languageId = String(profileRows[0]?.target_language ?? "en");
  const activeItems = new Set(
    setsForLanguage(languageId).flatMap((setDef) => setDef.items.map((item) => item.id)),
  );
  const knownItem = PRONLAB_SETS.flatMap((set) => set.items).find((item) => item.id === input.itemId);
  if (!knownItem || !activeItems.has(input.itemId)) {
    throw new BlossomForbiddenError("Cet exercice Pron'Lab n'est pas disponible pour votre langue active.");
  }
  if (!Number.isFinite(input.seconds) || input.seconds <= 0 || input.seconds > 3600) {
    throw new BlossomForbiddenError("Une prise Pron'Lab doit contenir une durée réelle et bornée.");
  }

  const recordId = input.idempotencyKey ?? randomUUID();
  const metadata = input.metadata ?? {};
  const safeScore = 0;
  const assessment =
    metadata.assessment === "transcript" ? "transcript" : "capture-only";
  const safeMetadata = {
    ...metadata,
    languageId,
    assessment,
    provider:
      typeof metadata.provider === "string"
        ? metadata.provider
        : "speech-evidence",
  };

  if (input.idempotencyKey) {
    const existing = await sql.query(
      "select id, item_id, score, seconds, tip, metadata, created_at from blossom_pronlab_attempt where user_id = $1 and idempotency_key = $2::uuid",
      [userId, input.idempotencyKey],
    );
    if (existing[0]) return existing[0];
  }

  const rows = await sql.query(
    "insert into blossom_pronlab_attempt (id, user_id, item_id, idempotency_key, score, seconds, tip, metadata) values ($1::uuid, $2, $3, $4::uuid, $5, $6, $7, $8::jsonb) on conflict (user_id, idempotency_key) where idempotency_key is not null do update set idempotency_key = excluded.idempotency_key returning id, item_id, score, seconds, tip, metadata, created_at",
    [
      recordId,
      userId,
      input.itemId,
      input.idempotencyKey ?? null,
      safeScore,
      Math.max(0, Math.round(input.seconds)),
      input.tip ?? null,
      JSON.stringify(safeMetadata),
    ],
  );

  if (!rows[0]) throw new Error("pronlab-write-failed");
  return rows[0];
}

export async function saveVocabulary(
  userId: string,
  input: {
    word: string;
    gloss: string;
    metadata?: JsonObject;
    mutationCreatedAt?: string;
  },
) {
  await enforceRateLimit(userId, "learning.vocabulary-upsert", 120, 60);
  const sql = await getSql();
  const metadata = input.metadata ?? {};
  const profileRows = await sql.query(
    "select target_language from blossom_profile where user_id = $1 limit 1",
    [userId],
  );
  const languageId = String(profileRows[0]?.target_language ?? "en");
  const claimedLanguageId = metadata.languageId;
  if (typeof claimedLanguageId === "string" && claimedLanguageId !== languageId) {
    throw new BlossomForbiddenError("La langue du vocabulaire doit correspondre à votre langue active.");
  }
  const causalTime = normalizeMutationTime(input.mutationCreatedAt);
  const rows = await sql.query(
    "insert into blossom_vocabulary (user_id, language_id, word, gloss, metadata, updated_at) values ($1, $2, $3, $4, $5::jsonb, coalesce($6::timestamptz, current_timestamp)) on conflict (user_id, language_id, word) do update set gloss = excluded.gloss, metadata = excluded.metadata, updated_at = excluded.updated_at where blossom_vocabulary.updated_at <= excluded.updated_at returning word, gloss, metadata, language_id, first_saved_at, updated_at",
    [
      userId,
      languageId,
      input.word.toLowerCase(),
      input.gloss,
      JSON.stringify({ ...metadata, languageId }),
      causalTime,
    ],
  );
  if (rows[0]) return rows[0];

  const current = await sql.query(
    "select word, gloss, metadata, language_id, first_saved_at, updated_at from blossom_vocabulary where user_id = $1 and language_id = $2 and word = $3",
    [userId, languageId, input.word.toLowerCase()],
  );
  if (!current[0]) throw new Error("vocabulary-write-failed");
  return current[0];
}

export async function registerEvent(
  userId: string,
  eventId: string,
  status: "joined" | "waitlist" | "cancelled",
) {
  await enforceRateLimit(userId, "event.register", 20, 60);
  const sql = await getSql();
  const publishedEvents = await getPublishedContent();
  const event = publishedEvents.events.find((item) => item.id === eventId);
  if (!event) {
    throw new Error("unknown-event");
  }

  if (status !== "joined") {
    const rows = await sql.query(
      "insert into blossom_event_registration (user_id, event_id, status, seat_no) values ($1, $2, $3, null) on conflict (user_id, event_id) do update set status = excluded.status, seat_no = null, updated_at = current_timestamp returning user_id, event_id, status, created_at, updated_at",
      [userId, eventId, status],
    );
    if (!rows[0]) throw new Error("event-registration-write-failed");

    await writeAuditEvent(userId, {
      action: `event.registration.${status}`,
      resourceType: "event",
      resourceId: eventId,
    });
    return rows[0];
  }

  if (!event) throw new Error("unknown-event");

  const existing = await sql.query(
    "select status, seat_no from blossom_event_registration where user_id = $1 and event_id = $2",
    [userId, eventId],
  );
  const existingStatus = String(existing[0]?.status ?? "");
  const existingSeat = existing[0]?.seat_no;
  if (existingStatus === "joined" && existingSeat != null) {
    return existing[0];
  }

  for (let seat = 1; seat <= event.spots; seat += 1) {
    try {
      let rows: Record<string, unknown>[] = [];

      if (existing[0]) {
        rows = await sql.query(
          "update blossom_event_registration set status = 'joined', seat_no = $3, updated_at = current_timestamp where user_id = $1 and event_id = $2 and not exists (select 1 from blossom_event_registration where event_id = $2 and seat_no = $3 and user_id <> $1) returning user_id, event_id, status, created_at, updated_at",
          [userId, eventId, seat],
        );
      } else {
        rows = await sql.query(
          "insert into blossom_event_registration (user_id, event_id, status, seat_no) values ($1, $2, 'joined', $3) on conflict do nothing returning user_id, event_id, status, created_at, updated_at",
          [userId, eventId, seat],
        );
      }

      if (rows[0]) {
        await writeAuditEvent(userId, {
          action: "event.registration.joined",
          resourceType: "event",
          resourceId: eventId,
        });
        return rows[0];
      }

      if (!existing[0]) {
        const nowExisting = await sql.query(
          "select status, seat_no from blossom_event_registration where user_id = $1 and event_id = $2",
          [userId, eventId],
        );
        if (nowExisting[0]) {
          if (
            String(nowExisting[0].status) === "joined" &&
            nowExisting[0].seat_no != null
          ) {
            return nowExisting[0];
          }
          existing.push(nowExisting[0] as typeof existing[number]);
        }
      }
    } catch (error) {
      if ((error as { code?: string })?.code !== "23505") throw error;
    }
  }

  throw new Error("event-full");
}

export async function completeChallenge(userId: string, challengeId: string) {
  await enforceRateLimit(userId, "immersion.challenge-complete", 30, 60);
  if (!IMMERSION.challenges.includes(challengeId)) {
    throw new BlossomForbiddenError("Ce défi d'immersion n'existe pas.");
  }
  const sql = await getSql();
  const rows = await sql.query(
    "insert into blossom_challenge_completion (user_id, challenge_id) values ($1, $2) on conflict (user_id, challenge_id) do nothing returning user_id, challenge_id, completed_at",
    [userId, challengeId],
  );
  if (rows[0]) return rows[0];

  const existing = await sql.query(
    "select user_id, challenge_id, completed_at from blossom_challenge_completion where user_id = $1 and challenge_id = $2",
    [userId, challengeId],
  );
  if (!existing[0]) throw new Error("challenge-write-failed");
  return existing[0];
}

export async function saveHomework(
  actorUserId: string,
  input: {
    id?: string;
    learnerUserId: string;
    title: string;
    body: string;
    status: "draft" | "sent" | "done";
  },
) {
  await enforceRateLimit(actorUserId, "teacher.homework-save", 60, 60);
  await assertLearnerAccess(actorUserId, input.learnerUserId, "teacher");
  if (input.status === "done") {
    throw new BlossomForbiddenError("La fin d’un devoir est réservée à l’apprenant.");
  }
  const sql = await getSql();
  let previousStatus: string | null = null;
  if (input.id) {
    const previous = await sql.query(
      "select status from blossom_homework where id = $1::uuid and author_user_id = $2",
      [input.id, actorUserId],
    );
    previousStatus = previous[0]?.status ? String(previous[0].status) : null;
  }
  const rows = input.id
    ? await sql.query(
        "update blossom_homework set title = $2, body = $3, status = $4, updated_at = current_timestamp where id = $1::uuid and author_user_id = $5 returning id, author_user_id, learner_user_id, title, body, status, created_at, updated_at",
        [input.id, input.title, input.body, input.status, actorUserId],
      )
    : await sql.query(
        "insert into blossom_homework (id, author_user_id, learner_user_id, title, body, status) values ($1::uuid, $2, $3, $4, $5, $6) returning id, author_user_id, learner_user_id, title, body, status, created_at, updated_at",
        [randomUUID(), actorUserId, input.learnerUserId, input.title, input.body, input.status],
      );

  if (!rows[0]) throw new Error("homework-write-failed");
  if (input.status === "sent" && previousStatus !== "sent") {
    await createNotification(input.learnerUserId, {
      kind: "homework",
      title: "Un nouveau devoir vous attend",
      body: input.title,
      href: "/moi",
      metadata: { homeworkId: String(rows[0].id) },
    });
  }
  return rows[0];
}

export async function addTeacherNote(
  actorUserId: string,
  input: {
    id?: string;
    learnerUserId: string;
    tags: string[];
    note: string;
  },
) {
  await enforceRateLimit(actorUserId, "teacher.note-save", 60, 60);
  await assertLearnerAccess(actorUserId, input.learnerUserId, "teacher");
  const sql = await getSql();
  const rows = await sql.query(
    "insert into blossom_teacher_note (id, teacher_user_id, learner_user_id, tags, note) values ($1::uuid, $2, $3, $4::jsonb, $5) on conflict (id) do update set tags = excluded.tags, note = excluded.note where blossom_teacher_note.teacher_user_id = excluded.teacher_user_id and blossom_teacher_note.learner_user_id = excluded.learner_user_id returning id, teacher_user_id, learner_user_id, tags, note, created_at, updated_at",
    [
      input.id ?? randomUUID(),
      actorUserId,
      input.learnerUserId,
      JSON.stringify(input.tags),
      input.note,
    ],
  );
  if (!rows[0]) throw new Error("teacher-note-write-failed");
  return rows[0];
}

export async function completeHomeworkForLearner(
  learnerUserId: string,
  homeworkId: string,
) {
  await enforceRateLimit(learnerUserId, "homework.complete", 30, 60);
  const sql = await getSql();
  const rows = await sql.query(
    "update blossom_homework set status = 'done', updated_at = current_timestamp where id = $1::uuid and learner_user_id = $2 and status = 'sent' returning id, author_user_id, learner_user_id, title, body, status, created_at, updated_at",
    [homeworkId, learnerUserId],
  );
  if (!rows[0]) {
    const current = await sql.query(
      "select id, author_user_id, learner_user_id, title, body, status, created_at, updated_at from blossom_homework where id = $1::uuid and learner_user_id = $2",
      [homeworkId, learnerUserId],
    );
    if (current[0] && String(current[0].status) === "done") return current[0];
    throw new BlossomForbiddenError("Ce devoir n'est pas disponible pour vous.");
  }
  await writeAuditEvent(learnerUserId, {
    action: "homework.completed",
    resourceType: "homework",
    resourceId: homeworkId,
  });
  return rows[0];
}

export async function saveLearningSubmission(
  userId: string,
  input: {
    id?: string;
    taskId: string;
    kind: "grammar" | "listening" | "writing" | "review";
    content: string;
    checks?: string[];
    result?: Record<string, unknown>;
  },
) {
  await enforceRateLimit(userId, "learning.submission", 60, 60);
  if (input.content.length > 12000) {
    throw new BlossomForbiddenError("Cette production est trop longue pour cette trace.");
  }
  const sql = await getSql();
  const profileRows = await sql.query(
    "select target_language from blossom_profile where user_id = $1 limit 1",
    [userId],
  );
  const languageId = String(profileRows[0]?.target_language ?? "en");
  if (!isLearnLanguageId(languageId)) {
    throw new BlossomForbiddenError("Langue d’apprentissage invalide.");
  }

  // The current lab bank is authored in English. The client cannot submit lab
  // completion evidence while another target language is active.
  if (
    (input.kind === "grammar" ||
      input.kind === "listening" ||
      input.kind === "writing") &&
    languageId !== "en"
  ) {
    throw new BlossomForbiddenError(
      "Cet atelier n’est pas disponible pour votre langue d’apprentissage active.",
    );
  }

  if (input.kind === "grammar") {
    const task = GRAMMAR_TASKS.find((item) => item.id === input.taskId);
    if (!task) throw new BlossomForbiddenError("Exercice de grammaire inconnu.");
    const correct = input.content === task.answer;
    const expectedChecks = [correct ? "correct" : "incorrect"];
    if (JSON.stringify(input.checks ?? []) !== JSON.stringify(expectedChecks)) {
      throw new BlossomForbiddenError("La vérification de grammaire ne correspond pas à la réponse.");
    }
    input = {
      ...input,
      checks: expectedChecks,
      result: {
        correct,
        target: task.target,
        languageId,
      },
    };
  } else if (input.kind === "listening") {
    const task = LISTENING_TASKS.find((item) => item.id === input.taskId);
    if (!task) throw new BlossomForbiddenError("Exercice d’écoute inconnu.");
    const correct = input.content === task.answer;
    const expectedChecks = [correct ? "correct" : "incorrect"];
    if (JSON.stringify(input.checks ?? []) !== JSON.stringify(expectedChecks)) {
      throw new BlossomForbiddenError("La vérification d’écoute ne correspond pas à la réponse.");
    }
    input = {
      ...input,
      checks: expectedChecks,
      result: {
        correct,
        level: task.level,
        languageId,
      },
    };
  } else if (input.kind === "writing") {
    const prompt = WRITING_PROMPTS.find((item) => item.id === input.taskId);
    if (!prompt) throw new BlossomForbiddenError("Sujet d’écriture inconnu.");
    const evaluation = evaluateWritingStructure(prompt, input.content);
    if (JSON.stringify(input.checks ?? []) !== JSON.stringify(evaluation.passed)) {
      throw new BlossomForbiddenError("La vérification d’écriture ne correspond pas à l’évaluation.");
    }
    input = {
      ...input,
      checks: evaluation.passed,
      result: {
        checkCount: evaluation.passed.length,
        checkTotal: evaluation.total,
        structureScore: evaluation.score,
        method: evaluation.method,
        languageId,
      },
    };
  } else {
    const expected =
      input.content === "correct"
        ? "correct"
        : input.content === "again"
          ? "again"
          : null;
    if (!expected || JSON.stringify(input.checks ?? []) !== JSON.stringify([expected])) {
      throw new BlossomForbiddenError("La vérification de révision est invalide.");
    }

    const taskId = input.taskId.trim();
    if (taskId.startsWith("pron:")) {
      const itemId = taskId.slice("pron:".length);
      const activeItemIds = new Set(
        setsForLanguage(languageId).flatMap((setDef) =>
          setDef.items.map((item) => item.id),
        ),
      );
      if (!activeItemIds.has(itemId)) {
        throw new BlossomForbiddenError("Cette source Pron’Lab n’appartient pas à votre langue active.");
      }
      const attempts = await sql.query(
        "select 1 from blossom_pronlab_attempt where user_id = $1 and item_id = $2 and coalesce(metadata->>'languageId', '') = $3 and seconds > 0 limit 1",
        [userId, itemId, languageId],
      );
      if (!attempts[0]) {
        throw new BlossomForbiddenError("Cette révision Pron’Lab ne repose sur aucune trace de pratique.");
      }
    } else if (taskId.startsWith("vocab:")) {
      const word = taskId.slice("vocab:".length).trim().toLowerCase();
      if (!word || word.length > 120) {
        throw new BlossomForbiddenError("Cette source vocabulaire est invalide.");
      }
      const rows = await sql.query(
        "select 1 from blossom_vocabulary where user_id = $1 and language_id = $2 and word = $3 limit 1",
        [userId, languageId, word],
      );
      if (!rows[0]) {
        throw new BlossomForbiddenError("Cette révision vocabulaire ne repose sur aucune trace sauvegardée.");
      }
    } else if (taskId.startsWith("mission:")) {
      const phrase = taskId.slice("mission:".length);
      const known =
        languageId === "en" &&
        (TODAY_MISSION.scene?.languageKit ?? []).some(
          (kit) => kit.phrase === phrase,
        );
      if (!known) {
        throw new BlossomForbiddenError("Cette source mission n’est pas reconnue.");
      }
    } else {
      throw new BlossomForbiddenError("Source de révision inconnue.");
    }

    input = {
      ...input,
      taskId,
      checks: [expected],
      result: {
        correct: input.content === "correct",
        sourceKind: taskId.split(":")[0],
        languageId,
      },
    };
  }

  const id = input.id ?? randomUUID();
  const rows = await sql.query(
    "insert into blossom_learning_submission (id, user_id, task_id, kind, content, checks, result) values ($1::uuid, $2, $3, $4, $5, $6::jsonb, $7::jsonb) on conflict (id) do update set content = excluded.content, checks = excluded.checks, result = excluded.result, updated_at = current_timestamp where blossom_learning_submission.user_id = excluded.user_id returning id, task_id, kind, content, checks, result, created_at, updated_at",
    [
      id,
      userId,
      input.taskId,
      input.kind,
      input.content,
      JSON.stringify(input.checks ?? []),
      JSON.stringify(input.result ?? {}),
    ],
  );
  if (!rows[0]) throw new Error("learning-submission-write-failed");
  return rows[0];
}
