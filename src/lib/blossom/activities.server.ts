import type { PronlabAttemptInput } from "./booking.server";
import { writeAuditEvent, createNotification } from "./notifications.server";
import { randomUUID } from "node:crypto";
import { getSql } from "@/lib/db";
import { normalizeMutationTime } from "./sync-causality";
import { IMMERSION, PRONLAB_SETS, setsForLanguage, TODAY_MISSION } from "./data";
import { isLearnLanguageId } from "@/lib/i18n/locales";
import { GRAMMAR_TASKS, LISTENING_TASKS, WRITING_PROMPTS, evaluateWritingStructure } from "./lab-content";
import type { JsonObject } from "./backend.server";
import { getPublishedContent } from "./content.server";
import { enforceRateLimit } from "./rate-limit.server";
import { BlossomForbiddenError, assertLearnerAccess } from "./access.server";

export type BlossomNotification = {
  id: string;
  kind: "homework" | "booking" | "event" | "tandem" | "learning" | "system" | "communication";
  title: string;
  body: string;
  href: string | null;
  metadata: JsonObject;
  readAt: string | null;
  createdAt: string;
};

export async function recordPronlabAttempt(
  userId: string,
  input: PronlabAttemptInput,
) {
  await enforceRateLimit(userId, "learning.pronlab-attempt", 60, 60);