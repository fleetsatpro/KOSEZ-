import { randomUUID } from "node:crypto";
import { getSql } from "@/lib/db";

export type JsonValue =
  | null
  | boolean
  | number
  | string
  | JsonValue[]
  | { [key: string]: JsonValue };

export type JsonObject = { [key: string]: JsonValue };

export type BlossomProfileRecord = {
  userId: string;
  displayName: string | null;
  targetLanguage: string;
  level: string | null;
  timezone: string | null;
  preferences: JsonObject;
  createdAt: string;
  updatedAt: string;
};

export type BlossomActivityRecord = {
  id: string;
  idempotencyKey: string | null;
  eventType: string;
  sourceId: string | null;
  payload: JsonObject;
  occurredAt: string;
};

export type BlossomMissionRecord = {
  session: JsonValue;
  revision: number;
  updatedAt: string;
};

export type BlossomPronlabAttemptRecord = {
  id: string;
  itemId: string;
  score: number;
  seconds: number;
  tip: string | null;
  metadata: JsonObject;
  createdAt: string;
};

export type BlossomVocabularyRecord = {
  word: string;
  gloss: string;
  metadata: JsonObject;
  firstSavedAt: string;
  updatedAt: string;
};

export type BlossomBackendState = {
  profile: BlossomProfileRecord | null;
  activity: BlossomActivityRecord[];
  missionSessions: Record<string, BlossomMissionRecord>;
  pronlabAttempts: BlossomPronlabAttemptRecord[];
  vocabulary: BlossomVocabularyRecord[];
  eventRegistrations: Record<string, "joined" | "waitlist" | "cancelled">;
  completedChallenges: string[];
  tandemStatus: Record<string, "suggested" | "pending" | "accepted" | "blocked" | "paused">;
};

function iso(value: unknown): string {
  return new Date(String(value)).toISOString();
}

function jsonValue(value: unknown): JsonValue {
  try {
    const encoded = JSON.stringify(value);
    return encoded === undefined ? null : (JSON.parse(encoded) as JsonValue);
  } catch {
    return null;
  }
}

function jsonObject(value: unknown): JsonObject {
  const parsed = jsonValue(value);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
  return parsed as JsonObject;
}

function mapProfile(row: Record<string, unknown>): BlossomProfileRecord {
  return {
    userId: String(row.user_id),
    displayName: (row.display_name as string | null) ?? null,
    targetLanguage: String(row.target_language),
    level: (row.level as string | null) ?? null,
    timezone: (row.timezone as string | null) ?? null,
    preferences: jsonObject(row.preferences),
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at),
  };
}

function mapActivity(row: Record<string, unknown>): BlossomActivityRecord {
  return {
    id: String(row.id),
    idempotencyKey: (row.idempotency_key as string | null) ?? null,
    eventType: String(row.event_type),
    sourceId: (row.source_id as string | null) ?? null,
    payload: jsonObject(row.payload),
    occurredAt: iso(row.occurred_at),
  };
}

export async function readBlossomState(userId: string): Promise<BlossomBackendState> {
  const sql = await getSql();
  const [profiles, activity, missions, pronlab, vocabulary, registrations, challenges, tandem] = await Promise.all([
    sql.query(
      "select user_id, display_name, target_language, level, timezone, preferences, created_at, updated_at from blossom_profile where user_id = $1",
      [userId],
    ),
    sql.query(
      "select id, idempotency_key, event_type, source_id, payload, occurred_at from blossom_activity_event where user_id = $1 order by occurred_at asc",
      [userId],
    ),
    sql.query(
      "select mission_id, session, revision, updated_at from blossom_mission_session where user_id = $1 order by updated_at desc",
      [userId],
    ),
    sql.query(
      "select id, item_id, score, seconds, tip, metadata, created_at from blossom_pronlab_attempt where user_id = $1 order by created_at asc",
      [userId],
    ),
    sql.query(
      "select word, gloss, metadata, first_saved_at, updated_at from blossom_vocabulary where user_id = $1 order by updated_at desc",
      [userId],
    ),
    sql.query(
      "select event_id, status from blossom_event_registration where user_id = $1 and status <> 'cancelled'",
      [userId],
    ),
    sql.query(
      "select challenge_id from blossom_challenge_completion where user_id = $1 order by completed_at asc",
      [userId],
    ),
    sql.query(
      "select partner_user_id, status from blossom_tandem_connection where user_id = $1 order by updated_at desc",
      [userId],
    ),
  ]);

  return {
    profile: profiles[0] ? mapProfile(profiles[0]) : null,
    activity: activity.map(mapActivity),
    missionSessions: Object.fromEntries(
      missions.map((row) => [
        String(row.mission_id),
        {
          session: jsonValue(row.session),
          revision: Number(row.revision),
          updatedAt: iso(row.updated_at),
        },
      ]),
    ),
    pronlabAttempts: pronlab.map((row) => ({
      id: String(row.id),
      itemId: String(row.item_id),
      score: Number(row.score),
      seconds: Number(row.seconds),
      tip: (row.tip as string | null) ?? null,
      metadata: jsonObject(row.metadata),
      createdAt: iso(row.created_at),
    })),
    vocabulary: vocabulary.map((row) => ({
      word: String(row.word),
      gloss: String(row.gloss),
      metadata: jsonObject(row.metadata),
      firstSavedAt: iso(row.first_saved_at),
      updatedAt: iso(row.updated_at),
    })),
    eventRegistrations: Object.fromEntries(
      registrations.map((row) => [String(row.event_id), String(row.status) as "joined" | "waitlist" | "cancelled"]),
    ),
    completedChallenges: challenges.map((row) => String(row.challenge_id)),
    tandemStatus: Object.fromEntries(
      tandem.map((row) => [
        String(row.partner_user_id),
        String(row.status) as "suggested" | "pending" | "accepted" | "blocked" | "paused",
      ]),
    ),
  };
}

