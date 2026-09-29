import { randomUUID } from "node:crypto";
import { getSql } from "@/lib/db";
import type { JsonObject } from "./backend.server";
import { enforceRateLimit } from "./rate-limit.server";
import { assertFeaturePlan, getServerPlan } from "./workspaces.server";
import { writeAuditEvent, createNotification } from "./notifications.server";
import { BlossomForbiddenError } from "./access.server";

export type ConnectPeer = {
  id: string;
  name: string;
  level: string | null;
  city: string | null;
  interests: string[];
  lastSeen: string | null;
  sharedEvents: number;
  tandemAccepted: boolean;
};

export async function getConnectPeers(userId: string): Promise<ConnectPeer[]> {
  await enforceRateLimit(userId, "communication.connect-peers", 60, 60);
  const sql = await getSql();
  const rows = await sql.query(
    `select
      p.user_id as id,
      coalesce(nullif(p.display_name, ''), p.user_id) as name,
      p.level,
      p.preferences->>'city' as city,
      p.preferences->'interests' as interests,
      max(their.updated_at) as last_seen,
      count(distinct mine.event_id)::integer as shared_events,
      boolean_or(
        coalesce(mine_tandem.status = 'accepted', false)
        and coalesce(their_tandem.status = 'accepted', false)
      ) as tandem_accepted
    from blossom_event_registration mine
    join blossom_event_registration their
      on their.event_id = mine.event_id
     and their.status = 'joined'
     and their.user_id <> $1
    join blossom_profile p on p.user_id = their.user_id
    left join blossom_tandem_connection mine_tandem
      on mine_tandem.user_id = $1 and mine_tandem.partner_user_id = their.user_id
    left join blossom_tandem_connection their_tandem
      on their_tandem.user_id = their.user_id and their_tandem.partner_user_id = $1
    where mine.user_id = $1
      and mine.status = 'joined'
      and lower(coalesce(p.preferences->>'tandemOpen', 'false')) = 'true'
    group by p.user_id, p.display_name, p.level, p.preferences
    order by shared_events desc, last_seen desc nulls last
    limit 24`,
    [userId],
  );

  return rows.map((row) => ({
    id: String(row.id),
    name: String(row.name),
    level: row.level ? String(row.level) : null,
    city: typeof row.city === "string" ? row.city : null,
    interests: Array.isArray(row.interests) ? row.interests.map(String) : [],
    lastSeen: row.last_seen ? new Date(String(row.last_seen)).toISOString() : null,
    sharedEvents: Number(row.shared_events ?? 0),
    tandemAccepted: Boolean(row.tandem_accepted),
  }));
}

export type TandemCandidate = {
  id: string;
  name: string;
  city: string | null;
  speaks: string;
  speaksLevel: string;
  wants: string;
  wantsLevel: string;
  interests: string[];
  window: string;
  goal: string;
  initials: string;
  myStatus: "suggested" | "pending" | "accepted" | "blocked" | "paused";
  incomingStatus: "none" | "pending" | "accepted" | "blocked" | "paused";
};

function prefString(
  preferences: Record<string, unknown>,
  key: string,
  fallback: string,
) {
  const value = preferences[key];
  return typeof value === "string" && value.trim() ? value : fallback;
}

function prefStringArray(preferences: Record<string, unknown>, key: string) {
  const value = preferences[key];
  return Array.isArray(value) ? value.map(String).filter(Boolean) : [];
}

