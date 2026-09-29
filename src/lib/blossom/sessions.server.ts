import { randomUUID } from "node:crypto";
import { getSql } from "@/lib/db";
import { setsForLanguage } from "./data";
import { LEARN_LANGUAGES } from "@/lib/i18n/locales";
import { fullMissionBank } from "./mission-today";
import { enforceRateLimit } from "./rate-limit.server";
import { BlossomForbiddenError } from "./access.server";

export async function startMissionRunSession(userId: string, missionId: string, runId: string) {
  await enforceRateLimit(userId, "mission.start-session", 20, 60);
  const normalizedMissionId = missionId.trim();
  const normalizedRunId = runId.trim();
  if (!normalizedRunId || normalizedRunId.length > 200) {
    throw new BlossomForbiddenError("Cette session de mission est invalide.");
  }
  if (!fullMissionBank().some((mission) => mission.id === normalizedMissionId)) {
    throw new BlossomForbiddenError("Cette mission n\u0027est pas disponible.");
  }
  const sql = await getSql();
  const active = await sql.query(
    `select id, run_id from blossom_mission_run_session
     where user_id = $1 and mission_id = $2 and status = 'active'
     order by created_at desc limit 1`,
    [userId, normalizedMissionId],
  );
  if (active[0]) {
    if (String(active[0].run_id) !== normalizedRunId) {
      throw new BlossomForbiddenError("Cette session de mission est déjà liée à une autre exécution.");
    }
    return { id: String(active[0].id), missionId: normalizedMissionId, runId: normalizedRunId };
  }
  const sessionId = randomUUID();
  try {
    await sql.query(
      `insert into blossom_mission_run_session
        (id, user_id, mission_id, run_id, status, started_at)
       values ($1::uuid, $2, $3, $4, 'active', current_timestamp)`,
      [sessionId, userId, normalizedMissionId, normalizedRunId],
    );
  } catch (error) {
    if ((error as { code?: string })?.code !== "23505") throw error;
    const raced = await sql.query(
      `select id, mission_id, run_id from blossom_mission_run_session
       where user_id = $1 and mission_id = $2 and status = 'active'
       order by created_at desc limit 1`,
      [userId, normalizedMissionId],
    );
    if (!raced[0]) throw new Error("mission-session-create-race");
    if (String(raced[0].run_id) !== normalizedRunId) {
      throw new BlossomForbiddenError("Cette session de mission est déjà liée à une autre exécution.");
    }
    return { id: String(raced[0].id), missionId: String(raced[0].mission_id), runId: normalizedRunId };
  }
  return { id: sessionId, missionId: normalizedMissionId, runId: normalizedRunId };
}

export async function endMissionRunSession(
  userId: string,
  sessionId: string,
  status: "completed" | "cancelled" = "completed",
) {
  await enforceRateLimit(userId, "mission.end-session", 20, 60);
  const sql = await getSql();
  const rows = await sql.query(
    `update blossom_mission_run_session
     set status = $3,
         ended_at = coalesce(ended_at, current_timestamp),
         duration_seconds = greatest(
           0,
           extract(epoch from (coalesce(ended_at, current_timestamp) - started_at))::integer
         ),
         updated_at = current_timestamp
     where id = $1::uuid and user_id = $2 and status = 'active'
     returning id, mission_id, status, ended_at, duration_seconds`,
    [sessionId, userId, status],
  );
  if (!rows[0]) {
    const terminal = await sql.query(
      `select id, mission_id, status, ended_at, duration_seconds
       from blossom_mission_run_session
       where id = $1::uuid
         and user_id = $2
         and status in ('completed', 'cancelled')
       limit 1`,
      [sessionId, userId],
    );
    if (!terminal[0]) throw new BlossomForbiddenError("Cette session de mission n\u0027est plus active.");
    return {
      id: String(terminal[0].id),
      missionId: String(terminal[0].mission_id),
      status: String(terminal[0].status) as "completed" | "cancelled",
      endedAt: new Date(String(terminal[0].ended_at)).toISOString(),
      durationSeconds: Math.max(0, Number(terminal[0].duration_seconds ?? 0)),
    };
  }
  return {
    id: String(rows[0].id),
    missionId: String(rows[0].mission_id),
    status: String(rows[0].status) as "completed" | "cancelled",
    endedAt: new Date(String(rows[0].ended_at)).toISOString(),
    durationSeconds: Math.max(0, Number(rows[0].duration_seconds ?? 0)),
  };
}

