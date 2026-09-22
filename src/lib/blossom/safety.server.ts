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
