import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import { getAdminSafetySummary, updateAdminSafetyReport, getAdminMessageReports, updateAdminMessageReport, getAdminSafetyCases, updateAdminSafetyCase } from "./safety.server";
import {
  ensureBootstrapAdmin,
  listPlatformUsers,
  setUserPlatformRole,
} from "./admin-roles.server";
import { getSql } from "@/lib/db";
import {
  addTeacherNote,
  completeChallenge,
  getAdminWorkspace,
  getBlossomAccessContext,
  getConnectPeers,
  getGuardianWorkspace,
  getOrganizationWorkspace,
  getTeacherWorkspace,
  getTandemCandidates,
  getTandemSession,
  recordPronlabAttempt,
  registerEvent,
  saveHomework,
  saveVocabulary,
  setTandemStatus,
  getNotifications,
  markNotificationRead,
  getAdminBookingQueue,
  updateAdminBooking,
  getTeacherLearnerDetail,
  getGuardianLearnerDetail,
  startTandemSession,
  logTandemPrompt,
  endTandemSession,
} from "./domain.server";
import type { JsonObject } from "./backend.server";
import { getAdminEventAttendance, recordEventAttendance } from "./event-attendance.server";
import { getSavedExploreItems, toggleSavedExploreItem } from "./explore.server";
import { getOrganizationGroups, createOrganizationGroup, setOrganizationGroupTeacher, addOrganizationGroupMember, removeOrganizationGroupMember, archiveOrganizationGroup } from "./organization-groups.server";
import {
  getOrCreateConversation,
  getConversationMessages,
  sendMessage,
  markConversationRead,
  reportMessage,
  getSupportInbox,
  listConversations,
} from "./messaging.server";
import { getEvidenceTimeline } from "./evidence.server";
import { getLearningFeedbackBundle, saveLearningFeedback, getLearnerFeedback } from "./learning-feedback.server";
import {
  getNotificationPreferences,
  setNotificationPreference,
  type NotificationPreferenceKind,
} from "./notification-preferences.server";


const metadataJson = z.string().trim().max(20000).optional();

async function resolveUserEmail(userId: string): Promise<string | null> {
  const sql = await getSql();
  try {
    const rows = await sql.query(`select email from "user" where id = $1 limit 1`, [userId]);
    const email = rows[0]?.email;
    return typeof email === "string" ? email : null;
  } catch {
    return null;
  }
}

export const getAdminWorkspaceOnServer = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => getAdminWorkspace(context.userId));

export const updateAdminSafetyReportOnServer = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator(
    z.object({
      reportId: z.string().uuid(),
      status: z.enum(["reviewing", "resolved", "dismissed"]),
    }),
  )
  .handler(async ({ context, data }) =>
    updateAdminSafetyReport(context.userId, data.reportId, data.status),
  );

export const getAdminSafetyCasesOnServer = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => getAdminSafetyCases(context.userId));

export const updateAdminSafetyCaseOnServer = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator(
    z.object({
      caseId: z.string().uuid(),
      type: z.enum(["tandem", "message"]),
      status: z.enum(["reviewing", "resolved", "dismissed"]),
    }),
  )
  .handler(async ({ context, data }) =>
    updateAdminSafetyCase(context.userId, data),
  );

export const getAdminMessageReportsOnServer = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => getAdminMessageReports(context.userId));

export const updateAdminMessageReportOnServer = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator(
    z.object({
      reportId: z.string().uuid(),
      status: z.enum(["reviewing", "resolved", "dismissed"]),
    }),
  )
  .handler(async ({ context, data }) =>
    updateAdminMessageReport(context.userId, data.reportId, data.status),
  );

export const getAdminSafetySummaryOnServer = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => getAdminSafetySummary(context.userId));

export const getBlossomWorkspaceAccess = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const email = await resolveUserEmail(context.userId);
    await ensureBootstrapAdmin(context.userId, email);
    const access = await getBlossomAccessContext(context.userId);

    // Merge role_grant flags (table may be empty on older DBs before migrate)
    try {
      const sql = await getSql();
      const grants = await sql.query(
        `select role from blossom_role_grant
         where user_id = $1 and status = 'active'`,
        [context.userId],
      );
      for (const g of grants) {
        const role = String(g.role);
        if (role === "admin") access.isAdmin = true;
        if (role === "teacher") access.isTeacher = true;
        if (role === "org_staff") access.isOrgStaff = true;
      }
    } catch {
      /* role_grant migration not applied yet */
    }
    return access;
  });