export async function getTandemCandidates(userId: string): Promise<TandemCandidate[]> {
  await enforceRateLimit(userId, "tandem.candidates", 60, 60);
  assertFeaturePlan(await getServerPlan(userId), "tandem");
  const sql = await getSql();
  const rows = await sql.query(
    `select
      p.user_id,
      coalesce(nullif(p.display_name, ''), p.user_id) as display_name,
      p.level,
      p.target_language,
      p.preferences,
      coalesce(mine.status, 'suggested') as my_status,
      coalesce(incoming.status, 'none') as incoming_status
    from blossom_profile p
    left join blossom_tandem_connection mine
      on mine.user_id = $1 and mine.partner_user_id = p.user_id
    left join blossom_tandem_connection incoming
      on incoming.user_id = p.user_id and incoming.partner_user_id = $1
    where p.user_id <> $1
      and (
        lower(coalesce(p.preferences->>'tandemOpen', 'false')) = 'true'
        or mine.status is not null
        or incoming.status is not null
      )
      and coalesce(mine.status, 'suggested') <> 'blocked'
      and coalesce(incoming.status, 'none') <> 'blocked'
    order by display_name asc
    limit 100`,
    [userId],
  );

  return rows.map((row) => {
    const preferences =
      row.preferences && typeof row.preferences === "object"
        ? (row.preferences as Record<string, unknown>)
        : {};
    const name = String(row.display_name);
    const target = String(row.target_language);
    return {
      id: String(row.user_id),
      name,
      city: prefString(preferences, "city", "La Réunion"),
      speaks: prefString(preferences, "nativeLanguage", "Langue non renseignée"),
      speaksLevel: prefString(preferences, "nativeLevel", "—"),
      wants: target,
      wantsLevel: row.level ? String(row.level) : "—",
      interests: prefStringArray(preferences, "interests"),
      window: prefString(preferences, "practiceWindow", "Créneau non renseigné"),
      goal: prefString(preferences, "goal", "Objectif non renseigné"),
      initials: name.slice(0, 1).toUpperCase(),
      myStatus: String(row.my_status) as TandemCandidate["myStatus"],
      incomingStatus: String(row.incoming_status) as TandemCandidate["incomingStatus"],
    };
  });
}

export async function getTandemSession(
  userId: string,
  partnerUserId: string,
): Promise<TandemCandidate | null> {
  assertFeaturePlan(await getServerPlan(userId), "tandem");
  const candidates = await getTandemCandidates(userId);
  const partner = candidates.find((candidate) => candidate.id === partnerUserId);
  if (!partner || partner.myStatus !== "accepted" || partner.incomingStatus !== "accepted") {
    throw new BlossomForbiddenError("Cette session tandem n'est pas ouverte pour ce compte.");
  }
  return partner;
}

