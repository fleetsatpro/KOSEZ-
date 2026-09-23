import { randomUUID } from "node:crypto";
import { getSql } from "@/lib/db";
import { isBootstrapAdminEmail } from "@/lib/auth/admin-bootstrap";

class AdminForbiddenError extends Error {
  readonly status = 403;
  constructor(message = "Forbidden") {
    super(message);
    this.name = "BlossomForbiddenError";
  }
}

export type PlatformRole = "admin" | "teacher" | "org_staff";

async function assertAdmin(userId: string) {
  const sql = await getSql();
  const rows = await sql.query(
    `select 1 from blossom_platform_admin
     where user_id = $1 and status = 'active'
     union
     select 1 from blossom_role_grant
     where user_id = $1 and role = 'admin' and status = 'active'
     limit 1`,
    [userId],
  );
  if (!rows[0]) {
    throw new AdminForbiddenError("Admin access is not enabled for this account.");
  }
}

/** Promote bootstrap emails to platform admin (idempotent). */
export async function ensureBootstrapAdmin(
  userId: string,
  email: string | null | undefined,
): Promise<boolean> {
  if (!isBootstrapAdminEmail(email)) return false;
  const sql = await getSql();
  await sql.query(
    `insert into blossom_platform_admin (user_id, status, created_at, updated_at)
     values ($1, 'active', current_timestamp, current_timestamp)
     on conflict (user_id) do update
       set status = 'active', updated_at = current_timestamp`,
    [userId],
  );
  await sql.query(
    `insert into blossom_role_grant (user_id, role, status, granted_by, note, created_at, updated_at)
     values ($1, 'admin', 'active', $1, 'bootstrap-email', current_timestamp, current_timestamp)
     on conflict (user_id, role) do update
       set status = 'active', updated_at = current_timestamp, note = excluded.note`,
    [userId],
  );
  await sql.query(
    `insert into blossom_audit_event
       (id, actor_user_id, action, subject_user_id, resource_type, resource_id, metadata, occurred_at)
     values ($1, $1, 'bootstrap_admin', $1, 'platform_admin', $1, $2::jsonb, current_timestamp)`,
    [randomUUID(), JSON.stringify({ email: email?.toLowerCase() ?? null })],
  );
  return true;
}

export type AdminUserRow = {
  id: string;
  name: string;
  email: string | null;
  level: string | null;
  isAdmin: boolean;
  isTeacher: boolean;
  isOrgStaff: boolean;
  updatedAt: string | null;
};

