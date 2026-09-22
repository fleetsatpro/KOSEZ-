import { randomUUID } from "node:crypto";
import { getSql } from "@/lib/db";

export type BlossomProfileRecord = {
  userId: string;
  displayName: string | null;
  targetLanguage: string;
  level: string | null;
  timezone: string | null;
  preferences: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type BlossomActivityRecord = {
  id: string;
  idempotencyKey: string | null;
  eventType: string;
  sourceId: string | null;
  payload: Record<string, unknown>;
  occurredAt: string;
};

export type BlossomMissionRecord = {
  session: unknown;
  revision: number;
  updatedAt: string;
};

export type BlossomBackendState = {
  profile: BlossomProfileRecord | null;
  activity: BlossomActivityRecord[];
  missionSessions: Record<string, BlossomMissionRecord>;
};

function iso(value: unknown): string {
  return new Date(String(value)).toISOString();
}

function mapProfile(row: Record<string, unknown>): BlossomProfileRecord {
  return {
    userId: String(row.user_id),
    displayName: (row.display_name as string | null) ?? null,
    targetLanguage: String(row.target_language),
    level: (row.level as string | null) ?? null,
    timezone: (row.timezone as string | null) ?? null,
    preferences: (row.preferences as Record<string, unknown>) ?? {},
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
    payload: (row.payload as Record<string, unknown>) ?? {},
    occurredAt: iso(row.occurred_at),
  };
}

export async function readBlossomState(userId: string): Promise<BlossomBackendState> {
  const sql = await getSql();
  const [profiles, activity, missions] = await Promise.all([
    sql.query(
      "select user_id, display_name, target_language, level, timezone, preferences, created_at, updated_at from blossom_profile where user_id = $1",
      [userId],
    ),
    sql.query(
      "select id, idempotency_key, event_type, source_id, payload, occurred_at from blossom_activity_event where user_id = $1 order by occurred_at desc limit 500",
      [userId],
    ),
    sql.query(
      "select mission_id, session, revision, updated_at from blossom_mission_session where user_id = $1 order by updated_at desc",
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
          session: row.session,
          revision: Number(row.revision),
          updatedAt: iso(row.updated_at),
        },
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
    preferences?: Record<string, unknown>;
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
    payload?: Record<string, unknown>;
    idempotencyKey?: string | null;
    occurredAt?: string;
  },
): Promise<BlossomActivityRecord> {
  const sql = await getSql();
  const id = randomUUID();
  const key = input.idempotencyKey ?? null;

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
  session: unknown,
  expectedRevision: number,
): Promise<SaveMissionResult> {
  const sql = await getSql();
  const rows = await sql.query(
    "insert into blossom_mission_session (user_id, mission_id, session, revision) values ($1, $2, $3::jsonb, 1) on conflict (user_id, mission_id) do update set session = excluded.session, revision = blossom_mission_session.revision + 1, updated_at = current_timestamp where blossom_mission_session.revision = $4 returning revision, updated_at",
    [userId, missionId, JSON.stringify(session), expectedRevision],
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
          session: current[0].session,
          revision: Number(current[0].revision),
          updatedAt: iso(current[0].updated_at),
        }
      : null,
  };
}
