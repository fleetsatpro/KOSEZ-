import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";

const inputSchema = z.object({
  topic: z.string().trim().min(1).max(120),
  level: z.string().trim().max(16).optional(),
  firstName: z.string().trim().max(80).optional(),
  friction: z.string().trim().max(160).nullable().optional(),
  interests: z.array(z.string().trim().max(80)).max(8).optional(),
  archetype: z.string().trim().max(40).optional(),
  entropy: z.string().trim().max(120).optional(),
});

export const generateSpeakRoom = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator(inputSchema)
  .handler(async ({ data, context }) => {
    const { composeSpeakRoom } = await import("./speak-server.server");
    return composeSpeakRoom(data, context.userId);
  });
