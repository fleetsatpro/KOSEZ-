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
  eventType: string;
  sourceId: string | null;
  payload: Record<string, unknown>;
  occurredAt: string;
};

export type BlossomBackendState = {
  profile: BlossomProfileRecord | null;
  activity: BlossomActivityRecord[];
  missionSessions: Record<string, unknown>;
};

function mapProfile(row: Record<string, unknown>): BlossomProfileRecord {
  return {
    userId: String(row.user_id),
    displayName: (row.display_name as string | null) ?? null,
    targetLanguage: String(row.target_language),
    level: (row.level as string | null) ?? null,
    timezone: (row.timezone as string | null) ?? null,
    preferences: (row.preferences as Record<string, unknown>) ?? {},
    createdAt: new Date(String(row.created_at)).toISOString(),
    updatedAt: new Date(String(row.updated_at)).toISOString(),
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
      "select id, event_type, source_id, payload, occurred_at from blossom_activity_event where user_id = $1 order by occurred_at desc limit 500",
      [userId],
    ),
    sql.query(
      "select mission_id, session from blossom_mission_session where user_id = $1 order by updated_at desc",
      [userId],
    ),
  ]);

  return {
    profile: profiles[0] ? mapProfile(profiles[0]) : null,
    activity: activity.map((row) => ({
      id: String(row.id),
      eventType: String(row.event_type),
      sourceId: (row.source_id as string | null) ?? null,
      payload: (row.payload as Record<string, unknown>) ?? {},
      occurredAt: new Date(String(row.occurred_at)).toISOString(),
    })),
    missionSessions: Object.fromEntries(
      missions.map((row) => [String(row.mission_id), row.session]),
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
  return mapProfile(rows[0]);
}

export async function appendBlossomActivity(
  userId: string,
  input: {
    eventType: string;
    sourceId?: string | null;
    payload?: Record<string, unknown>;
    occurredAt?: string;
  },
): Promise<BlossomActivityRecord> {
  const sql = await getSql();
  const id = randomUUID();
  const rows = await sql.query(
    "insert into blossom_activity_event (id, user_id, event_type, source_id, payload, occurred_at) values ($1::uuid, $2, $3, $4, $5::jsonb, coalesce($6::timestamptz, current_timestamp)) returning id, event_type, source_id, payload, occurred_at",
    [
      id,
      userId,
      input.eventType,
      input.sourceId ?? null,
      JSON.stringify(input.payload ?? {}),
      input.occurredAt ?? null,
    ],
  );
  const row = rows[0];
  return {
    id: String(row.id),
    eventType: String(row.event_type),
    sourceId: (row.source_id as string | null) ?? null,
    payload: (row.payload as Record<string, unknown>) ?? {},
    occurredAt: new Date(String(row.occurred_at)).toISOString(),
  };
}

export async function saveBlossomMissionSession(
  userId: string,
  missionId: string,
  session: unknown,
): Promise<void> {
  const sql = await getSql();
  await sql.query(
    "insert into blossom_mission_session (user_id, mission_id, session) values ($1, $2, $3::jsonb) on conflict (user_id, mission_id) do update set session = excluded.session, updated_at = current_timestamp",
    [userId, missionId, JSON.stringify(session)],
  );
}