function validSpeakRoomId(roomId: string): boolean {
  const id = roomId.trim();
  return id.length >= 2 && id.length <= 120 && /^[a-zA-Z0-9._:-]+$/.test(id);
}

function validSpeakLanguageId(languageId: string): boolean {
  const id = languageId.trim().toLowerCase();
  return LEARN_LANGUAGES.some((item) => item.id === id);
}

export async function startSpeakSession(userId: string, roomId: string, languageId: string) {
  await enforceRateLimit(userId, "speak.start-session", 20, 60);
  const normalizedRoomId = roomId.trim();
  const normalizedLanguageId = languageId.trim().toLowerCase();
  if (!validSpeakRoomId(normalizedRoomId)) {
    throw new BlossomForbiddenError("Cette room Speak est invalide.");
  }
  if (!validSpeakLanguageId(normalizedLanguageId)) {
    throw new BlossomForbiddenError("Cette langue n'est pas disponible pour OSEZ.");
  }
  const sql = await getSql();
  const profile = await sql.query(
    "select target_language from blossom_profile where user_id = $1 limit 1",
    [userId],
  );
  const profileLanguage = String(profile[0]?.target_language ?? "").trim().toLowerCase();
  if (!profileLanguage || profileLanguage !== normalizedLanguageId) {
    throw new BlossomForbiddenError(
      "La langue de la session doit correspondre à votre langue d'apprentissage.",
    );
  }
  const active = await sql.query(
    "select id, room_id, language_id from blossom_speak_session where user_id = $1 and status = 'active' order by created_at desc limit 1",
    [userId],
  );
  if (active[0]) {
    return {
      id: String(active[0].id),
      roomId: String(active[0].room_id),
      languageId: String(active[0].language_id),
    };
  }
  const sessionId = randomUUID();
  try {
    await sql.query(
      "insert into blossom_speak_session (id, user_id, room_id, language_id, status, started_at) values ($1::uuid, $2, $3, $4, 'active', current_timestamp)",
      [sessionId, userId, normalizedRoomId, normalizedLanguageId],
    );
  } catch (error) {
    if ((error as { code?: string })?.code !== "23505") throw error;
    const raced = await sql.query(
      "select id, room_id, language_id from blossom_speak_session where user_id = $1 and status = 'active' order by created_at desc limit 1",
      [userId],
    );
    if (!raced[0]) throw new Error("speak-session-create-race");
    return {
      id: String(raced[0].id),
      roomId: String(raced[0].room_id),
      languageId: String(raced[0].language_id),
    };
  }
  return { id: sessionId, roomId: normalizedRoomId, languageId: normalizedLanguageId };
}

