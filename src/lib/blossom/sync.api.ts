import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import { syncBlossomBatch } from "./sync.server";
import type { SyncMutation, SyncResult } from "./sync-types";

const envelope = z.string().trim().min(2).max(800000);

function parseMutations(raw: string): SyncMutation[] {
  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed)) throw new Error("mutations-must-be-array");
  return parsed.slice(0, 50) as SyncMutation[];
}

export const syncBlossom = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator(
    z.object({
      deviceId: z.string().trim().min(10).max(200),
      mutationsJson: envelope,
    }),
  )
  .handler(async ({ context, data }): Promise<{ results: SyncResult[] }> => ({
    results: await syncBlossomBatch(
      context.userId,
      data.deviceId,
      parseMutations(data.mutationsJson),
    ),
  }));