export const listPlatformUsersOnServer = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .inputValidator(z.object({ limit: z.number().int().min(1).max(200).optional() }).optional())
  .handler(async ({ context, data }) => listPlatformUsers(context.userId, data?.limit ?? 80));

export const setUserPlatformRoleOnServer = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator(
    z.object({
      targetUserId: z.string().trim().min(1).max(200),
      role: z.enum(["admin", "teacher", "org_staff"]),
      active: z.boolean(),
    }),
  )
  .handler(async ({ context, data }) =>
    setUserPlatformRole(context.userId, data.targetUserId, data.role, data.active),
  );

export const getConnectPeersOnServer = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => getConnectPeers(context.userId));

export const getTandemCandidatesOnServer = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => getTandemCandidates(context.userId));

export const getTandemSessionOnServer = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .inputValidator(z.object({ partnerUserId: z.string().trim().min(1).max(200) }))
  .handler(async ({ context, data }) =>
    getTandemSession(context.userId, data.partnerUserId),
  );

export const getAdminEventAttendanceOnServer = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => getAdminEventAttendance(context.userId));

export const recordEventAttendanceOnServer = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator(
    z.object({
      eventId: z.string().trim().min(1).max(200),
      learnerUserId: z.string().trim().min(1).max(200),
      note: z.string().trim().max(500).optional(),
    }),
  )
  .handler(async ({ context, data }) =>
    recordEventAttendance(context.userId, data),
  );

export const getTeacherWorkspaceOnServer = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => getTeacherWorkspace(context.userId));

export const getGuardianWorkspaceOnServer = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => getGuardianWorkspace(context.userId));

export const getSavedExploreItemsOnServer = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => getSavedExploreItems(context.userId));

export const toggleSavedExploreItemOnServer = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator(
    z.object({
      itemType: z.enum(["event", "catalogue"]),
      itemId: z.string().trim().min(1).max(200),
    }),
  )
  .handler(async ({ context, data }) => toggleSavedExploreItem(context.userId, data));

export const getOrganizationGroupsOnServer = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .inputValidator(z.object({ organizationId: z.string().uuid() }))
  .handler(async ({ context, data }) =>
    getOrganizationGroups(context.userId, data.organizationId),
  );

export const createOrganizationGroupOnServer = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator(
    z.object({
      organizationId: z.string().uuid(),
      name: z.string().trim().min(2).max(100),
      kind: z.enum(["class", "cohort"]),
      teacherUserId: z.string().trim().min(1).max(200).nullable().optional(),
    }),
  )
  .handler(async ({ context, data }) =>
    createOrganizationGroup(context.userId, data),
  );

export const setOrganizationGroupTeacherOnServer = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator(
    z.object({
      groupId: z.string().uuid(),
      teacherUserId: z.string().trim().min(1).max(200).nullable(),
    }),
  )
  .handler(async ({ context, data }) =>
    setOrganizationGroupTeacher(context.userId, data),
  );

export const addOrganizationGroupMemberOnServer = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator(
    z.object({
      groupId: z.string().uuid(),
      learnerUserId: z.string().trim().min(1).max(200),
    }),
  )
  .handler(async ({ context, data }) =>
    addOrganizationGroupMember(context.userId, data),
  );

export const removeOrganizationGroupMemberOnServer = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator(
    z.object({
      groupId: z.string().uuid(),
      learnerUserId: z.string().trim().min(1).max(200),
    }),
  )
  .handler(async ({ context, data }) =>
    removeOrganizationGroupMember(context.userId, data),
  );

export const archiveOrganizationGroupOnServer = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator(z.object({ groupId: z.string().uuid() }))
  .handler(async ({ context, data }) =>
    archiveOrganizationGroup(context.userId, data.groupId),
  );

export const getOrganizationWorkspaceOnServer = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => getOrganizationWorkspace(context.userId));

export const getNotificationPreferencesOnServer = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => getNotificationPreferences(context.userId));

