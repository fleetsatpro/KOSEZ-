import { randomUUID } from "node:crypto";
import { getSql } from "@/lib/db";
import { normalizeMutationTime } from "./sync-causality";
import { MARKETPLACE } from "./data";
import { getPublishedContent } from "./content.server";

export class BlossomForbiddenError extends Error {
  readonly status = 403;
  constructor(message = "Forbidden") {
    super(message);
    this.name = "BlossomForbiddenError";
  }
}

export type BlossomAccessContext = {
  isTeacher: boolean;
  isGuardian: boolean;
  isOrgStaff: boolean;
  isChild: boolean;
  isAdmin: boolean;
};

export async function getBlossomAccessContext(userId: string): Promise<BlossomAccessContext> {
  const sql = await getSql();
  const rows = await sql.query(
    `select
      exists(
        select 1 from blossom_teacher_link
        where teacher_user_id = $1 and status = 'active'
      ) as is_teacher,
      exists(
        select 1 from blossom_guardian_link
        where guardian_user_id = $1 and status = 'active'
      ) as is_guardian,
      exists(
        select 1 from blossom_organization_member
        where user_id = $1
          and status = 'active'
          and role in ('owner','admin','teacher')
      ) as is_org_staff,
      exists(
        select 1 from blossom_guardian_link
        where learner_user_id = $1 and status = 'active'
      ) as is_child,
      exists(
        select 1 from blossom_platform_admin
        where user_id = $1 and status = 'active'
      ) as is_admin`,
    [userId],
  );
  const row = rows[0] ?? {};
  return {
    isTeacher: Boolean(row.is_teacher),
    isGuardian: Boolean(row.is_guardian),
    isOrgStaff: Boolean(row.is_org_staff),
    isChild: Boolean(row.is_child),
    isAdmin: Boolean(row.is_admin),
  };
}

export type TeacherWorkspaceLearner = {
  id: string;
  name: string;
  level: string | null;
  lastActivity: string | null;
  activitiesThisWeek: number;
  speakingMinutes: number;
  pronlabAttempts: number;
  pronlabBest: number;
};

export async function getTeacherWorkspace(userId: string): Promise<TeacherWorkspaceLearner[]> {
  const sql = await getSql();
  const rows = await sql.query(
    `select
      tl.learner_user_id as id,
      coalesce(p.display_name, tl.learner_user_id) as name,
      p.level,
      max(a.occurred_at) as last_activity,
      count(*) filter (
        where a.occurred_at >= current_timestamp - interval '7 days'
      )::integer as activities_this_week,
      coalesce(sum(
        case
          when a.event_type in ('SPEAK_COMPLETED','TANDEM_COMPLETED')
           and coalesce(a.payload->'metadata'->>'minutes', a.payload->>'minutes','') ~ '^[0-9]+$'
          then coalesce(
            (a.payload->'metadata'->>'minutes')::integer,
            (a.payload->>'minutes')::integer
          )
          else 0
        end
      ), 0)::integer as speaking_minutes,
      coalesce(pr.attempts, 0)::integer as pronlab_attempts,
      coalesce(pr.best_score, 0)::integer as pronlab_best
    from blossom_teacher_link tl
    left join blossom_profile p on p.user_id = tl.learner_user_id
    left join blossom_activity_event a on a.user_id = tl.learner_user_id
    left join lateral (
      select count(*) as attempts, max(score) as best_score
      from blossom_pronlab_attempt
      where user_id = tl.learner_user_id
    ) pr on true
    where tl.teacher_user_id = $1 and tl.status = 'active'
    group by tl.learner_user_id, p.display_name, p.level, pr.attempts, pr.best_score
    order by last_activity desc nulls last, name asc`,
    [userId],
  );
  return rows.map((row) => ({
    id: String(row.id),
    name: String(row.name),
    level: row.level ? String(row.level) : null,
    lastActivity: row.last_activity
      ? new Date(String(row.last_activity)).toISOString()
      : null,
    activitiesThisWeek: Number(row.activities_this_week ?? 0),
    speakingMinutes: Number(row.speaking_minutes ?? 0),
    pronlabAttempts: Number(row.pronlab_attempts ?? 0),
    pronlabBest: Number(row.pronlab_best ?? 0),
  }));
}

export type GuardianWorkspaceLearner = {
  id: string;
  name: string;
  level: string | null;
  lastActivity: string | null;
  activitiesThisWeek: number;
  speakingMinutes: number;
};

