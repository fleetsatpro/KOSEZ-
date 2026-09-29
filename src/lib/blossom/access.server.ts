import { getSql } from "@/lib/db";

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

export async function assertAdmin(userId: string) {
  const sql = await getSql();
  const rows = await sql.query(
    `select 1
     from blossom_platform_admin
     where user_id = $1 and status = 'active'
     union all
     select 1
     from blossom_role_grant
     where user_id = $1 and role = 'admin' and status = 'active'
     limit 1`,
    [userId],
  );
  if (!rows[0]) {
    throw new BlossomForbiddenError("Admin access is not enabled for this account.");
  }
}

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
  pronlabScoredAttempts: number;
  pronlabBest: number;
};

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
    `select 1
     from blossom_organization_member staff
     join blossom_organization_member learner
       on learner.organization_id = staff.organization_id
     where staff.user_id = $1
       and staff.status = 'active'
       and learner.user_id = $2
       and learner.status = 'active'
       and learner.role = 'learner'
       and (
         staff.role in ('owner','admin')
         or (
           staff.role = 'teacher'
           and exists (
             select 1
             from blossom_organization_group g
             join blossom_organization_group_member gm
               on gm.group_id = g.id
              and gm.user_id = learner.user_id
             where g.organization_id = staff.organization_id
               and g.teacher_user_id = staff.user_id
               and g.status = 'active'
           )
         )
       )
     limit 1`,
    [actorUserId, learnerUserId],
  );
  return Boolean(rows[0]);
}

export async function assertLearnerAccess(
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