export async function finalizeSpeakSession(
  userId: string,
  sessionId: string,
  evidence?: {
    spokenSeconds?: number;
    transcriptCount?: number;
    captureOnlyCount?: number;
  },
) {
  await enforceRateLimit(userId, "speak.finalize-session", 20, 60);
  const sql = await getSql();
  const spokenSeconds = Math.max(0, Math.min(14400, Math.round(evidence?.spokenSeconds ?? 0)));
  const transcriptCount = Math.max(0, Math.min(500, Math.round(evidence?.transcriptCount ?? 0)));
  const captureOnlyCount = Math.max(0, Math.min(500, Math.round(evidence?.captureOnlyCount ?? 0)));
  const rows = await sql.query(
    `with profile_row as (
       select lower(trim(target_language)) as target_language
       from blossom_profile
       where user_id = $2
       limit 1
    ),
    existing as (
       select s.id, s.room_id, s.language_id, s.duration_seconds, s.ended_at
       from blossom_speak_session s
       where s.id = $1::uuid and s.user_id = $2 and s.status = 'completed'
    ),
    closed as (
       update blossom_speak_session
       set status = 'completed',
           ended_at = coalesce(ended_at, current_timestamp),
           duration_seconds = greatest(
             0,
             extract(epoch from (coalesce(ended_at, current_timestamp) - started_at))::integer
           ),
           updated_at = current_timestamp
       where id = $1::uuid
         and user_id = $2
         and status = 'active'
         and exists (
           select 1 from profile_row p
           where p.target_language = lower(trim(blossom_speak_session.language_id))
         )
       returning id, room_id, language_id, duration_seconds, ended_at
    ),
    session_row as (
       select * from closed
       union all
       select * from existing where not exists (select 1 from closed)
       limit 1
    ),
    ins as (
       insert into blossom_activity_event
         (id, user_id, idempotency_key, event_type, source_id, payload, occurred_at)
       select
         $6::uuid,
         $2,
         $1::uuid,
         'SPEAK_COMPLETED',
         'speak-session-' || s.id,
         jsonb_build_object(
           'metadata',
           jsonb_build_object(
             'languageId', s.language_id,
             'roomId', s.room_id,
             'durationSeconds', s.duration_seconds,
             'minutes', greatest(1, floor(s.duration_seconds / 60.0)),
             'spokenSeconds', $3,
             'transcriptCount', $4,
             'captureOnlyCount', $5
           )
         ),
         s.ended_at
       from session_row s
       on conflict do nothing
       returning id, event_type, source_id, payload, occurred_at
    )
    select
      s.id,
      s.room_id,
      s.duration_seconds,
      s.ended_at,
      coalesce(i.id, a.id) as activity_id,
      coalesce(i.event_type, a.event_type) as activity_type,
      coalesce(i.source_id, a.source_id) as activity_source_id,
      coalesce(i.payload, a.payload) as activity_payload,
      coalesce(i.occurred_at, a.occurred_at) as activity_occurred_at
    from session_row s
    left join ins i on true
    left join blossom_activity_event a
      on a.user_id = $2
     and a.event_type = 'SPEAK_COMPLETED'
     and a.source_id = 'speak-session-' || s.id
    limit 1`,
    [sessionId, userId, spokenSeconds, transcriptCount, captureOnlyCount, randomUUID()],
  );
  if (!rows[0]) throw new BlossomForbiddenError("Cette session Speak n'est plus active.");
  if (!rows[0]?.activity_id || !rows[0]?.activity_payload) {
    throw new BlossomForbiddenError("La langue de cette session a changé; aucune croissance n'a été créditée.");
  }
  const activityMetadata: Record<string, string | number | boolean> = {};
  const payload =
    rows[0].activity_payload &&
    typeof rows[0].activity_payload === "object" &&
    !Array.isArray(rows[0].activity_payload)
      ? (rows[0].activity_payload as Record<string, unknown>)
      : null;
  const rawMetadata =
    payload?.metadata &&
    typeof payload.metadata === "object" &&
    !Array.isArray(payload.metadata)
      ? (payload.metadata as Record<string, unknown>)
      : null;
  if (rawMetadata) {
    for (const [key, value] of Object.entries(rawMetadata)) {
      if (
        typeof value === "string" ||
        typeof value === "number" ||
        typeof value === "boolean"
      ) {
        activityMetadata[key] = value;
      }
    }
  }
  return {
    id: String(rows[0].id),
    roomId: String(rows[0].room_id),
    status: "completed" as const,
    endedAt: new Date(String(rows[0].ended_at)).toISOString(),
    durationSeconds: Math.max(0, Number(rows[0].duration_seconds ?? 0)),
    activity: {
      id: String(rows[0].activity_id),
      type: "SPEAK_COMPLETED" as const,
      sourceId: String(rows[0].activity_source_id),
      createdAt: new Date(String(rows[0].activity_occurred_at)).toISOString(),
      metadata: activityMetadata,
    },
  };
}

export async function endSpeakSession(
  userId: string,
  sessionId: string,
  status: "completed" | "cancelled",
) {
  await enforceRateLimit(userId, "speak.end-session", 20, 60);
  const sql = await getSql();
  const rows = await sql.query(
    "update blossom_speak_session set status = $2, ended_at = coalesce(ended_at, current_timestamp), duration_seconds = greatest(0, extract(epoch from (coalesce(ended_at, current_timestamp) - started_at))::integer), updated_at = current_timestamp where id = $1::uuid and user_id = $3 and status = 'active' returning id, room_id, status, ended_at, duration_seconds",
    [sessionId, status, userId],
  );
  if (!rows[0]) throw new BlossomForbiddenError("Cette session Speak n'est plus active.");
  return {
    id: String(rows[0].id),
    roomId: String(rows[0].room_id),
    status: String(rows[0].status) as "completed" | "cancelled",
    endedAt: new Date(String(rows[0].ended_at)).toISOString(),
    durationSeconds: Math.max(0, Number(rows[0].duration_seconds ?? 0)),
  };
}

