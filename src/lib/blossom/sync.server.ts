import { getSql } from "@/lib/db";
import {
  appendBlossomActivity,
  saveBlossomMissionSession,
} from "./backend.server";
import {
  completeChallenge,
  recordPronlabAttempt,
  registerEvent,
  saveVocabulary,
  setTandemStatus,
} from "./domain.server";
import type { SyncMutation, SyncResult } from "./sync-types";

export type SyncServerMutation = SyncMutation & {
  payload: SyncMutation["payload"];
};

const SYNC_TIMEOUT_MS = 120_000;

async function claimMutation(
  userId: string,
  mutation: SyncMutation,
): Promise<"claimed" | "duplicate" | "busy"> {
  const sql = await getSql();
  const inserted = await sql.query(
    "insert into blossom_sync_mutation (mutation_id, user_id, device_id, operation, entity_id, payload, expected_revision, status, created_at, updated_at) values ($1::uuid, $2, $3, $4, $5, $6::jsonb, $7, 'pending', coalesce($8::timestamptz, current_timestamp), current_timestamp) on conflict (mutation_id) do nothing returning mutation_id",
    [
      mutation.mutationId,
      userId,
      mutation.deviceId,
      mutation.operation,
      mutation.entityId,
      JSON.stringify(mutation.payload),
      mutation.expectedRevision ?? null,
      mutation.createdAt,
    ],
  );
  if (inserted[0]) return "claimed";

  const rows = await sql.query(
    "select status, updated_at from blossom_sync_mutation where mutation_id = $1::uuid and user_id = $2",
    [mutation.mutationId, userId],
  );
  if (!rows[0]) return "busy";

  const status = String(rows[0].status);
  if (status === "applied" || status === "conflict" || status === "rejected") return "duplicate";

  const claimed = await sql.query(
    "update blossom_sync_mutation set status = 'processing', updated_at = current_timestamp where mutation_id = $1::uuid and user_id = $2 and (status = 'pending' or (status = 'processing' and updated_at < current_timestamp - interval '2 minutes')) returning mutation_id",
    [mutation.mutationId, userId],
  );
  return claimed[0] ? "claimed" : "busy";
}