export async function getGuardianWorkspace(userId: string): Promise<GuardianWorkspaceLearner[]> {
  const sql = await getSql();
  const rows = await sql.query(
    `select
      gl.learner_user_id as id,
      coalesce(p.display_name, gl.learner_user_id) as name,
      p.level,
      max(a.occurred_at) as last_activity,
      count(*) filter (
        where a.occurred_at >= current_timestamp - interval '7 days'
      )::integer as activities_this_week,
      coalesce(sum(
        case
          when a.event_type in ('SPEAK_COMPLETED','TANDEM_COMPLETED')
           and coalesce(a.payload->'metadata'->>'minutes', a.payload->>'minutes','') ~ '^[0-9]+$'
          then coalesce(
            (a.payload->'metadata'->>'minutes')::integer,
            (a.payload->>'minutes')::integer
          )
          else 0
        end
      ), 0)::integer as speaking_minutes
    from blossom_guardian_link gl
    left join blossom_profile p on p.user_id = gl.learner_user_id
    left join blossom_activity_event a on a.user_id = gl.learner_user_id
    where gl.guardian_user_id = $1 and gl.status = 'active'
    group by gl.learner_user_id, p.display_name, p.level
    order by name asc`,
    [userId],
  );
  return rows.map((row) => ({
    id: String(row.id),
    name: String(row.name),
    level: row.level ? String(row.level) : null,
    lastActivity: row.last_activity
      ? new Date(String(row.last_activity)).toISOString()
      : null,
    activitiesThisWeek: Number(row.activities_this_week ?? 0),
    speakingMinutes: Number(row.speaking_minutes ?? 0),
  }));
}

async function getServerPlan(userId: string): Promise<"centre" | "digital" | "premium"> {
  const sql = await getSql();
  const rows = await sql.query(
    "select plan from blossom_subscription where user_id = $1 and status = 'active' limit 1",
    [userId],
  );
  const plan = String(rows[0]?.plan ?? "centre");
  return plan === "premium" || plan === "digital" ? plan : "centre";
}

function assertFeaturePlan(
  plan: "centre" | "digital" | "premium",
  feature: "tandem" | "immersionEarly",
) {
  if (feature === "tandem" && plan === "digital") {
    throw new BlossomForbiddenError(
      "Le tandem n'est pas inclus dans cette formule.",
    );
  }
  if (feature === "immersionEarly" && plan === "digital") {
    throw new BlossomForbiddenError(
      "L'accès anticipé n'est pas inclus dans cette formule.",
    );
  }
}

export type AdminWorkspace = {
  profiles: number;
  teachers: number;
  guardians: number;
  activeOrganizations: number;
  joinedEventRegistrations: number;
  bookingRequests: {
    requested: number;
    confirmed: number;
    cancelled: number;
    paid: number;
    unpaid: number;
  };
  recentAudit: Array<{
    id: string;
    action: string;
    actorUserId: string;
    subjectUserId: string | null;
    resourceType: string;
    resourceId: string | null;
    occurredAt: string;
  }>;
};

export async function getAdminWorkspace(userId: string): Promise<AdminWorkspace> {
  const sql = await getSql();
  const admin = await sql.query(
    "select 1 from blossom_platform_admin where user_id = $1 and status = 'active' limit 1",
    [userId],
  );
  if (!admin[0]) {
    throw new BlossomForbiddenError("Admin access is not enabled for this account.");
  }

  const [learners, teachers, guardians, organizations, registrations, bookings, audits] =
    await Promise.all([
      sql.query("select count(*)::integer as count from blossom_profile where user_id is not null"),
      sql.query("select count(distinct teacher_user_id)::integer as count from blossom_teacher_link where status = 'active'"),
      sql.query("select count(distinct guardian_user_id)::integer as count from blossom_guardian_link where status = 'active'"),
      sql.query("select count(*)::integer as count from blossom_organization"),
      sql.query("select count(*)::integer as count from blossom_event_registration where status = 'joined'"),
      sql.query(
        "select count(*) filter (where status = 'requested')::integer as requested, count(*) filter (where status = 'confirmed')::integer as confirmed, count(*) filter (where status = 'cancelled')::integer as cancelled, count(*) filter (where payment_status = 'paid')::integer as paid, count(*) filter (where payment_status = 'unpaid')::integer as unpaid from blossom_booking_request",
      ),
      sql.query(
        "select id, actor_user_id, action, subject_user_id, resource_type, resource_id, occurred_at from blossom_audit_event order by occurred_at desc limit 24",
      ),
    ]);

  const booking = bookings[0] ?? {};
  return {
    profiles: Number(learners[0]?.count ?? 0),
    teachers: Number(teachers[0]?.count ?? 0),
    guardians: Number(guardians[0]?.count ?? 0),
    activeOrganizations: Number(organizations[0]?.count ?? 0),
    joinedEventRegistrations: Number(registrations[0]?.count ?? 0),
    bookingRequests: {
      requested: Number(booking.requested ?? 0),
      confirmed: Number(booking.confirmed ?? 0),
      cancelled: Number(booking.cancelled ?? 0),
      paid: Number(booking.paid ?? 0),
      unpaid: Number(booking.unpaid ?? 0),
    },
    recentAudit: audits.map((row) => ({
      id: String(row.id),
      action: String(row.action),
      actorUserId: String(row.actor_user_id),
      subjectUserId: row.subject_user_id ? String(row.subject_user_id) : null,
      resourceType: String(row.resource_type),
      resourceId: row.resource_id ? String(row.resource_id) : null,
      occurredAt: new Date(String(row.occurred_at)).toISOString(),
    })),
  };
}

