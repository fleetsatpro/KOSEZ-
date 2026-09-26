import { randomUUID } from "node:crypto";
import { getSql } from "@/lib/db";
import { BlossomForbiddenError, createNotification, writeAuditEvent } from "./domain.server";

export type OrganizationGroupKind = "class" | "cohort";
export type OrganizationGroupStatus = "active" | "archived";

export type OrganizationGroupMember = {
  id: string;
  name: string;
  joinedAt: string;
};

export type OrganizationGroup = {
  id: string;
  name: string;
  kind: OrganizationGroupKind;
  status: OrganizationGroupStatus;
  teacher: { id: string; name: string } | null;
  learnerCount: number;
  activeLearnersThisWeek: number;
  updatedAt: string;
  members: OrganizationGroupMember[];
};

async function organizationRole(
  userId: string,
  organizationId: string,
): Promise<"owner" | "admin" | "teacher"> {
  const sql = await getSql();
  const rows = await sql.query(
    "select role from blossom_organization_member where organization_id = $1::uuid and user_id = $2 and status = 'active' and role in ('owner','admin','teacher') limit 1",
    [organizationId, userId],
  );
  const role = rows[0]?.role;
  if (role !== "owner" && role !== "admin" && role !== "teacher") {
    throw new BlossomForbiddenError("Ce compte n'est pas un membre actif de cette organisation.");
  }
  return role;
}

async function assertOrganizationManager(userId: string, organizationId: string) {
  const role = await organizationRole(userId, organizationId);
  if (role !== "owner" && role !== "admin") {
    throw new BlossomForbiddenError("La gestion de la structure organisationnelle exige un rôle owner ou admin.");
  }
  return role;
}

async function assertOrganizationMember(
  organizationId: string,
  userId: string,
  expectedRole?: "learner" | "owner" | "admin" | "teacher",
) {
  const sql = await getSql();
  const rows = await sql.query(
    "select role from blossom_organization_member where organization_id = $1::uuid and user_id = $2 and status = 'active' limit 1",
    [organizationId, userId],
  );
  if (!rows[0]) throw new BlossomForbiddenError("Cet utilisateur n'est pas un membre actif de cette organisation.");
  if (expectedRole && String(rows[0].role) !== expectedRole) {
    throw new BlossomForbiddenError("Le rôle organisationnel de cet utilisateur ne permet pas cette opération.");
  }
  return String(rows[0].role);
}

async function assertGroupAccess(
  userId: string,
  groupId: string,
  requireManager = false,
) {
  const sql = await getSql();
  const rows = await sql.query(
    "select g.id, g.organization_id, g.name, g.kind, g.status from blossom_organization_group g where g.id = $1::uuid limit 1",
    [groupId],
  );
  const group = rows[0];
  if (!group) throw new BlossomForbiddenError("Cette classe ou cohorte n'existe plus.");
  if (requireManager) {
    await assertOrganizationManager(userId, String(group.organization_id));
  } else {
    await organizationRole(userId, String(group.organization_id));
  }
  return {
    id: String(group.id),
    organizationId: String(group.organization_id),
    name: String(group.name),
    kind: String(group.kind) as OrganizationGroupKind,
    status: String(group.status) as OrganizationGroupStatus,
  };
}

async function assertGroupMemberManager(userId: string, groupId: string) {
  const group = await assertGroupAccess(userId, groupId, false);
  const role = await organizationRole(userId, group.organizationId);
  if (role === "owner" || role === "admin") return group;
  const sql = await getSql();
  const rows = await sql.query(
    "select 1 from blossom_organization_group where id = $1::uuid and teacher_user_id = $2 and status = 'active' limit 1",
    [groupId, userId],
  );
  if (!rows[0]) {
    throw new BlossomForbiddenError("Un enseignant ne peut modifier que ses propres groupes.");
  }
  return group;
}

function mapMember(row: Record<string, unknown>): OrganizationGroupMember {
  return {
    id: String(row.user_id),
    name: String(row.display_name),
    joinedAt: new Date(String(row.joined_at)).toISOString(),
  };
}