export async function listPlatformUsers(
  actorUserId: string,
  limit = 50,
): Promise<AdminUserRow[]> {
  await assertAdmin(actorUserId);
  const sql = await getSql();
  const rows = await sql.query(
    `select
      p.user_id as id,
      coalesce(nullif(p.display_name, ''), p.user_id) as name,
      nullif(p.preferences->>'email', '') as email,
      p.level,
      p.updated_at,
      exists(
        select 1 from blossom_platform_admin a
        where a.user_id = p.user_id and a.status = 'active'
      ) or exists(
        select 1 from blossom_role_grant g
        where g.user_id = p.user_id and g.role = 'admin' and g.status = 'active'
      ) as is_admin,
      exists(
        select 1 from blossom_teacher_link t
        where t.teacher_user_id = p.user_id and t.status = 'active'
      ) or exists(
        select 1 from blossom_role_grant g
        where g.user_id = p.user_id and g.role = 'teacher' and g.status = 'active'
      ) as is_teacher,
      exists(
        select 1 from blossom_organization_member m
        where m.user_id = p.user_id and m.status = 'active'
          and m.role in ('owner','admin','teacher')
      ) or exists(
        select 1 from blossom_role_grant g
        where g.user_id = p.user_id and g.role = 'org_staff' and g.status = 'active'
      ) as is_org_staff
    from blossom_profile p
    where p.user_id is not null
    order by p.updated_at desc nulls last
    limit $1`,
    [Math.min(200, Math.max(1, limit))],
  );

  const authUsers = await sql
    .query(
      `select id, name, email, "updatedAt" as updated_at
       from "user"
       order by "updatedAt" desc nulls last
       limit $1`,
      [Math.min(200, Math.max(1, limit))],
    )
    .catch(() => [] as Array<Record<string, unknown>>);

  const byId = new Map<string, AdminUserRow>();
  for (const row of rows) {
    byId.set(String(row.id), {
      id: String(row.id),
      name: String(row.name),
      email: row.email ? String(row.email) : null,
      level: row.level ? String(row.level) : null,
      isAdmin: Boolean(row.is_admin),
      isTeacher: Boolean(row.is_teacher),
      isOrgStaff: Boolean(row.is_org_staff),
      updatedAt: row.updated_at
        ? new Date(String(row.updated_at)).toISOString()
        : null,
    });
  }
  for (const row of authUsers) {
    const id = String(row.id);
    const existing = byId.get(id);
    if (existing) {
      if (!existing.email && row.email) existing.email = String(row.email);
      if (existing.name === id && row.name) existing.name = String(row.name);
      continue;
    }
    byId.set(id, {
      id,
      name: row.name ? String(row.name) : id,
      email: row.email ? String(row.email) : null,
      level: null,
      isAdmin: false,
      isTeacher: false,
      isOrgStaff: false,
      updatedAt: row.updated_at
        ? new Date(String(row.updated_at)).toISOString()
        : null,
    });
  }

  for (const user of byId.values()) {
    const flags = await sql.query(
      `select
        exists(select 1 from blossom_platform_admin where user_id = $1 and status = 'active')
          or exists(select 1 from blossom_role_grant where user_id = $1 and role = 'admin' and status = 'active') as is_admin,
        exists(select 1 from blossom_teacher_link where teacher_user_id = $1 and status = 'active')
          or exists(select 1 from blossom_role_grant where user_id = $1 and role = 'teacher' and status = 'active') as is_teacher,
        exists(select 1 from blossom_role_grant where user_id = $1 and role = 'org_staff' and status = 'active') as is_org_staff`,
      [user.id],
    );
    const f = flags[0] ?? {};
    user.isAdmin = Boolean(f.is_admin);
    user.isTeacher = Boolean(f.is_teacher);
    user.isOrgStaff = Boolean(f.is_org_staff);
  }

  return [...byId.values()].sort((a, b) => {
    if (a.isAdmin !== b.isAdmin) return a.isAdmin ? -1 : 1;
    return (b.updatedAt ?? "").localeCompare(a.updatedAt ?? "");
  });
}

export async function setUserPlatformRole(
  actorUserId: string,
  targetUserId: string,
  role: PlatformRole,
  active: boolean,
): Promise<{ ok: true }> {
  await assertAdmin(actorUserId);
  if (!targetUserId.trim()) {
    throw new AdminForbiddenError("Invalid user id.");
  }
  if (actorUserId === targetUserId && role === "admin" && !active) {
    throw new AdminForbiddenError("You cannot revoke your own admin role.");
  }

  const sql = await getSql();
  const status = active ? "active" : "revoked";

  await sql.query(
    `insert into blossom_role_grant (user_id, role, status, granted_by, created_at, updated_at)
     values ($1, $2, $3, $4, current_timestamp, current_timestamp)
     on conflict (user_id, role) do update
       set status = excluded.status,
           granted_by = excluded.granted_by,
           updated_at = current_timestamp`,
    [targetUserId, role, status, actorUserId],
  );

  if (role === "admin") {
    if (active) {
      await sql.query(
        `insert into blossom_platform_admin (user_id, status, created_at, updated_at)
         values ($1, 'active', current_timestamp, current_timestamp)
         on conflict (user_id) do update
           set status = 'active', updated_at = current_timestamp`,
        [targetUserId],
      );
    } else {
      await sql.query(
        `update blossom_platform_admin
         set status = 'revoked', updated_at = current_timestamp
         where user_id = $1`,
        [targetUserId],
      );
    }
  }

  await sql.query(
    `insert into blossom_audit_event
       (id, actor_user_id, action, subject_user_id, resource_type, resource_id, metadata, occurred_at)
     values ($1, $2, $3, $4, 'role_grant', $5, $6::jsonb, current_timestamp)`,
    [
      randomUUID(),
      actorUserId,
      active ? "grant_role" : "revoke_role",
      targetUserId,
      role,
      JSON.stringify({ role, status }),
    ],
  );

  return { ok: true };
}