export const setNotificationPreferenceOnServer = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator(
    z.object({
      kind: z.enum([
        "homework",
        "booking",
        "event",
        "tandem",
        "learning",
        "communication",
      ]),
      enabled: z.boolean(),
    }),
  )
  .handler(async ({ context, data }) =>
    setNotificationPreference(
      context.userId,
      data.kind as NotificationPreferenceKind,
      data.enabled,
    ),
  );

export const getNotificationsOnServer = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .inputValidator(z.object({ limit: z.number().int().min(1).max(100).optional() }).optional())
  .handler(async ({ context, data }) => getNotifications(context.userId, data?.limit ?? 30));

export const markNotificationReadOnServer = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator(z.object({ notificationId: z.string().uuid() }))
  .handler(async ({ context, data }) => markNotificationRead(context.userId, data.notificationId));

export const getAdminBookingQueueOnServer = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => getAdminBookingQueue(context.userId));

export const updateAdminBookingOnServer = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator(
    z.object({
      bookingId: z.string().uuid(),
      status: z.enum(["requested", "confirmed", "cancelled"]).optional(),
      paymentStatus: z.enum(["unpaid", "paid", "refunded"]).optional(),
      providerReference: z.string().trim().max(200).nullable().optional(),
    }),
  )
  .handler(async ({ context, data }) => updateAdminBooking(context.userId, data));

export const getTeacherLearnerDetailOnServer = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .inputValidator(z.object({ learnerUserId: z.string().trim().min(1).max(200) }))
  .handler(async ({ context, data }) =>
    getTeacherLearnerDetail(context.userId, data.learnerUserId),
  );

export const getGuardianLearnerDetailOnServer = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .inputValidator(z.object({ learnerUserId: z.string().trim().min(1).max(200) }))
  .handler(async ({ context, data }) =>
    getGuardianLearnerDetail(context.userId, data.learnerUserId),
  );

export const startTandemSessionOnServer = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator(z.object({ partnerUserId: z.string().trim().min(1).max(200) }))
  .handler(async ({ context, data }) =>
    startTandemSession(context.userId, data.partnerUserId),
  );

export const logTandemPromptOnServer = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator(
    z.object({
      sessionId: z.string().uuid(),
      language: z.string().trim().min(1).max(80),
      prompt: z.string().trim().min(1).max(500),
    }),
  )
  .handler(async ({ context, data }) => logTandemPrompt(context.userId, data));

export const endTandemSessionOnServer = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator(
    z.object({
      sessionId: z.string().uuid(),
      status: z.enum(["completed", "cancelled"]),
    }),
  )
  .handler(async ({ context, data }) =>
    endTandemSession(context.userId, data.sessionId, data.status),
  );

export const listConversationsOnServer = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => listConversations(context.userId));

export const getOrCreateConversationOnServer = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator(
    z.object({
      kind: z.enum(["tandem", "teacher", "support"]),
      partnerUserId: z.string().trim().min(1).max(200).optional(),
    }),
  )
  .handler(async ({ context, data }) =>
    getOrCreateConversation(context.userId, data),
  );

export const getConversationMessagesOnServer = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .inputValidator(
    z.object({
      conversationId: z.string().uuid(),
      limit: z.number().int().min(1).max(100).optional(),
    }),
  )
  .handler(async ({ context, data }) =>
    getConversationMessages(context.userId, data.conversationId, data.limit ?? 60),
  );

export const sendConversationMessageOnServer = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator(
    z.object({
      conversationId: z.string().uuid(),
      body: z.string().trim().min(1).max(4000),
      clientMessageId: z.string().uuid().optional(),
    }),
  )
  .handler(async ({ context, data }) => {
    return sendMessage(context.userId, data);
  });

export const markConversationReadOnServer = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator(z.object({ conversationId: z.string().uuid() }))
  .handler(async ({ context, data }) =>
    markConversationRead(context.userId, data.conversationId),
  );

export const reportConversationMessageOnServer = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator(
    z.object({
      conversationId: z.string().uuid(),
      messageId: z.string().uuid(),
      reason: z.string().trim().min(1).max(500),
    }),
  )
  .handler(async ({ context, data }) => reportMessage(context.userId, data));

export const getSupportInboxOnServer = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => getSupportInbox(context.userId));

export const getLearningFeedbackBundleOnServer = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .inputValidator(z.object({ learnerUserId: z.string().trim().min(1).max(200), limit: z.number().int().min(1).max(50).optional() }))
  .handler(async ({ context, data }) =>
    getLearningFeedbackBundle(context.userId, data.learnerUserId, data.limit ?? 24),
  );