export type ConnectPeer = {
  id: string;
  name: string;
  level: string | null;
  city: string | null;
  interests: string[];
  lastSeen: string | null;
  sharedEvents: number;
};

export async function getConnectPeers(userId: string): Promise<ConnectPeer[]> {
  const sql = await getSql();
  const rows = await sql.query(
    `select
      p.user_id as id,
      coalesce(nullif(p.display_name, ''), p.user_id) as name,
      p.level,
      p.preferences->>'city' as city,
      p.preferences->'interests' as interests,
      max(their.updated_at) as last_seen,
      count(distinct mine.event_id)::integer as shared_events
    from blossom_event_registration mine
    join blossom_event_registration their
      on their.event_id = mine.event_id
     and their.status = 'joined'
     and their.user_id <> $1
    join blossom_profile p on p.user_id = their.user_id
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
    order by display_name asc`,
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

export type OrganizationWorkspace = {
  id: string;
  name: string;
  city: string | null;
  members: Array<{
    id: string;
    name: string;
    role: string;
    status: string;
  }>;
};

export async function getOrganizationWorkspace(
  userId: string,
): Promise<OrganizationWorkspace | null> {
  const sql = await getSql();
  const rows = await sql.query(
    `select
      o.id,
      o.name,
      o.metadata,
      m.user_id,
      m.role,
      m.status,
      coalesce(p.display_name, m.user_id) as display_name
    from blossom_organization o
    join blossom_organization_member me
      on me.organization_id = o.id
     and me.user_id = $1
     and me.status = 'active'
     and me.role in ('owner','admin','teacher')
    join blossom_organization_member m
      on m.organization_id = o.id
     and m.status = 'active'
    left join blossom_profile p on p.user_id = m.user_id
    order by m.role, display_name`,
    [userId],
  );
  if (!rows[0]) return null;

  const metadata =
    rows[0].metadata && typeof rows[0].metadata === "object"
      ? (rows[0].metadata as Record<string, unknown>)
      : {};

  return {
    id: String(rows[0].id),
    name: String(rows[0].name),
    city: typeof metadata.city === "string" ? metadata.city : null,
    members: rows.map((row) => ({
      id: String(row.user_id),
      name: String(row.display_name),
      role: String(row.role),
      status: String(row.status),
    })),
  };
}

export async function requestCatalogueBooking(
  userId: string,
  catalogueItemId: string,
) {
  const { catalogue } = await getPublishedContent();
  if (!catalogue.some((item) => item.id === catalogueItemId)) {
    throw new Error("unknown-catalogue-item");
  }
  const sql = await getSql();
  const rows = await sql.query(
    `insert into blossom_booking_request (id, user_id, catalogue_item_id, status)
     values ($1::uuid, $2, $3, 'requested')
     on conflict (user_id, catalogue_item_id)
     do update set
       status = case
         when blossom_booking_request.status = 'confirmed'
           then blossom_booking_request.status
         else 'requested'
       end,
       updated_at = current_timestamp
     returning id, catalogue_item_id, status, payment_status, created_at, updated_at`,
    [randomUUID(), userId, catalogueItemId],
  );
  if (rows[0]) return rows[0];

  const current = await sql.query(
    `select id, catalogue_item_id, status, payment_status, created_at, updated_at
     from blossom_booking_request
     where user_id = $1 and catalogue_item_id = $2`,
    [userId, catalogueItemId],
  );
  if (!current[0]) throw new Error("booking-request-write-failed");
  return current[0];
}

export async function requestWaitlist(userId: string, itemId: string) {
  const item = MARKETPLACE.find((entry) => entry.id === itemId);
  if (!item) throw new Error("unknown-waitlist-item");
  if (item.early) assertFeaturePlan(await getServerPlan(userId), "immersionEarly");
  const sql = await getSql();
  const rows = await sql.query(
    `insert into blossom_waitlist_request (id, user_id, item_id, status)
     values ($1::uuid, $2, $3, 'requested')
     on conflict (user_id, item_id)
     do update set
       status = case
         when blossom_waitlist_request.status = 'notified'
           then blossom_waitlist_request.status
         else 'requested'
       end,
       updated_at = current_timestamp
     returning id, item_id, status, created_at, updated_at`,
    [randomUUID(), userId, itemId],
  );
  if (rows[0]) return rows[0];

  const current = await sql.query(
    `select id, item_id, status, created_at, updated_at
     from blossom_waitlist_request
     where user_id = $1 and item_id = $2`,
    [userId, itemId],
  );
  if (!current[0]) throw new Error("waitlist-write-failed");
  return current[0];
}

export type PronlabAttemptInput = {
  itemId: string;
  score: number;
  seconds: number;
  tip?: string | null;
  metadata?: Record<string, unknown>;
  idempotencyKey?: string | null;
};

export async function recordPronlabAttempt(
  userId: string,
  input: PronlabAttemptInput,
) {
  const sql = await getSql();
  const recordId = input.idempotencyKey ?? randomUUID();
  const metadata = input.metadata ?? {};
  const safeScore = 0;
  const safeMetadata = {
    ...metadata,
    assessment: "capture-only",
    provider: "unavailable",
  };

  if (input.idempotencyKey) {
    const existing = await sql.query(
      "select id, item_id, score, seconds, tip, metadata, created_at from blossom_pronlab_attempt where user_id = $1 and idempotency_key = $2::uuid",
      [userId, input.idempotencyKey],
    );
    if (existing[0]) return existing[0];
  }

  const rows = await sql.query(
    "insert into blossom_pronlab_attempt (id, user_id, item_id, idempotency_key, score, seconds, tip, metadata) values ($1::uuid, $2, $3, $4::uuid, $5, $6, $7, $8::jsonb) on conflict (user_id, idempotency_key) do update set idempotency_key = excluded.idempotency_key returning id, item_id, score, seconds, tip, metadata, created_at",
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
    metadata?: Record<string, unknown>;
    mutationCreatedAt?: string;
  },
) {
  const sql = await getSql();
  const causalTime = normalizeMutationTime(input.mutationCreatedAt);
  const rows = await sql.query(
    "insert into blossom_vocabulary (user_id, word, gloss, metadata, updated_at) values ($1, $2, $3, $4::jsonb, coalesce($5::timestamptz, current_timestamp)) on conflict (user_id, word) do update set gloss = excluded.gloss, metadata = excluded.metadata, updated_at = excluded.updated_at where blossom_vocabulary.updated_at <= excluded.updated_at returning word, gloss, metadata, first_saved_at, updated_at",
    [
      userId,
      input.word.toLowerCase(),
      input.gloss,
      JSON.stringify(input.metadata ?? {}),
      causalTime,
    ],
  );
  if (rows[0]) return rows[0];

  const current = await sql.query(
    "select word, gloss, metadata, first_saved_at, updated_at from blossom_vocabulary where user_id = $1 and word = $2",
    [userId, input.word.toLowerCase()],
  );
  if (!current[0]) throw new Error("vocabulary-write-failed");
  return current[0];
}

export async function setTandemStatus(
  userId: string,
  input: {
    partnerUserId: string;
    status: "suggested" | "pending" | "accepted" | "blocked" | "paused";
    metadata?: Record<string, unknown>;
  },
) {
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
      "insert into blossom_tandem_connection (id, user_id, partner_user_id, status, metadata) values ($1::uuid, $2, $3, 'accepted', $4::jsonb) on conflict (user_id, partner_user_id) do update set status = 'accepted', metadata = excluded.metadata, updated_at = current_timestamp returning id, user_id, partner_user_id, status, metadata, created_at, updated_at",
      [
        randomUUID(),
        userId,
        input.partnerUserId,
        JSON.stringify(input.metadata ?? {}),
      ],
    );

    await sql.query(
      "insert into blossom_tandem_connection (id, user_id, partner_user_id, status, metadata) values ($1::uuid, $2, $3, 'accepted', $4::jsonb) on conflict (user_id, partner_user_id) do update set status = 'accepted', metadata = excluded.metadata, updated_at = current_timestamp",
      [
        randomUUID(),
        input.partnerUserId,
        userId,
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
  return rows[0];
}

export async function registerEvent(
  userId: string,
  eventId: string,
  status: "joined" | "waitlist" | "cancelled",
) {
  const sql = await getSql();
  const event =
    status === "joined" || status === "waitlist"
      ? (await getPublishedContent()).events.find((item) => item.id === eventId)
      : null;
  if ((status === "joined" || status === "waitlist") && !event) {
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

async function canActForLearner(
  actorUserId: string,
  learnerUserId: string,
  relation: "teacher" | "guardian",
): Promise<boolean> {
  if (actorUserId === learnerUserId) return relation === "guardian";
  const sql = await getSql();

  const table =
    relation === "teacher" ? "blossom_teacher_link" : "blossom_guardian_link";
  const rows = await sql.query(
    "select 1 from " + table + " where " +
      (relation === "teacher" ? "teacher_user_id" : "guardian_user_id") +
      " = $1 and learner_user_id = $2 and status = 'active' limit 1",
    [actorUserId, learnerUserId],
  );
  return Boolean(rows[0]);
}

async function canActAsOrgStaff(
  actorUserId: string,
  learnerUserId: string,
): Promise<boolean> {
  const sql = await getSql();
  const rows = await sql.query(
    "select 1 from blossom_organization_member staff join blossom_organization_member learner on learner.organization_id = staff.organization_id where staff.user_id = $1 and staff.status = 'active' and staff.role in ('owner','admin','teacher') and learner.user_id = $2 and learner.status = 'active' and learner.role = 'learner' limit 1",
    [actorUserId, learnerUserId],
  );
  return Boolean(rows[0]);
}

async function assertLearnerAccess(
  actorUserId: string,
  learnerUserId: string,
  relation: "teacher" | "guardian",
) {
  if (
    !(await canActForLearner(actorUserId, learnerUserId, relation)) &&
    !(relation === "teacher" && (await canActAsOrgStaff(actorUserId, learnerUserId)))
  ) {
    throw new BlossomForbiddenError("You are not allowed to access this learner.");
  }
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
  await assertLearnerAccess(actorUserId, input.learnerUserId, "teacher");
  const sql = await getSql();
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
  await assertLearnerAccess(actorUserId, input.learnerUserId, "teacher");
  const sql = await getSql();
  const rows = await sql.query(
    "insert into blossom_teacher_note (id, teacher_user_id, learner_user_id, tags, note) values ($1::uuid, $2, $3, $4::jsonb, $5) returning id, teacher_user_id, learner_user_id, tags, note, created_at, updated_at",
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

export async function writeAuditEvent(
  actorUserId: string,
  input: {
    action: string;
    subjectUserId?: string | null;
    resourceType: string;
    resourceId?: string | null;
    metadata?: Record<string, unknown>;
  },
) {
  const sql = await getSql();
  await sql.query(
    "insert into blossom_audit_event (id, actor_user_id, action, subject_user_id, resource_type, resource_id, metadata) values ($1::uuid, $2, $3, $4, $5, $6, $7::jsonb)",
    [
      randomUUID(),
      actorUserId,
      input.action,
      input.subjectUserId ?? null,
      input.resourceType,
      input.resourceId ?? null,
      JSON.stringify(input.metadata ?? {}),
    ],
  );
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
  const sql = await getSql();
  const id = input.id ?? randomUUID();
  const rows = await sql.query(
    "insert into blossom_learning_submission (id, user_id, task_id, kind, content, checks, result) values ($1::uuid, $2, $3, $4, $5, $6::jsonb, $7::jsonb) on conflict (id) do update set content = excluded.content, checks = excluded.checks, result = excluded.result, updated_at = current_timestamp returning id, task_id, kind, content, checks, result, created_at, updated_at",
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
