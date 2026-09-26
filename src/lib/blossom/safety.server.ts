import { randomUUID } from "node:crypto";
import { getSql } from "@/lib/db";
import { BlossomForbiddenError, writeAuditEvent } from "./domain.server";

export async function reportTandem(
  reporterUserId: string,
  partnerUserId: string,
  reportId: string = randomUUID(),
  reason = "unspecified",
) {
  if (reporterUserId === partnerUserId) {
    throw new BlossomForbiddenError("Vous ne pouvez pas vous signaler vous-même.");
  }

  const sql = await getSql();
  const partner = await sql.query(
    "select 1 from blossom_profile where user_id = $1 limit 1",
    [partnerUserId],
  );
  if (!partner[0]) {
    throw new BlossomForbiddenError("Ce profil n'est plus disponible.");
  }

  const rows = await sql.query(
    "insert into blossom_tandem_report (id, reporter_user_id, partner_user_id, reason) values ($1::uuid, $2, $3, $4) on conflict (id) do nothing returning id, reporter_user_id, partner_user_id, reason, status, created_at, updated_at",
    [reportId, reporterUserId, partnerUserId, reason],
  );

  await sql.query(
    "update blossom_tandem_connection set status = 'blocked', updated_at = current_timestamp where (user_id = $1 and partner_user_id = $2) or (user_id = $2 and partner_user_id = $1)",
    [reporterUserId, partnerUserId],
  );

  await writeAuditEvent(reporterUserId, {
    action: "tandem.reported",
    subjectUserId: partnerUserId,
    resourceType: "tandem_report",
    resourceId: reportId,
  });

  const admins = await sql.query(
    "select user_id from blossom_platform_admin where status = 'active' and user_id <> $1",
    [reporterUserId],
  );
  for (const admin of admins) {
    await import("./domain.server").then(({ createNotification }) =>
      createNotification(String(admin.user_id), {
        kind: "system",
        title: "Nouveau signalement tandem",
        body: reason.slice(0, 140),
        href: "/moi",
        metadata: { reportId, partnerUserId },
      }),
    );
  }

  const countRows = await sql.query(
    "select count(*)::integer as count from blossom_tandem_report where reporter_user_id = $1 and partner_user_id = $2",
    [reporterUserId, partnerUserId],
  );

  return {
    id: rows[0]?.id ?? reportId,
    count: Number(countRows[0]?.count ?? 1),
    status: "open" as const,
  };
}


export async function updateAdminSafetyReport(
  userId: string,
  reportId: string,
  status: "reviewing" | "resolved" | "dismissed",
) {
  const sql = await getSql();
  const admin = await sql.query(
    "select 1 from blossom_platform_admin where user_id = $1 and status = 'active' limit 1",
    [userId],
  );
  if (!admin[0]) throw new BlossomForbiddenError("Admin access is not enabled for this account.");

  const rows = await sql.query(
    "update blossom_tandem_report set status = $2, updated_at = current_timestamp where id = $1::uuid and ((status = 'open' and $2 = 'reviewing') or (status = 'reviewing' and $2 in ('resolved','dismissed'))) returning id, partner_user_id, status",
    [reportId, status],
  );
  if (!rows[0]) throw new Error("safety-report-revision-conflict");

  await writeAuditEvent(userId, {
    action: `tandem_report.${status}`,
    resourceType: "tandem_report",
    resourceId: reportId,
  });

  return {
    id: String(rows[0].id),
    partnerUserId: String(rows[0].partner_user_id),
    status: String(rows[0].status) as "reviewing" | "resolved" | "dismissed",
  };
}

export async function getAdminSafetySummary(userId: string) {
  const sql = await getSql();
  const admin = await sql.query(
    "select 1 from blossom_platform_admin where user_id = $1 and status = 'active' limit 1",
    [userId],
  );
  if (!admin[0]) {
    throw new BlossomForbiddenError("Admin access is not enabled for this account.");
  }

  const [open, recent] = await Promise.all([
    sql.query(
      "select count(*)::integer as count from blossom_tandem_report where status in ('open','reviewing')",
    ),
    sql.query(
      "select id, reporter_user_id, partner_user_id, reason, status, created_at from blossom_tandem_report order by created_at desc limit 12",
    ),
  ]);

  return {
    openReports: Number(open[0]?.count ?? 0),
    recentReports: recent.map((row) => ({
      id: String(row.id),
      reporterUserId: String(row.reporter_user_id),
      partnerUserId: String(row.partner_user_id),
      reason: String(row.reason),
      status: String(row.status),
      createdAt: new Date(String(row.created_at)).toISOString(),
    })),
  };
}


export async function getAdminMessageReports(userId: string) {
  const sql = await getSql();
  const admin = await sql.query(
    "select 1 from blossom_platform_admin where user_id = $1 and status = 'active' limit 1",
    [userId],
  );
  if (!admin[0]) throw new BlossomForbiddenError("Admin access is not enabled for this account.");

  const rows = await sql.query(
    `select r.id, r.reporter_user_id, r.conversation_id, r.message_id, r.reason, r.status,
        r.created_at, r.updated_at, m.sender_user_id, left(m.body, 500) as message_body
     from blossom_message_report r
     left join blossom_message m on m.id = r.message_id
     order by r.created_at desc
     limit 100`,
  );
  return rows.map((row) => ({
    id: String(row.id),
    reporterUserId: String(row.reporter_user_id),
    conversationId: String(row.conversation_id),
    messageId: row.message_id ? String(row.message_id) : null,
    reason: String(row.reason),
    status: String(row.status) as "open" | "reviewing" | "resolved" | "dismissed",
    senderUserId: row.sender_user_id ? String(row.sender_user_id) : null,
    messageBody: row.message_body ? String(row.message_body) : null,
    createdAt: new Date(String(row.created_at)).toISOString(),
    updatedAt: new Date(String(row.updated_at)).toISOString(),
  }));
}