export async function getOrganizationGroups(
  userId: string,
  organizationId: string,
): Promise<OrganizationGroup[]> {
  await organizationRole(userId, organizationId);
  const sql = await getSql();
  const role = await organizationRole(userId, organizationId);
  const groupScope = role === "owner" || role === "admin"
    ? ""
    : " and g.teacher_user_id = $2";
  const groupParams = role === "owner" || role === "admin"
    ? [organizationId]
    : [organizationId, userId];
  const memberScope = role === "owner" || role === "admin"
    ? ""
    : " and g.teacher_user_id = $2";
  const memberParams = role === "owner" || role === "admin"
    ? [organizationId]
    : [organizationId, userId];
  const [groups, members] = await Promise.all([
    sql.query(
      "select g.id, g.name, g.kind, g.status, g.teacher_user_id, coalesce(tp.display_name, g.teacher_user_id) as teacher_name, g.updated_at, (select count(distinct gm2.user_id)::integer from blossom_organization_group_member gm2 join blossom_activity_event a2 on a2.user_id = gm2.user_id where gm2.group_id = g.id and a2.occurred_at >= current_timestamp - interval '7 days') as active_learners_this_week from blossom_organization_group g left join blossom_profile tp on tp.user_id = g.teacher_user_id where g.organization_id = $1::uuid" + groupScope + " order by case when g.status = 'active' then 0 else 1 end, g.name asc",
      groupParams,
    ),
    sql.query(
      "select gm.group_id, gm.user_id, gm.joined_at, coalesce(p.display_name, gm.user_id) as display_name from blossom_organization_group_member gm join blossom_organization_group g on g.id = gm.group_id left join blossom_profile p on p.user_id = gm.user_id where g.organization_id = $1::uuid" + memberScope + " order by gm.joined_at asc",
      memberParams,
    ),
  ]);

  const memberMap = new Map<string, OrganizationGroupMember[]>();
  for (const row of members) {
    const list = memberMap.get(String(row.group_id)) ?? [];
    list.push(mapMember(row));
    memberMap.set(String(row.group_id), list);
  }

  return groups.map((row) => {
    const id = String(row.id);
    const groupMembers = memberMap.get(id) ?? [];
    return {
      id,
      name: String(row.name),
      kind: String(row.kind) as OrganizationGroupKind,
      status: String(row.status) as OrganizationGroupStatus,
      teacher: row.teacher_user_id
        ? { id: String(row.teacher_user_id), name: String(row.teacher_name ?? row.teacher_user_id) }
        : null,
      learnerCount: groupMembers.length,
      activeLearnersThisWeek: Number(row.active_learners_this_week ?? 0),
      updatedAt: new Date(String(row.updated_at)).toISOString(),
      members: groupMembers,
    };
  });
}

export async function createOrganizationGroup(
  userId: string,
  input: {
    organizationId: string;
    name: string;
    kind: OrganizationGroupKind;
    teacherUserId?: string | null;
  },
) {
  await assertOrganizationManager(userId, input.organizationId);
  const name = input.name.trim();
  if (name.length < 2 || name.length > 100) {
    throw new BlossomForbiddenError("Le nom doit contenir entre 2 et 100 caractères.");
  }

  if (input.teacherUserId) {
    const role = await assertOrganizationMember(input.organizationId, input.teacherUserId);
    if (!["owner", "admin", "teacher"].includes(role)) {
      throw new BlossomForbiddenError("Le responsable choisi doit être un membre du personnel.");
    }
  }

  const sql = await getSql();
  const existing = await sql.query(
    "select 1 from blossom_organization_group where organization_id = $1::uuid and lower(name) = lower($2) and status = 'active' limit 1",
    [input.organizationId, name],
  );
  if (existing[0]) throw new BlossomForbiddenError("Une classe ou cohorte active porte déjà ce nom.");

  const id = randomUUID();
  const rows = await sql.query(
    "insert into blossom_organization_group (id, organization_id, name, kind, teacher_user_id, created_by_user_id) values ($1::uuid, $2::uuid, $3, $4, $5, $6) returning id, name, kind, status, teacher_user_id, created_at, updated_at",
    [id, input.organizationId, name, input.kind, input.teacherUserId ?? null, userId],
  );
  if (!rows[0]) throw new Error("organization-group-write-failed");

  await writeAuditEvent(userId, {
    action: "organization.group.created",
    resourceType: "organization_group",
    resourceId: id,
    metadata: { organizationId: input.organizationId, kind: input.kind, teacherUserId: input.teacherUserId ?? null },
  });

  if (input.teacherUserId) {
    await createNotification(input.teacherUserId, {
      kind: "system",
      title: "Nouvelle classe assignée",
      body: name,
      href: "/moi",
      metadata: { organizationId: input.organizationId, groupId: id },
    });
  }

  return {
    id: String(rows[0].id),
    name: String(rows[0].name),
    kind: String(rows[0].kind) as OrganizationGroupKind,
    status: String(rows[0].status) as OrganizationGroupStatus,
  };
}

