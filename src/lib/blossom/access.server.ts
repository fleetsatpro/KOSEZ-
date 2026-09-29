import { getSql } from "@/lib/db";

import { randomUUID } from "node:crypto";
import { getSql } from "@/lib/db";
import { normalizeMutationTime } from "./sync-causality";
import { IMMERSION, PRONLAB_SETS, setsForLanguage, TODAY_MISSION } from "./data";
import { LEARN_LANGUAGES, isLearnLanguageId } from "@/lib/i18n/locales";
import { GRAMMAR_TASKS, LISTENING_TASKS, WRITING_PROMPTS, evaluateWritingStructure } from "./lab-content";
import { fullMissionBank } from "./mission-today";
import type { JsonObject } from "./backend.server";

import { getPublishedContent } from "./content.server";
import { enforceRateLimit } from "./rate-limit.server";
import { shouldDeliverNotification } from "./notification-preferences.server";

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

async function assertAdmin(userId: string) {
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
