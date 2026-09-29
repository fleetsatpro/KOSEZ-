import type { TeacherWorkspaceLearner } from "./access.server";
import type { OrganizationWorkspace } from "./tandem.server";
import type { LearnerDetail } from "./booking.server";
import { mapLearnerDetail } from "./booking.server";
import { assertLearnerAccess } from "./activities.server";
import { BlossomForbiddenError } from "./access.server";
import { getSql } from "@/lib/db";

export async function getTeacherWorkspace(userId: string): Promise<TeacherWorkspaceLearner[]> {
  const sql = await getSql();
  const rows = await sql.query(
    `with scoped_learners as (
       select tl.learner_user_id
       from blossom_teacher_link tl
       where tl.teacher_user_id = $1 and tl.status = 'active'
       union
       select gm.user_id as learner_user_id
       from blossom_organization_group g
       join blossom_organization_group_member gm on gm.group_id = g.id
       where g.teacher_user_id = $1 and g.status = 'active'
     )
     select
       sl.learner_user_id as id,
       coalesce(p.display_name, sl.learner_user_id) as name,
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
       coalesce(pr.scored_attempts, 0)::integer as pronlab_scored_attempts,
       coalesce(pr.best_score, 0)::integer as pronlab_best
     from scoped_learners sl
     left join blossom_profile p on p.user_id = sl.learner_user_id
     left join blossom_activity_event a on a.user_id = sl.learner_user_id
     left join lateral (
       select
         count(*) as attempts,
         count(*) filter (
           where score > 0
             and coalesce(metadata->>'assessment', '') not in ('capture-only', 'transcript')
         ) as scored_attempts,
         max(score) filter (
           where score > 0
             and coalesce(metadata->>'assessment', '') not in ('capture-only', 'transcript')
         ) as best_score
       from blossom_pronlab_attempt
       where user_id = sl.learner_user_id
     ) pr on true
     group by sl.learner_user_id, p.display_name, p.level, pr.attempts, pr.scored_attempts, pr.best_score
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
    pronlabScoredAttempts: Number(row.pronlab_scored_attempts ?? 0),
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
      sql.query("select count(distinct organization_id)::integer as count from blossom_organization_member where status = 'active'"),
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

export async function getOrganizationWorkspace(
  userId: string,
): Promise<OrganizationWorkspace | null> {
  const sql = await getSql();

  // Select exactly one deterministic primary organization first. The previous
  // query could return members from sibling organizations while organizationId
  // was taken from only the first row, creating a cross-tenant data-mixing risk.
  const orgRows = await sql.query(
    `select
       o.id,
       o.name,
       o.metadata,
       me.role
     from blossom_organization o
     join blossom_organization_member me
       on me.organization_id = o.id
      and me.user_id = $1
      and me.status = 'active'
      and me.role in ('owner','admin','teacher')
     order by
       case me.role
         when 'owner' then 0
         when 'admin' then 1
         else 2
       end,
       me.created_at asc,
       o.id asc
     limit 1`,
    [userId],
  );
  if (!orgRows[0]) return null;

  const organizationId = String(orgRows[0].id);
  const [rows, statsRows] = await Promise.all([
    sql.query(
      `select
        m.user_id,
        m.role,
        m.status,
        coalesce(p.display_name, m.user_id) as display_name
       from blossom_organization_member m
       left join blossom_profile p on p.user_id = m.user_id
       where m.organization_id = $1
         and m.status = 'active'
         and (
           exists (
             select 1
             from blossom_organization_member me
             where me.organization_id = $1
               and me.user_id = $2
               and me.status = 'active'
               and me.role in ('owner','admin')
           )
           or m.role <> 'learner'
           or exists (
             select 1
             from blossom_organization_group g
             join blossom_organization_group_member gm
               on gm.group_id = g.id
              and gm.user_id = m.user_id
             where g.organization_id = $1
               and g.teacher_user_id = $2
               and g.status = 'active'
           )
         )
       order by
         case m.role
           when 'owner' then 0
           when 'admin' then 1
           when 'teacher' then 2
           else 3
         end,
         display_name asc`,
      [organizationId, userId],
    ),
    sql.query(
      `select
         count(*) filter (where role = 'learner')::integer as learners,
         count(*) filter (where role <> 'learner')::integer as staff,
         count(distinct m.user_id) filter (
           where m.role = 'learner'
             and a.occurred_at >= current_timestamp - interval '7 days'
         )::integer as active_learners_this_week,
         coalesce(sum(
           case
             when m.role = 'learner'
              and a.occurred_at >= current_timestamp - interval '7 days'
              and a.event_type in ('SPEAK_COMPLETED','TANDEM_COMPLETED')
              and a.payload->'metadata'->>'serverAuthoritativeMinutes' = 'true'
              and coalesce(a.payload->'metadata'->>'minutes', '') ~ '^[0-9]+$'
             then (a.payload->'metadata'->>'minutes')::integer
             else 0
           end
         ), 0)::integer as speaking_minutes
       from blossom_organization_member m
       left join blossom_activity_event a on a.user_id = m.user_id
       where m.organization_id = $1
         and m.status = 'active'
         and (
           exists (
             select 1
             from blossom_organization_member me
             where me.organization_id = $1
               and me.user_id = $2
               and me.status = 'active'
               and me.role in ('owner','admin')
           )
           or m.role <> 'learner'
           or exists (
             select 1
             from blossom_organization_group g
             join blossom_organization_group_member gm
               on gm.group_id = g.id
              and gm.user_id = m.user_id
             where g.organization_id = $1
               and g.teacher_user_id = $2
               and g.status = 'active'
           )
         )`,
      [organizationId, userId],
    ),
  ]);

  const stats = statsRows[0] ?? {};
  const metadata =
    orgRows[0].metadata && typeof orgRows[0].metadata === 'object'
      ? (orgRows[0].metadata as Record<string, unknown>)
      : {};
  const currentRole = String(orgRows[0].role) as OrganizationWorkspace["currentRole"];

  return {
    id: organizationId,
    name: String(orgRows[0].name),
    currentRole,
    city: typeof metadata.city === 'string' ? metadata.city : null,
    members: rows.map((row) => ({
      id: String(row.user_id),
      name: String(row.display_name),
      role: String(row.role),
      status: String(row.status),
    })),
    stats: {
      learners: Number(stats.learners ?? 0),
      staff: Number(stats.staff ?? 0),
      activeLearnersThisWeek: Number(stats.active_learners_this_week ?? 0),
      speakingMinutesThisWeek: Number(stats.speaking_minutes ?? 0),
    },
  };
}

export type LearnerDetail = {
  id: string;
  name: string;
  targetLanguage: string;
  level: string | null;
  goal: string;
  activity: Array<{ id: string; type: string; sourceId: string | null; note: string | null; occurredAt: string }>;
  pronlab: Array<{ id: string; itemId: string; score: number; seconds: number; assessment: string; createdAt: string }>;
  homework: Array<{ id: string; title: string; body: string; status: string; createdAt: string; updatedAt: string }>;
  notes: Array<{ id: string; tags: string[]; text: string; createdAt: string }>;
};

function mapLearnerDetail(
  profile: Record<string, unknown> | undefined,
  activityRows: Record<string, unknown>[],
  pronlabRows: Record<string, unknown>[],
  homeworkRows: Record<string, unknown>[],
  noteRows: Record<string, unknown>[],
): LearnerDetail | null {
  if (!profile) return null;
  const preferences =
    profile.preferences && typeof profile.preferences === "object"
      ? (profile.preferences as Record<string, unknown>)
      : {};
  return {
    id: String(profile.user_id),
    name: String(profile.display_name ?? profile.user_id),
    targetLanguage: String(profile.target_language ?? "en"),
    level: profile.level ? String(profile.level) : null,
    goal: typeof preferences.goal === "string" ? preferences.goal : "",
    activity: activityRows.map((row) => ({
      id: String(row.id),
      type: String(row.event_type),
      sourceId: row.source_id ? String(row.source_id) : null,
      note: row.note ? String(row.note) : null,
      occurredAt: new Date(String(row.occurred_at)).toISOString(),
    })),
    pronlab: pronlabRows.map((row) => ({
      id: String(row.id),
      itemId: String(row.item_id),
      score: Number(row.score ?? 0),
      seconds: Number(row.seconds ?? 0),
      assessment:
        row.metadata && typeof row.metadata === "object"
          ? String((row.metadata as Record<string, unknown>).assessment ?? "unknown")
          : "unknown",
      createdAt: new Date(String(row.created_at)).toISOString(),
    })),
    homework: homeworkRows.map((row) => ({
      id: String(row.id),
      title: String(row.title),
      body: String(row.body),
      status: String(row.status),
      createdAt: new Date(String(row.created_at)).toISOString(),
      updatedAt: new Date(String(row.updated_at)).toISOString(),
    })),
    notes: noteRows.map((row) => ({
      id: String(row.id),
      tags: Array.isArray(row.tags)
        ? row.tags.map(String)
        : row.tags && typeof row.tags === "object"
          ? Object.values(row.tags as Record<string, unknown>).map(String)
          : [],
      text: String(row.note),
      createdAt: new Date(String(row.created_at)).toISOString(),
    })),
  };
}

export async function getTeacherLearnerDetail(
  teacherUserId: string,
  learnerUserId: string,
): Promise<LearnerDetail | null> {
  await assertLearnerAccess(teacherUserId, learnerUserId, "teacher");
  const sql = await getSql();
  const [profile, activity, pronlab, homework, notes] = await Promise.all([
    sql.query(`select user_id, display_name, target_language, level, preferences from blossom_profile where user_id = $1 limit 1`, [learnerUserId]),
    sql.query(`select id, event_type, source_id, note, occurred_at from blossom_activity_event where user_id = $1 order by occurred_at desc limit 24`, [learnerUserId]),
    sql.query(`select id, item_id, score, seconds, metadata, created_at from blossom_pronlab_attempt where user_id = $1 order by created_at desc limit 12`, [learnerUserId]),
    sql.query(`select id, title, body, status, created_at, updated_at from blossom_homework where learner_user_id = $1 order by updated_at desc limit 10`, [learnerUserId]),
    sql.query(`select id, tags, note, created_at from blossom_teacher_note where learner_user_id = $1 and teacher_user_id = $2 order by created_at desc limit 10`, [learnerUserId, teacherUserId]),
  ]);
  return mapLearnerDetail(profile[0], activity, pronlab, homework, notes);
}

export async function getGuardianLearnerDetail(
  guardianUserId: string,
  learnerUserId: string,
): Promise<LearnerDetail | null> {
  await assertLearnerAccess(guardianUserId, learnerUserId, "guardian");
  const sql = await getSql();
  const [profile, activity, homework] = await Promise.all([
    sql.query(`select user_id, display_name, target_language, level, preferences from blossom_profile where user_id = $1 limit 1`, [learnerUserId]),
    sql.query(`select id, event_type, source_id, note, occurred_at from blossom_activity_event where user_id = $1 order by occurred_at desc limit 20`, [learnerUserId]),
    sql.query(`select id, title, body, status, created_at, updated_at from blossom_homework where learner_user_id = $1 order by updated_at desc limit 10`, [learnerUserId]),
  ]);
  return mapLearnerDetail(profile[0], activity, [], homework, []);
}