function stringValue(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function intValue(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? Math.round(value) : fallback;
}

function objectValue(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

async function storeResult(
  userId: string,
  mutationId: string,
  status: "applied" | "conflict" | "rejected",
  result: Record<string, unknown>,
  errorCode?: string,
) {
  const sql = await getSql();
  await sql.query(
    "update blossom_sync_mutation set status = $3, result = $4::jsonb, error_code = $5, updated_at = current_timestamp, applied_at = case when $3 = 'applied' then current_timestamp else applied_at end where mutation_id = $1::uuid and user_id = $2",
    [mutationId, userId, status, JSON.stringify(result), errorCode ?? null],
  );
}

async function applyMutation(
  userId: string,
  mutation: SyncMutation,
): Promise<SyncResult> {
  switch (mutation.operation) {
    case "activity.append": {
      const payload = objectValue(mutation.payload);
      await appendBlossomActivity(userId, {
        eventType: stringValue(payload.eventType),
        sourceId: typeof payload.sourceId === "string" ? payload.sourceId : null,
        payload: objectValue(payload.payload),
        idempotencyKey: mutation.mutationId,
        occurredAt: typeof payload.occurredAt === "string" ? payload.occurredAt : undefined,
      });
      return { mutationId: mutation.mutationId, status: "applied" };
    }
    case "mission.save": {
      const payload = objectValue(mutation.payload);
      const session = payload.session;
      const expectedRevision = mutation.expectedRevision ?? 0;
      const result = await saveBlossomMissionSession(
        userId,
        mutation.entityId,
        session,
        expectedRevision,
        mutation.mutationId,
      );
      if (!result.ok) {
        const sql = await getSql();
        await sql.query(
          "insert into blossom_sync_conflict (id, user_id, mutation_id, operation, entity_id, local_payload, local_revision, server_revision, server_state) values ($1::uuid, $2, $3::uuid, $4, $5, $6::jsonb, $7, $8, $9::jsonb)",
          [
            mutation.mutationId,
            userId,
            mutation.mutationId,
            mutation.operation,
            mutation.entityId,
            JSON.stringify(mutation.payload),
            expectedRevision,
            result.current?.revision ?? null,
            JSON.stringify(result.current?.session ?? {}),
          ],
        );
        return {
          mutationId: mutation.mutationId,
          status: "conflict",
          currentRevision: result.current?.revision ?? 0,
          currentSessionJson: JSON.stringify(result.current?.session ?? null),
        };
      }
      return {
        mutationId: mutation.mutationId,
        status: "applied",
        revision: result.revision,
      };
    }
    case "pronlab.attempt": {
      const payload = objectValue(mutation.payload);
      await recordPronlabAttempt(userId, {
        itemId: stringValue(payload.itemId),
        score: intValue(payload.score),
        seconds: intValue(payload.seconds),
        tip: typeof payload.tip === "string" ? payload.tip : null,
        metadata: objectValue(payload.metadata),
        idempotencyKey: mutation.mutationId,
      });
      return { mutationId: mutation.mutationId, status: "applied" };
    }
    case "vocabulary.upsert": {
      const payload = objectValue(mutation.payload);
      await saveVocabulary(userId, {
        word: stringValue(payload.word),
        gloss: stringValue(payload.gloss),
        metadata: objectValue(payload.metadata),
      });
      return { mutationId: mutation.mutationId, status: "applied" };
    }
    case "event.register": {
      const payload = objectValue(mutation.payload);
      await registerEvent(userId, mutation.entityId, stringValue(payload.status) as "joined" | "waitlist" | "cancelled");
      return { mutationId: mutation.mutationId, status: "applied" };
    }
    case "challenge.complete":
      await completeChallenge(userId, mutation.entityId);
      return { mutationId: mutation.mutationId, status: "applied" };
    case "tandem.status": {
      const payload = objectValue(mutation.payload);
      await setTandemStatus(userId, {
        partnerUserId: mutation.entityId,
        status: stringValue(payload.status) as "suggested" | "pending" | "accepted" | "blocked" | "paused",
        metadata: objectValue(payload.metadata),
      });
      return { mutationId: mutation.mutationId, status: "applied" };
    }
    case "profile.upsert":
      return { mutationId: mutation.mutationId, status: "rejected", errorCode: "profile-sync-not-wired" };
  }
}

export async function syncBlossomBatch(
  userId: string,
  deviceId: string,
  mutations: SyncMutation[],
): Promise<SyncResult[]> {
  const sql = await getSql();
  await sql.query(
    "insert into blossom_sync_device (user_id, device_id, user_agent, last_seen_at) values ($1, $2, $3, current_timestamp) on conflict (user_id, device_id) do update set last_seen_at = current_timestamp, user_agent = excluded.user_agent",
    [userId, deviceId, null],
  );

  const results: SyncResult[] = [];
  for (const mutation of mutations.slice(0, 50)) {
    if (mutation.deviceId !== deviceId) {
      results.push({ mutationId: mutation.mutationId, status: "rejected", errorCode: "device-mismatch" });
      continue;
    }

    const claimed = await claimMutation(userId, mutation);
    if (claimed === "busy") {
      results.push({ mutationId: mutation.mutationId, status: "busy" });
      continue;
    }

    if (claimed === "duplicate") {
      const rows = await sql.query(
        "select status, result from blossom_sync_mutation where mutation_id = $1::uuid and user_id = $2",
        [mutation.mutationId, userId],
      );
      const status = String(rows[0]?.status ?? "processing");
      const result = objectValue(rows[0]?.result);
      if (status === "applied") {
        results.push({
          mutationId: mutation.mutationId,
          status: "duplicate",
          revision: typeof result.revision === "number" ? result.revision : undefined,
        });
      } else if (status === "conflict") {
        results.push({
          mutationId: mutation.mutationId,
          status: "conflict",
          currentRevision: intValue(result.currentRevision),
          currentSessionJson: stringValue(result.currentSessionJson, "null"),
        });
      } else if (status === "rejected") {
        results.push({
          mutationId: mutation.mutationId,
          status: "rejected",
          errorCode: stringValue(result.errorCode, "rejected"),
        });
      } else {
        results.push({ mutationId: mutation.mutationId, status: "busy" });
      }
      continue;
    }

    try {
      const result = await Promise.race([
        applyMutation(userId, mutation),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("sync-timeout")), SYNC_TIMEOUT_MS),
        ),
      ]);
      await storeResult(
        userId,
        mutation.mutationId,
        result.status === "conflict" ? "conflict" : "applied",
        result.status === "conflict"
          ? {
              currentRevision: result.currentRevision,
              currentSessionJson: result.currentSessionJson,
            }
          : { revision: result.revision ?? null },
        undefined,
      );
      results.push(result);
    } catch (error) {
      const errorCode = error instanceof Error ? error.message : "sync-failed";
      await storeResult(userId, mutation.mutationId, "rejected", { errorCode }, errorCode);
      results.push({
        mutationId: mutation.mutationId,
        status: "rejected",
        errorCode,
      });
    }
  }

  await sql.query(
    "update blossom_sync_device set last_sync_at = current_timestamp, last_seen_at = current_timestamp where user_id = $1 and device_id = $2",
    [userId, deviceId],
  );
  return results;
}
