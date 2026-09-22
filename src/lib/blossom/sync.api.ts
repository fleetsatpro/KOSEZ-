import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import { syncBlossomBatch } from "./sync.server";
import type { SyncMutation, SyncResult } from "./sync-types";

const envelope = z.string().trim().min(2).max(800000);
const mutationSchema = z.object({
  mutationId: z.string().uuid(),
  deviceId: z.string().trim().min(10).max(200),
  operation: z.enum([
    "profile.upsert",
    "activity.append",
    "mission.save",
    "pronlab.attempt",
    "vocabulary.upsert",
    "event.register",
    "challenge.complete",
    "tandem.status",
    "learning.submission",
    "booking.request",
    "waitlist.request",
  ]),
  entityId: z.string().trim().min(1).max(200),
  expectedRevision: z.number().int().nonnegative().optional(),
  payload: z.record(z.string(), z.unknown()),
  createdAt: z.string().datetime(),
});

function parseMutations(raw: string): SyncMutation[] {
  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed) || parsed.length > 50) {
    throw new Error("mutations-invalid-batch");
  }
  const mutations = parsed.map((value) => mutationSchema.parse(value)) as SyncMutation[];
  const ids = new Set<string>();
  for (const mutation of mutations) {
    if (ids.has(mutation.mutationId)) throw new Error("duplicate-mutation-id");
    ids.add(mutation.mutationId);
  }
  return mutations;
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
