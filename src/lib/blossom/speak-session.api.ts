import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import {
  startSpeakSession,
  endSpeakSession,
  getActiveSpeakSession,
} from "./speak-session.server";

export const startSpeakSessionOnServer = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator(
    z.object({
      roomId: z.string().trim().min(2).max(120),
      languageId: z.string().trim().min(1).max(16),
    }),
  )
  .handler(async ({ context, data }) =>
    startSpeakSession(context.userId, data.roomId, data.languageId),
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

export const getActiveSpeakSessionOnServer = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => getActiveSpeakSession(context.userId));