function validPulseDareId(dareId: string): boolean {
  const id = dareId.trim();
  return id === "pulse-local" || id === "pulse-terrain" || id === "pulse-social" || id.startsWith("pulse-struggle-");
}

export async function startPulseSession(userId: string, dareId: string) {
  await enforceRateLimit(userId, "pulse.start-session", 20, 60);
  const normalizedDareId = dareId.trim();
  if (!validPulseDareId(normalizedDareId)) {
    throw new BlossomForbiddenError("Cette impulsion n\u0027est pas disponible.");
  }
  const sql = await getSql();
  if (normalizedDareId.startsWith("pulse-struggle-")) {
    const itemId = normalizedDareId.slice("pulse-struggle-".length);
    const profile = await sql.query(
      "select target_language from blossom_profile where user_id = $1 limit 1",
      [userId],
    );
    const rawLanguage = String(profile[0]?.target_language ?? "en");
    const language = setsForLanguage(LEARN_LANGUAGES.some((item) => item.id === rawLanguage) ? rawLanguage : "en");
    const activeItem = language.some((set) =>
      set.items.some((item) => item.id === itemId),
    );
    if (!activeItem) {
      throw new BlossomForbiddenError("Cette impulsion n\u0027est pas disponible dans votre langue.");
    }
  }

  const active = await sql.query(
    `select id, dare_id
     from blossom_pulse_session
     where user_id = $1 and status = 'active'
     order by created_at desc
     limit 1`,
    [userId],
  );
  if (active[0]) {
    return { id: String(active[0].id), dareId: String(active[0].dare_id) };
  }

  const sessionId = randomUUID();
  try {
    await sql.query(
      `insert into blossom_pulse_session
        (id, user_id, dare_id, status, started_at)
       values ($1::uuid, $2, $3, 'active', current_timestamp)`,
      [sessionId, userId, normalizedDareId],
    );
  } catch (error) {
    if ((error as { code?: string })?.code !== "23505") throw error;
    const raced = await sql.query(
      `select id, dare_id
       from blossom_pulse_session
       where user_id = $1 and status = 'active'
       order by created_at desc
       limit 1`,
      [userId],
    );
    if (!raced[0]) throw new Error("pulse-session-create-race");
    return { id: String(raced[0].id), dareId: String(raced[0].dare_id) };
  }

  return { id: sessionId, dareId: normalizedDareId };
}

export async function endPulseSession(
  userId: string,
  sessionId: string,
  status: "completed" | "cancelled",
) {
  await enforceRateLimit(userId, "pulse.end-session", 20, 60);
  const sql = await getSql();
  const rows = await sql.query(
    `update blossom_pulse_session
     set status = $2,
         ended_at = coalesce(ended_at, current_timestamp),
         duration_seconds = greatest(
           0,
           extract(
             epoch from (
               coalesce(ended_at, current_timestamp)
               - started_at
             )
           )::integer
         ),
         updated_at = current_timestamp
     where id = $1::uuid and user_id = $3 and status = 'active'
     returning id, dare_id, status, ended_at, duration_seconds`,
    [sessionId, status, userId],
  );
  if (!rows[0]) {
    const terminal = await sql.query(
      `select id, dare_id, status, ended_at, duration_seconds
       from blossom_pulse_session
       where id = $1::uuid
         and user_id = $2
         and status in ('completed', 'cancelled')
       limit 1`,
      [sessionId, userId],
    );
    if (!terminal[0]) throw new BlossomForbiddenError("Cette impulsion n'est plus active.");
    return {
      id: String(terminal[0].id),
      dareId: String(terminal[0].dare_id),
      status: String(terminal[0].status) as "completed" | "cancelled",
      endedAt: new Date(String(terminal[0].ended_at)).toISOString(),
      durationSeconds: Math.max(0, Number(terminal[0].duration_seconds ?? 0)),
    };
  }
  return {
    id: String(rows[0].id),
    dareId: String(rows[0].dare_id),
    status: String(rows[0].status) as "completed" | "cancelled",
    endedAt: new Date(String(rows[0].ended_at)).toISOString(),
    durationSeconds: Math.max(0, Number(rows[0].duration_seconds ?? 0)),
  };
}