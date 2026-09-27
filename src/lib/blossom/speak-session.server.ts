import { randomUUID } from "node:crypto";
import { getSql } from "@/lib/db";
import { LEARN_LANGUAGES } from "@/lib/i18n/locales";
import { enforceRateLimit } from "./rate-limit.server";

class SpeakForbiddenError extends Error {
  readonly status = 403;
  constructor(message = "Forbidden") {
    super(message);
    this.name = "BlossomForbiddenError";
  }
}

function validSpeakRoomId(roomId: string): boolean {
  const id = roomId.trim();
  return id.length >= 2 && id.length <= 120 && /^[a-zA-Z0-9._:-]+$/.test(id);
}

function validSpeakLanguageId(languageId: string): boolean {
  const id = languageId.trim().toLowerCase();
  return LEARN_LANGUAGES.some((item) => item.id === id);
}

export async function startSpeakSession(
  userId: string,
  roomId: string,
  languageId: string,
) {
  await enforceRateLimit(userId, "speak.start-session", 20, 60);
  const normalizedRoomId = roomId.trim();
  const normalizedLanguageId = languageId.trim().toLowerCase();
  if (!validSpeakRoomId(normalizedRoomId)) {
    throw new SpeakForbiddenError("Cette room OSEZ n'est pas disponible.");
  }
  if (!validSpeakLanguageId(normalizedLanguageId)) {
    throw new SpeakForbiddenError("Cette langue n'est pas disponible pour OSEZ.");
  }

  const sql = await getSql();
  const profile = await sql.query(
    "select target_language from blossom_profile where user_id = $1 limit 1",
    [userId],
  );
  const profileLanguage = String(profile[0]?.target_language ?? "").trim().toLowerCase();
  if (profileLanguage && profileLanguage !== normalizedLanguageId) {
    throw new SpeakForbiddenError(
      "La langue de la session doit correspondre à votre langue d'apprentissage.",
    );
  }

  const active = await sql.query(
    `select id, room_id, language_id
     from blossom_speak_session
     where user_id = $1 and status = 'active'
     order by created_at desc
     limit 1`,
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
      `insert into blossom_speak_session
        (id, user_id, room_id, language_id, status, started_at)
       values ($1::uuid, $2, $3, $4, 'active', current_timestamp)`,
      [sessionId, userId, normalizedRoomId, normalizedLanguageId],
    );
  } catch (error) {
    if ((error as { code?: string })?.code !== "23505") throw error;
    const raced = await sql.query(
      `select id, room_id, language_id
       from blossom_speak_session
       where user_id = $1 and status = 'active'
       order by created_at desc
       limit 1`,
      [userId],
    );
    if (!raced[0]) throw new Error("speak-session-create-race");
    return {
      id: String(raced[0].id),
      roomId: String(raced[0].room_id),
      languageId: String(raced[0].language_id),
    };
  }

  return {
    id: sessionId,
    roomId: normalizedRoomId,
    languageId: normalizedLanguageId,
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
    `update blossom_speak_session
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
     returning id, room_id, language_id, status, ended_at, duration_seconds`,
    [sessionId, status, userId],
  );
  if (!rows[0]) {
    throw new SpeakForbiddenError("Cette session OSEZ n'est plus active.");
  }
  return {
    id: String(rows[0].id),
    roomId: String(rows[0].room_id),
    languageId: String(rows[0].language_id),
    status: String(rows[0].status) as "completed" | "cancelled",
    endedAt: new Date(String(rows[0].ended_at)).toISOString(),
    durationSeconds: Math.max(0, Number(rows[0].duration_seconds ?? 0)),
  };
}

export async function getActiveSpeakSession(userId: string) {
  const sql = await getSql();
  const rows = await sql.query(
    `select id, room_id, language_id, started_at
     from blossom_speak_session
     where user_id = $1 and status = 'active'
     order by created_at desc
     limit 1`,
    [userId],
  );
  if (!rows[0]) return null;
  return {
    id: String(rows[0].id),
    roomId: String(rows[0].room_id),
    languageId: String(rows[0].language_id),
    startedAt: new Date(String(rows[0].started_at)).toISOString(),
  };
}