export async function updateAdminMessageReport(
  userId: string,
  reportId: string,
  status: "reviewing" | "resolved" | "dismissed",
) {
  const reports = await getAdminMessageReports(userId);
  const current = reports.find((report) => report.id === reportId);
  if (!current) throw new Error("message-report-not-found");
  if (
    (current.status === "open" && status !== "reviewing") ||
    (current.status === "reviewing" && !["resolved", "dismissed"].includes(status))
  ) {
    throw new Error("message-report-revision-conflict");
  }
  const sql = await getSql();
  const rows = await sql.query(
    "update blossom_message_report set status = $2, updated_at = current_timestamp where id = $1::uuid and status = $3 returning id, status, message_id",
    [reportId, status, current.status],
  );
  if (!rows[0]) throw new Error("message-report-revision-conflict");
  await writeAuditEvent(userId, {
    action: "communication.message_report." + status,
    resourceType: "message_report",
    resourceId: reportId,
    metadata: { messageId: rows[0].message_id ? String(rows[0].message_id) : null },
  });
  return {
    id: String(rows[0].id),
    status: String(rows[0].status) as "reviewing" | "resolved" | "dismissed",
  };
}

export type AdminSafetyCase = {
  id: string;
  type: "tandem" | "message";
  reporterUserId: string;
  subjectUserId: string | null;
  conversationId: string | null;
  messageId: string | null;
  reason: string;
  status: "open" | "reviewing" | "resolved" | "dismissed";
  body: string | null;
  createdAt: string;
  updatedAt: string;
};

export async function getAdminSafetyCases(
  userId: string,
): Promise<AdminSafetyCase[]> {
  const sql = await getSql();
  const admin = await sql.query(
    "select 1 from blossom_platform_admin where user_id = $1 and status = 'active' limit 1",
    [userId],
  );
  if (!admin[0]) throw new BlossomForbiddenError("Admin access is not enabled for this account.");

  const rows = await sql.query(
    `select id, 'tandem' as case_type, reporter_user_id, partner_user_id as subject_user_id,
        null::text as conversation_id, null::text as message_id, reason, status,
        null::text as body, created_at, updated_at
     from blossom_tandem_report
     union all
     select r.id, 'message' as case_type, r.reporter_user_id, m.sender_user_id as subject_user_id,
        r.conversation_id::text, r.message_id::text, r.reason, r.status,
        left(m.body, 500) as body, r.created_at, r.updated_at
     from blossom_message_report r
     left join blossom_message m on m.id = r.message_id
     order by created_at desc
     limit 150`,
  );

  return rows.map((row) => ({
    id: String(row.id),
    type: String(row.case_type) as AdminSafetyCase["type"],
    reporterUserId: String(row.reporter_user_id),
    subjectUserId: row.subject_user_id ? String(row.subject_user_id) : null,
    conversationId: row.conversation_id ? String(row.conversation_id) : null,
    messageId: row.message_id ? String(row.message_id) : null,
    reason: String(row.reason),
    status: String(row.status) as AdminSafetyCase["status"],
    body: row.body ? String(row.body) : null,
    createdAt: new Date(String(row.created_at)).toISOString(),
    updatedAt: new Date(String(row.updated_at)).toISOString(),
  }));
}

export async function updateAdminSafetyCase(
  userId: string,
  input: {
    caseId: string;
    type: "tandem" | "message";
    status: "reviewing" | "resolved" | "dismissed";
  },
) {
  const sql = await getSql();
  const admin = await sql.query(
    "select 1 from blossom_platform_admin where user_id = $1 and status = 'active' limit 1",
    [userId],
  );
  if (!admin[0]) throw new BlossomForbiddenError("Admin access is not enabled for this account.");

  const table = input.type === "tandem" ? "blossom_tandem_report" : "blossom_message_report";
  const rows = await sql.query(
    `update ${table}
     set status = $2, updated_at = current_timestamp
     where id = $1::uuid
       and (
         (status = 'open' and $2 = 'reviewing')
         or (status = 'reviewing' and $2 in ('resolved','dismissed'))
       )
     returning id, status, updated_at`,
    [input.caseId, input.status],
  );
  if (!rows[0]) throw new Error("safety-case-revision-conflict");

  await writeAuditEvent(userId, {
    action: `safety.case.${input.type}.${input.status}`,
    resourceType: input.type === "tandem" ? "tandem_report" : "message_report",
    resourceId: input.caseId,
  });

  return {
    id: String(rows[0].id),
    type: input.type,
    status: String(rows[0].status) as "reviewing" | "resolved" | "dismissed",
    updatedAt: new Date(String(rows[0].updated_at)).toISOString(),
  };
}
