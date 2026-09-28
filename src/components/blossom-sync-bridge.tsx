import { useEffect, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { useBlossom } from "@/lib/blossom/store";
import {
  listPendingMutations,
  markConflict,
  removeMutation,
  setSyncOwner,
  syncChangeEventName,
} from "@/lib/blossom/sync-client";
import type { SyncMutation, SyncResult } from "@/lib/blossom/sync-types";
import { syncBlossom } from "@/lib/blossom/sync.api";
import { getBlossomBackendState } from "@/lib/blossom/api";

const SYNC_INTERVAL_MS = 45_000;

function identityKeyFromUser(userId: string | null | undefined): string {
  return userId ? `user:${userId}` : "__signed-out__";
}

function describeRejection(operation: string, reason: string): string {
  if (operation === "activity.append") {
    return reason.includes("speak") || reason.includes("session")
      ? "Session non validée — preuve retirée."
      : "Activité refusée par le serveur.";
  }
  if (operation === "pronlab.attempt") return "Tentative Pron'Lab refusée.";
  if (operation === "mission.save") return "Mission non enregistrée.";
  if (operation === "profile.upsert") return "Profil non synchronisé.";
  return "Synchronisation refusée.";
}

function rollbackRejectedMutation(mutation: SyncMutation, reason: string): void {
  const state = useBlossom.getState();
  if (mutation.operation === "activity.append") {
    const sourceId = String(
      (mutation.payload as { sourceId?: string }).sourceId ?? mutation.entityId ?? "",
    );
    const eventType = String(
      (mutation.payload as { eventType?: string }).eventType ?? "",
    );
    if (sourceId) {
      const nextLog = state.activityLog.filter(
        (event) => !(event.sourceId === sourceId && String(event.type) === eventType),
      );
      if (nextLog.length !== state.activityLog.length) {
        useBlossom.setState({ activityLog: nextLog });
        state.refreshOrganism();
      }
    }
  } else if (mutation.operation === "pronlab.attempt") {
    const itemId = String(
      (mutation.payload as { itemId?: string }).itemId ?? mutation.entityId ?? "",
    );
    if (itemId) {
      const nextAttempts = state.pronlabAttempts.filter(
        (attempt) => attempt.itemId !== itemId || attempt.id !== mutation.mutationId,
      );
      if (nextAttempts.length !== state.pronlabAttempts.length) {
        useBlossom.setState({ pronlabAttempts: nextAttempts });
        state.refreshOrganism();
      }
    }
  }
  toast.error(describeRejection(mutation.operation, reason));
}

export function BlossomSyncBridge({ onReady }: { onReady?: () => void }) {
  const { user, isPending } = useCurrentUserState();
  const userId = user?.id ?? null;
  const identityKey = isPending ? null : identityKeyFromUser(userId);
  const flushing = useRef(false);
  const lastIdentity = useRef<string | null>(null);

  useEffect(() => {
    if (isPending || identityKey === null) return;
    if (lastIdentity.current && lastIdentity.current !== identityKey) {
      useBlossom.getState().resetJourney();
    }
    lastIdentity.current = identityKey;
    setSyncOwner(userId);
  }, [identityKey, isPending, userId]);

  useEffect(() => {
    if (isPending || identityKey === null) return;
    if (!userId) {
      onReady?.();
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        await getBlossomBackendState();
      } catch {
        // Offline / first load
      } finally {
        if (!cancelled) onReady?.();
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId, identityKey, isPending, onReady]);

  useEffect(() => {
    if (isPending || !userId || identityKey === null) return;
    let timer: ReturnType<typeof setTimeout> | null = null;

    async function flush() {
      if (flushing.current) return;
      const pending = await listPendingMutations();
      if (pending.length === 0) return;
      flushing.current = true;
      try {
        const batch = pending.slice(0, 50);
        const deviceId = batch[0]?.deviceId;
        if (!deviceId) return;
        const response = await syncBlossom({
          data: {
            deviceId,
            mutationsJson: JSON.stringify(batch),
          },
        });
        for (const result of response.results as SyncResult[]) {
          const mutation = batch.find((m) => m.mutationId === result.mutationId);
          if (!mutation) continue;
          if (result.status === "applied" || result.status === "duplicate") {
            await removeMutation(result.mutationId);
          } else if (result.status === "rejected") {
            await removeMutation(result.mutationId);
            rollbackRejectedMutation(mutation, result.reason ?? "rejected");
          } else if (result.status === "conflict") {
            await markConflict(result.mutationId, result);
          }
        }
      } catch {
        // Network — keep pending
      } finally {
        flushing.current = false;
      }
    }

    function schedule() {
      timer = setTimeout(() => {
        void flush().finally(schedule);
      }, SYNC_INTERVAL_MS);
    }
    void flush();
    schedule();

    const onChange = () => {
      void flush();
    };
    window.addEventListener(syncChangeEventName(), onChange);
    return () => {
      if (timer) clearTimeout(timer);
      window.removeEventListener(syncChangeEventName(), onChange);
    };
  }, [userId, identityKey, isPending]);

  return null;
}

export function BlossomSyncBoundary({ children }: { children: ReactNode }) {
  const { user, isPending } = useCurrentUserState();
  const identityKey = isPending ? null : identityKeyFromUser(user?.id);
  const [readyKey, setReadyKey] = useState<string | null>(null);

  if (isPending || identityKey === null) return null;

  return (
    <>
      {readyKey === identityKey ? children : null}
      <BlossomSyncBridge
        onReady={() => {
          setReadyKey(identityKey);
        }}
      />
    </>
  );
}