export async function setTandemStatus(
  userId: string,
  input: {
    partnerUserId: string;
    status: "suggested" | "pending" | "accepted" | "blocked" | "paused";
    metadata?: JsonObject;
  },
) {
  await enforceRateLimit(userId, "tandem.status", 30, 60);
  assertFeaturePlan(await getServerPlan(userId), "tandem");
  if (userId === input.partnerUserId) {
    throw new BlossomForbiddenError("A tandem partner must be a different learner.");
  }

  const sql = await getSql();
  const partnerRows = await sql.query(
    "select preferences from blossom_profile where user_id = $1 limit 1",
    [input.partnerUserId],
  );
  const partnerPreferences =
    partnerRows[0]?.preferences && typeof partnerRows[0].preferences === "object"
      ? (partnerRows[0].preferences as Record<string, unknown>)
      : {};
  if (
    (input.status === "pending" || input.status === "suggested") &&
    partnerPreferences.tandemOpen !== true
  ) {
    throw new BlossomForbiddenError("Ce profil n'accepte pas les nouvelles demandes tandem.");
  }
  if (!partnerRows[0]) {
    throw new BlossomForbiddenError("Ce profil tandem n'est plus disponible.");
  }

  if (input.status === "accepted") {
    const incoming = await sql.query(
      "select status from blossom_tandem_connection where user_id = $1 and partner_user_id = $2",
      [input.partnerUserId, userId],
    );
    const incomingStatus = String(incoming[0]?.status ?? "");
    if (incomingStatus !== "pending" && incomingStatus !== "accepted") {
      throw new BlossomForbiddenError(
        "L'autre personne doit d'abord accepter la demande.",
      );
    }

    const accepted = await sql.query(
      `with mine as (
        insert into blossom_tandem_connection
          (id, user_id, partner_user_id, status, metadata)
        values ($1::uuid, $2, $3, 'accepted', $4::jsonb)
        on conflict (user_id, partner_user_id)
        do update set
          status = 'accepted',
          metadata = excluded.metadata,
          updated_at = current_timestamp
        returning id, user_id, partner_user_id, status, metadata, created_at, updated_at
      ),
      reciprocal as (
        insert into blossom_tandem_connection
          (id, user_id, partner_user_id, status, metadata)
        values ($5::uuid, $3, $2, 'accepted', $6::jsonb)
        on conflict (user_id, partner_user_id)
        do update set
          status = 'accepted',
          metadata = excluded.metadata,
          updated_at = current_timestamp
      )
      select id, user_id, partner_user_id, status, metadata, created_at, updated_at
      from mine`,
      [
        randomUUID(),
        userId,
        input.partnerUserId,
        JSON.stringify(input.metadata ?? {}),
        randomUUID(),
        JSON.stringify({ reciprocal: true }),
      ],
    );

    if (!accepted[0]) throw new Error("tandem-accept-failed");
    await writeAuditEvent(userId, {
      action: "tandem.accepted",
      subjectUserId: input.partnerUserId,
      resourceType: "tandem_connection",
      resourceId: String(accepted[0].id),
    });
    await createNotification(input.partnerUserId, {
      kind: "tandem",
      title: "Votre demande tandem a été acceptée",
      body: "Votre connexion est réciproque. Une session structurée peut maintenant commencer.",
      href: "/tandem",
      metadata: { partnerUserId: userId },
    });
    return accepted[0];
  }

  const rows = await sql.query(
    "insert into blossom_tandem_connection (id, user_id, partner_user_id, status, metadata) values ($1::uuid, $2, $3, $4, $5::jsonb) on conflict (user_id, partner_user_id) do update set status = excluded.status, metadata = excluded.metadata, updated_at = current_timestamp returning id, user_id, partner_user_id, status, metadata, created_at, updated_at",
    [
      randomUUID(),
      userId,
      input.partnerUserId,
      input.status,
      JSON.stringify(input.metadata ?? {}),
    ],
  );
  if (!rows[0]) throw new Error("tandem-write-failed");

  await writeAuditEvent(userId, {
    action: `tandem.${input.status}`,
    subjectUserId: input.partnerUserId,
    resourceType: "tandem_connection",
    resourceId: String(rows[0].id),
  });
  if (input.status === "pending") {
    await createNotification(input.partnerUserId, {
      kind: "tandem",
      title: "Une demande tandem vous attend",
      body: "Un apprenant souhaite ouvrir un échange structuré avec vous.",
      href: "/tandem",
      metadata: { partnerUserId: userId },
    });
  }
  return rows[0];
}

export async function startTandemSession(userId: string, partnerUserId: string) {
  await enforceRateLimit(userId, "tandem.start-session", 10, 60);
  assertFeaturePlan(await getServerPlan(userId), "tandem");
  if (userId === partnerUserId) throw new BlossomForbiddenError("Une session tandem exige deux apprenants.");
  const sql = await getSql();
  const access = await sql.query(
    `select
      exists(select 1 from blossom_tandem_connection where user_id = $1 and partner_user_id = $2 and status = 'accepted') as mine,
      exists(select 1 from blossom_tandem_connection where user_id = $2 and partner_user_id = $1 and status = 'accepted') as theirs`,
    [userId, partnerUserId],
  );
  if (!access[0]?.mine || !access[0]?.theirs) {
    throw new BlossomForbiddenError("La connexion tandem n'est pas réciproque.");
  }
  const active = await sql.query(
    `select id from blossom_tandem_session
     where ((user_id = $1 and partner_user_id = $2) or (user_id = $2 and partner_user_id = $1))
       and status = 'active'
     order by created_at desc limit 1`,
    [userId, partnerUserId],
  );
  if (active[0]) return String(active[0].id);

  const sessionId = randomUUID();
  try {
    await sql.query(
      `insert into blossom_tandem_session
        (id, user_id, partner_user_id, status, started_at)
       values ($1::uuid, $2, $3, 'active', current_timestamp)`,
      [sessionId, userId, partnerUserId],
    );
  } catch (error) {
    if ((error as { code?: string })?.code !== "23505") throw error;
    const raced = await sql.query(
      `select id
       from blossom_tandem_session
       where ((user_id = $1 and partner_user_id = $2) or (user_id = $2 and partner_user_id = $1))
         and status = 'active'
       order by created_at desc
       limit 1`,
      [userId, partnerUserId],
    );
    if (raced[0]) return String(raced[0].id);
    throw new Error("tandem-session-create-race");
  }
  await writeAuditEvent(userId, {
    subjectUserId: partnerUserId,
    action: "tandem.session.started",
    resourceType: "tandem_session",
    resourceId: sessionId,
  });
  return sessionId;
}