export async function setOrganizationGroupTeacher(
  userId: string,
  input: { groupId: string; teacherUserId: string | null },
) {
  const group = await assertGroupAccess(userId, input.groupId, true);
  if (group.status !== "active") throw new BlossomForbiddenError("Une classe archivée ne peut plus être reassignée.");
  if (input.teacherUserId) {
    const role = await assertOrganizationMember(group.organizationId, input.teacherUserId);
    if (!["owner", "admin", "teacher"].includes(role)) {
      throw new BlossomForbiddenError("Le responsable choisi doit être un membre du personnel.");
    }
  }

  const sql = await getSql();
  const rows = await sql.query(
    "update blossom_organization_group set teacher_user_id = $2, updated_at = current_timestamp where id = $1::uuid returning id, teacher_user_id, updated_at",
    [input.groupId, input.teacherUserId],
  );
  if (!rows[0]) throw new Error("organization-group-teacher-write-failed");

  await writeAuditEvent(userId, {
    action: "organization.group.teacher_changed",
    resourceType: "organization_group",
    resourceId: input.groupId,
    metadata: { teacherUserId: input.teacherUserId },
  });

  if (input.teacherUserId) {
    await createNotification(input.teacherUserId, {
      kind: "system",
      title: "Vous êtes responsable d’une classe",
      body: group.name,
      href: "/moi",
      metadata: { groupId: input.groupId },
    });
  }

  return {
    groupId: String(rows[0].id),
    teacherUserId: rows[0].teacher_user_id ? String(rows[0].teacher_user_id) : null,
    updatedAt: new Date(String(rows[0].updated_at)).toISOString(),
  };
}

export async function addOrganizationGroupMember(
  userId: string,
  input: { groupId: string; learnerUserId: string },
) {
  const group = await assertGroupMemberManager(userId, input.groupId);
  if (group.status !== "active") throw new BlossomForbiddenError("Une classe archivée ne peut plus recevoir d'apprenants.");
  await assertOrganizationMember(group.organizationId, input.learnerUserId, "learner");
  const sql = await getSql();
  await sql.query(
    "insert into blossom_organization_group_member (group_id, user_id, added_by_user_id) values ($1::uuid, $2, $3) on conflict (group_id, user_id) do nothing",
    [input.groupId, input.learnerUserId, userId],
  );
  await sql.query(
    "update blossom_organization_group set updated_at = current_timestamp where id = $1::uuid",
    [input.groupId],
  );
  await writeAuditEvent(userId, {
    action: "organization.group.member_added",
    subjectUserId: input.learnerUserId,
    resourceType: "organization_group",
    resourceId: input.groupId,
  });
  return { groupId: input.groupId, learnerUserId: input.learnerUserId, added: true };
}

export async function removeOrganizationGroupMember(
  userId: string,
  input: { groupId: string; learnerUserId: string },
) {
  const group = await assertGroupMemberManager(userId, input.groupId);
  const sql = await getSql();
  const rows = await sql.query(
    "delete from blossom_organization_group_member where group_id = $1::uuid and user_id = $2 returning group_id, user_id",
    [input.groupId, input.learnerUserId],
  );
  if (rows[0]) {
    await sql.query(
      "update blossom_organization_group set updated_at = current_timestamp where id = $1::uuid",
      [input.groupId],
    );
    await writeAuditEvent(userId, {
      action: "organization.group.member_removed",
      subjectUserId: input.learnerUserId,
      resourceType: "organization_group",
      resourceId: input.groupId,
    });
  }
  return {
    groupId: group.id,
    learnerUserId: input.learnerUserId,
    removed: Boolean(rows[0]),
  };
}

export async function archiveOrganizationGroup(userId: string, groupId: string) {
  const group = await assertGroupAccess(userId, groupId, true);
  if (group.status === "archived") {
    return { id: group.id, status: "archived" as const };
  }
  const sql = await getSql();
  const rows = await sql.query(
    "update blossom_organization_group set status = 'archived', updated_at = current_timestamp where id = $1::uuid and status = 'active' returning id, status, updated_at",
    [groupId],
  );
  if (!rows[0]) throw new Error("organization-group-archive-conflict");
  await writeAuditEvent(userId, {
    action: "organization.group.archived",
    resourceType: "organization_group",
    resourceId: groupId,
  });
  return {
    id: String(rows[0].id),
    status: "archived" as const,
    updatedAt: new Date(String(rows[0].updated_at)).toISOString(),
  };
}
