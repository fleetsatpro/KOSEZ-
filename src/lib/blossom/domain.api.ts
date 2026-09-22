import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import {
  addTeacherNote,
  completeChallenge,
  recordPronlabAttempt,
  registerEvent,
  saveHomework,
  saveVocabulary,
  setTandemStatus,
} from "./domain.server";

export const recordPronlabAttemptOnServer = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator(
    z.object({
      itemId: z.string().trim().min(1).max(120),
      score: z.number().int().min(0).max(100),
      seconds: z.number().finite().int().nonnegative().max(3600),
      tip: z.string().trim().max(500).nullable().optional(),
      metadata: z.record(z.string(), z.unknown()).optional(),
      idempotencyKey: z.string().uuid().nullable().optional(),
    }),
  )
  .handler(async ({ context, data }) => recordPronlabAttempt(context.userId, data));

export const saveVocabularyOnServer = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator(
    z.object({
      word: z.string().trim().min(1).max(120),
      gloss: z.string().trim().min(1).max(240),
      metadata: z.record(z.string(), z.unknown()).optional(),
    }),
  )
  .handler(async ({ context, data }) => saveVocabulary(context.userId, data));

export const setTandemStatusOnServer = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator(
    z.object({
      partnerUserId: z.string().trim().min(1).max(200),
      status: z.enum(["suggested", "pending", "accepted", "blocked", "paused"]),
      metadata: z.record(z.string(), z.unknown()).optional(),
    }),
  )
  .handler(async ({ context, data }) => setTandemStatus(context.userId, data));

export const registerBlossomEvent = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator(
    z.object({
      eventId: z.string().trim().min(1).max(120),
      status: z.enum(["joined", "waitlist", "cancelled"]),
    }),
  )
  .handler(async ({ context, data }) =>
    registerEvent(context.userId, data.eventId, data.status),
  );

export const completeBlossomChallenge = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator(z.object({ challengeId: z.string().trim().min(1).max(120) }))
  .handler(async ({ context, data }) =>
    completeChallenge(context.userId, data.challengeId),
  );

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
  .handler(async ({ context, data }) => saveHomework(context.userId, data));

export const saveBlossomTeacherNote = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator(
    z.object({
      learnerUserId: z.string().trim().min(1).max(200),
      tags: z.array(z.string().trim().min(1).max(60)).max(20),
      note: z.string().trim().min(1).max(5000),
    }),
  )
  .handler(async ({ context, data }) => addTeacherNote(context.userId, data));