export async function logTandemPrompt(
  userId: string,
  input: { sessionId: string; language: string; prompt: string },
) {
  await enforceRateLimit(userId, "tandem.prompt", 60, 60);
  const sql = await getSql();
  const rows = await sql.query(
    `select user_id, partner_user_id, status from blossom_tandem_session
     where id = $1::uuid and (user_id = $2 or partner_user_id = $2) limit 1`,
    [input.sessionId, userId],
  );
  if (!rows[0] || String(rows[0].status) !== "active") {
    throw new BlossomForbiddenError("Cette session tandem n'est plus active.");
  }
  const row = await sql.query(
    `insert into blossom_tandem_prompt_log (id, session_id, user_id, language, prompt)
     values ($1::uuid, $2::uuid, $3, $4, $5)
     returning id`,
    [randomUUID(), input.sessionId, userId, input.language, input.prompt.slice(0, 500)],
  );
  return row[0] ? String(row[0].id) : null;
}

export async function endTandemSession(
  userId: string,
  sessionId: string,
  status: "completed" | "cancelled",
) {
  await enforceRateLimit(userId, "tandem.end-session", 10, 60);
  const sql = await getSql();
  const current = await sql.query(
    `select id, user_id, partner_user_id, status, started_at
     from blossom_tandem_session
     where id = $1::uuid and (user_id = $2 or partner_user_id = $2)
     limit 1`,
    [sessionId, userId],
  );
  if (!current[0]) throw new BlossomForbiddenError("Cette session tandem n'est pas disponible.");

  if (status === "completed") {
    const prompts = await sql.query(
      `select user_id, count(*)::integer as count
       from blossom_tandem_prompt_log
       where session_id = $1::uuid
       group by user_id`,
      [sessionId],
    );
    const distinctParticipants = prompts.length;
    const totalPrompts = prompts.reduce((sum, row) => sum + Number(row.count ?? 0), 0);
    const elapsedSeconds = Math.max(
      0,
      Math.floor((Date.now() - new Date(String(current[0].started_at)).getTime()) / 1000),
    );
    if (elapsedSeconds < 120 || distinctParticipants < 2 || totalPrompts < 2) {
      throw new BlossomForbiddenError(
        "La session tandem doit contenir au moins deux minutes et un échange des deux côtés avant d'être validée.",
      );
    }
  }

  const rows = await sql.query(
    `update blossom_tandem_session
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
     where id = $1::uuid and (user_id = $3 or partner_user_id = $3)
       and status = 'active'
     returning id, status, ended_at, duration_seconds`,
    [sessionId, status, userId],
  );
  if (!rows[0]) {
    const terminal = await sql.query(
      `select id, user_id, partner_user_id , status, ended_at, duration_seconds
       from blossom_tandem_session
       where id = $1::uuid
         and (user_id = $2 or partner_user_id = $2)
         
         and status in ('completed', 'cancelled')
       limit 1`,
      [sessionId, userId],
    );
    if (!terminal[0]) throw new BlossomForbiddenError("Cette session tandem n'est plus active.");
    return {
      id: String(terminal[0].id),
      
      status: String(terminal[0].status) as "completed" | "cancelled",
      endedAt: new Date(String(terminal[0].ended_at)).toISOString(),
      durationSeconds: Math.max(0, Number(terminal[0].duration_seconds ?? 0)),
    };
  }
  await writeAuditEvent(userId, {
    action: `tandem.session.${status}`,
    resourceType: "tandem_session",
    resourceId: sessionId,
  });
  return {
    id: String(rows[0].id),
    status: String(rows[0].status),
    endedAt: new Date(String(rows[0].ended_at)).toISOString(),
    durationSeconds: Math.max(0, Number(rows[0].duration_seconds ?? 0)),
  };
}
