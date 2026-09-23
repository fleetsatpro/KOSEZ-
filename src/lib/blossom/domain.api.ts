import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import { getAdminSafetySummary, updateAdminSafetyReport } from "./safety.server";
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
  startSpeakSession,
  endSpeakSession,
} from "./domain.server";
import type { JsonObject } from "./backend.server";

const metadataJson = z.string().trim().max(20000).optional();

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

export const getAdminSafetySummaryOnServer = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => getAdminSafetySummary(context.userId));

export const getBlossomWorkspaceAccess = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => getBlossomAccessContext(context.userId));

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

export const getTeacherWorkspaceOnServer = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => getTeacherWorkspace(context.userId));

export const getGuardianWorkspaceOnServer = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => getGuardianWorkspace(context.userId));

export const getOrganizationWorkspaceOnServer = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => getOrganizationWorkspace(context.userId));

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


export const startSpeakSessionOnServer = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator(
    z.object({
      roomId: z.string().trim().min(1).max(200),
    }),
  )
  .handler(async ({ context, data }) =>
    startSpeakSession(context.userId, data.roomId),
  );

export const endSpeakSessionOnServer = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator(
    z.object({
      sessionId: z.string().uuid(),
      status: z.enum(["completed", "cancelled"]),
    }),
  )
  .handler(async ({ context, data }) =>
    endSpeakSession(context.userId, data.sessionId, data.status),
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