export async function upsertBlossomProfile(
  userId: string,
  input: {
    displayName?: string | null;
    targetLanguage: string;
    level?: string | null;
    timezone?: string | null;
    preferences?: JsonObject;
  },
): Promise<BlossomProfileRecord> {
  const sql = await getSql();
  const rows = await sql.query(
    "insert into blossom_profile (user_id, display_name, target_language, level, timezone, preferences) values ($1, $2, $3, $4, $5, $6::jsonb) on conflict (user_id) do update set display_name = excluded.display_name, target_language = excluded.target_language, level = excluded.level, timezone = excluded.timezone, preferences = excluded.preferences, updated_at = current_timestamp returning user_id, display_name, target_language, level, timezone, preferences, created_at, updated_at",
    [
      userId,
      input.displayName ?? null,
      input.targetLanguage,
      input.level ?? null,
      input.timezone ?? null,
      JSON.stringify(input.preferences ?? {}),
    ],
  );
  if (!rows[0]) throw new Error("profile-write-failed");
  return mapProfile(rows[0]);
}

export async function appendBlossomActivity(
  userId: string,
  input: {
    eventType: string;
    sourceId?: string | null;
    payload?: JsonObject;
    idempotencyKey?: string | null;
    occurredAt?: string;
  },
): Promise<BlossomActivityRecord> {
  const sql = await getSql();
  const key = input.idempotencyKey ?? null;
  const id = key ?? randomUUID();

  if (key) {
    const existing = await sql.query(
      "select id, idempotency_key, event_type, source_id, payload, occurred_at from blossom_activity_event where user_id = $1 and idempotency_key = $2::uuid",
      [userId, key],
    );
    if (existing[0]) return mapActivity(existing[0]);
  }

  const rows = await sql.query(
    "insert into blossom_activity_event (id, user_id, idempotency_key, event_type, source_id, payload, occurred_at) values ($1::uuid, $2, $3::uuid, $4, $5, $6::jsonb, coalesce($7::timestamptz, current_timestamp)) on conflict (user_id, idempotency_key) do update set idempotency_key = excluded.idempotency_key returning id, idempotency_key, event_type, source_id, payload, occurred_at",
    [
      id,
      userId,
      key,
      input.eventType,
      input.sourceId ?? null,
      JSON.stringify(input.payload ?? {}),
      input.occurredAt ?? null,
    ],
  );
  if (!rows[0]) throw new Error("activity-write-failed");
  return mapActivity(rows[0]);
}

export type SaveMissionResult =
  | { ok: true; revision: number; updatedAt: string }
  | { ok: false; reason: "conflict"; current: BlossomMissionRecord | null };

export async function saveBlossomMissionSession(
  userId: string,
  missionId: string,
  session: JsonValue,
  expectedRevision: number,
  mutationId?: string,
): Promise<SaveMissionResult> {

  const sql = await getSql();
  if (mutationId) {
    const duplicate = await sql.query(
      "select revision, updated_at from blossom_mission_session where user_id = $1 and mission_id = $2 and last_mutation_id = $3::uuid",
      [userId, missionId, mutationId],
    );
    if (duplicate[0]) {
      return {
        ok: true,
        revision: Number(duplicate[0].revision),
        updatedAt: iso(duplicate[0].updated_at),
      };
    }
  }

  const rows = await sql.query(
    "insert into blossom_mission_session (user_id, mission_id, session, revision, last_mutation_id) values ($1, $2, $3::jsonb, 1, $5::uuid) on conflict (user_id, mission_id) do update set session = excluded.session, revision = blossom_mission_session.revision + 1, updated_at = current_timestamp, last_mutation_id = excluded.last_mutation_id where blossom_mission_session.revision = $4 returning revision, updated_at",
    [userId, missionId, JSON.stringify(session), expectedRevision, mutationId ?? null],
  );

  if (rows[0]) {
    return {
      ok: true,
      revision: Number(rows[0].revision),
      updatedAt: iso(rows[0].updated_at),
    };
  }

  const current = await sql.query(
    "select session, revision, updated_at from blossom_mission_session where user_id = $1 and mission_id = $2",
    [userId, missionId],
  );
  return {
    ok: false,
    reason: "conflict",
    current: current[0]
      ? {
          session: jsonValue(current[0].session),
          revision: Number(current[0].revision),
          updatedAt: iso(current[0].updated_at),
        }
      : null,
  };
}
