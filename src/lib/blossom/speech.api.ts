import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";

const inputSchema = z.object({
  audioBase64: z.string().min(8).max(2_000_000),
  mimeType: z.string().trim().max(80).optional(),
  seconds: z.number().min(0).max(600).optional(),
  fileName: z.string().trim().max(80).optional(),
});

export const transcribeSpeakTurn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator(inputSchema)
  .handler(async ({ data }) => {
    const { transcribeSpeechAudio } = await import("./speech-server.server");
    return transcribeSpeechAudio(data);
  });
