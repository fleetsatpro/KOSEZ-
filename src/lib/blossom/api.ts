import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import {
  appendBlossomActivity,
  readBlossomState,
  saveBlossomMissionSession,
  upsertBlossomProfile,
} from "./backend.server";

const jsonObject = z.record(z.string(), z.unknown());

export const getBlossomBackendState = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => readBlossomState(context.userId));

export const saveBlossomProfile = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator(
    z.object({
      displayName: z.string().trim().max(120).nullable().optional(),
      targetLanguage: z.string().trim().min(2).max(16),
      level: z.string().trim().max(16).nullable().optional(),
      timezone: z.string().trim().max(80).nullable().optional(),
      preferences: jsonObject.optional(),
    }),
  )
  .handler(async ({ context, data }) => upsertBlossomProfile(context.userId, data));

export const recordBlossomActivity = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator(
    z.object({
      eventType: z.string().trim().min(1).max(100),
      sourceId: z.string().trim().max(200).nullable().optional(),
      payload: jsonObject.optional(),
      idempotencyKey: z.string().uuid().nullable().optional(),
      occurredAt: z.string().datetime().optional(),
    }),
  )
  .handler(async ({ context, data }) => appendBlossomActivity(context.userId, data));

export const persistBlossomMissionSession = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator(
    z.object({
      missionId: z.string().trim().min(1).max(120),
      session: z.unknown(),
      expectedRevision: z.number().int().nonnegative(),
    }),
  )
  .handler(async ({ context, data }) =>
    saveBlossomMissionSession(
      context.userId,
      data.missionId,
      data.session,
      data.expectedRevision,
    ),
  );
