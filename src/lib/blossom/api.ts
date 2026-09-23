import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import {
  appendBlossomActivity,
  readBlossomState,
  saveBlossomMissionSession,
  type JsonObject,
  type JsonValue,
  upsertBlossomProfile,
} from "./backend.server";
import { assertCurriculumEvidence } from "./sync.server";

const jsonObject = z.string().trim().max(20000).optional();

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

function parseJsonValue(value: string): JsonValue {
  try {
    return JSON.parse(value) as JsonValue;
  } catch {
    throw new Error("invalid-json");
  }
}

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
      preferencesJson: jsonObject,
    }),
  )
  .handler(async ({ context, data }) =>
    upsertBlossomProfile(context.userId, {
      ...data,
      preferences: parseJsonObject(data.preferencesJson),
    }),
  );

export const recordBlossomActivity = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator(
    z.object({
      eventType: z.string().trim().min(1).max(100),
      sourceId: z.string().trim().max(200).nullable().optional(),
      payloadJson: jsonObject,
      idempotencyKey: z.string().uuid().nullable().optional(),
      occurredAt: z.string().datetime().optional(),
    }),
  )
  .handler(async ({ context, data }) => {
    const payload = parseJsonObject(data.payloadJson);
    if (data.eventType === "CURRICULUM_EVIDENCE_RECORDED") {
      await assertCurriculumEvidence(
        context.userId,
        data.sourceId ?? "",
        payload.metadata && typeof payload.metadata === "object" && !Array.isArray(payload.metadata)
          ? payload.metadata
          : {},
      );
    }
    await appendBlossomActivity(context.userId, {
      ...data,
      payload,
    });
    return { ok: true as const };
  });

export const persistBlossomMissionSession = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator(
    z.object({
      missionId: z.string().trim().min(1).max(120),
      sessionJson: z.string().trim().min(2).max(200000),
      expectedRevision: z.number().int().nonnegative(),
    }),
  )
  .handler(async ({ context, data }) =>
    saveBlossomMissionSession(
      context.userId,
      data.missionId,
      parseJsonValue(data.sessionJson),
      data.expectedRevision,
    ),
  );