export const saveLearningFeedbackOnServer = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator(
    z.object({
      submissionId: z.string().uuid(),
      learnerUserId: z.string().trim().min(1).max(200),
      body: z.string().trim().min(1).max(4000),
    }),
  )
  .handler(async ({ context, data }) => saveLearningFeedback(context.userId, data));

export const getLearnerFeedbackOnServer = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .inputValidator(z.object({ learnerUserId: z.string().trim().min(1).max(200).optional(), limit: z.number().int().min(1).max(50).optional() }).optional())
  .handler(async ({ context, data }) =>
    getLearnerFeedback(context.userId, data?.learnerUserId ?? context.userId, data?.limit ?? 24),
  );

export const getEvidenceTimelineOnServer = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .inputValidator(
    z.object({
      learnerUserId: z.string().trim().min(1).max(200).optional(),
      limit: z.number().int().min(1).max(120).optional(),
    }).optional(),
  )
  .handler(async ({ context, data }) =>
    getEvidenceTimeline(context.userId, data?.learnerUserId ?? context.userId, data?.limit ?? 60),
  );

function parseJsonObject(value: string | undefined): JsonObject {
  if (!value) return {};
  try {
    const parsed: unknown = JSON.parse(value);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return parsed as JsonObject;
  } catch {
    throw new Error("invalid-json-object");
  }
}

export const recordPronlabAttemptOnServer = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator(
    z.object({
      itemId: z.string().trim().min(1).max(120),
      score: z.number().int().min(0).max(100),
      seconds: z.number().finite().int().nonnegative().max(3600),
      tip: z.string().trim().max(500).nullable().optional(),
      metadataJson,
      idempotencyKey: z.string().uuid().nullable().optional(),
    }),
  )
  .handler(async ({ context, data }) => {
    await recordPronlabAttempt(context.userId, {
      ...data,
      metadata: parseJsonObject(data.metadataJson),
    });
    return { ok: true as const };
  });

export const saveVocabularyOnServer = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator(
    z.object({
      word: z.string().trim().min(1).max(120),
      gloss: z.string().trim().min(1).max(240),
      metadataJson,
    }),
  )
  .handler(async ({ context, data }) => {
    await saveVocabulary(context.userId, {
      ...data,
      metadata: parseJsonObject(data.metadataJson),
    });
    return { ok: true as const };
  });

export const setTandemStatusOnServer = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator(
    z.object({
      partnerUserId: z.string().trim().min(1).max(200),
      status: z.enum(["suggested", "pending", "accepted", "blocked", "paused"]),
      metadataJson,
    }),
  )
  .handler(async ({ context, data }) => {
    await setTandemStatus(context.userId, {
      ...data,
      metadata: parseJsonObject(data.metadataJson),
    });
    return { ok: true as const };
  });

export const registerBlossomEvent = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator(
    z.object({
      eventId: z.string().trim().min(1).max(120),
      status: z.enum(["joined", "waitlist", "cancelled"]),
    }),
  )
  .handler(async ({ context, data }) => {
    await registerEvent(context.userId, data.eventId, data.status);
    return { ok: true as const };
  });

export const completeBlossomChallenge = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator(z.object({ challengeId: z.string().trim().min(1).max(120) }))
  .handler(async ({ context, data }) => {
    await completeChallenge(context.userId, data.challengeId);
    return { ok: true as const };
  });

export const saveBlossomHomework = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator(
    z.object({
      id: z.string().uuid().optional(),
      learnerUserId: z.string().trim().min(1).max(200),
      title: z.string().trim().min(1).max(200),
      body: z.string().trim().min(1).max(5000),
      status: z.enum(["draft", "sent", "done"]),
    }),
  )
  .handler(async ({ context, data }) => {
    await saveHomework(context.userId, data);
    return { ok: true as const };
  });

export const saveBlossomTeacherNote = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator(
    z.object({
      learnerUserId: z.string().trim().min(1).max(200),
      tags: z.array(z.string().trim().min(1).max(60)).max(20),
      note: z.string().trim().min(1).max(5000),
    }),
  )
  .handler(async ({ context, data }) => {
    await addTeacherNote(context.userId, data);
    return { ok: true as const };
  });
