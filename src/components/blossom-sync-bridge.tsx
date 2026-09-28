import { useEffect, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { useBlossom } from "@/lib/blossom/store";
import {
  applyAcceptedMutations,
  applyServerSnapshot,
  flushPendingMutations,
  getPendingMutations,
  markMutationFailed,
  markMutationSynced,
  type PendingMutation,
} from "@/lib/blossom/sync-client";
import type { SyncOperation } from "@/lib/blossom/sync-types";
import { submitSyncBatch } from "@/lib/blossom/sync.api";
import { getBlossomBackendState } from "@/lib/blossom/api";

const FLUSH_INTERVAL_MS = 2500;
const MAX_BATCH = 12;

function identityKeyFromUser(userId: string | null | undefined): string {
  return userId ? `user:${userId}` : "anon";
}

function describeRejection(operation: SyncOperation, reason: string): string {
  switch (operation) {
    case "activity.append":
      return reason.includes("speak") || reason.includes("session")
        ? "Session non validée — preuve retirée."
        : "Activité refusée par le serveur.";
    case "pronlab.attempt":
      return "Tentative Pron'Lab refusée.";
    case "mission.save":
      return "Mission non enregistrée.";
    case "profile.upsert":
      return "Profil non synchronisé.";
    default:
      return "Synchronisation refusée.";
  }
}

function rollbackRejectedMutation(mutation: PendingMutation, reason: string): void {
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
        (event) =>
          !(event.sourceId === sourceId && String(event.type) === eventType),
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

export function BlossomSyncBridge() {
  const userState = useCurrentUserState();
  const userId =
    userState.status === "authenticated" ? userState.user.id : null;
  const identityKey = identityKeyFromUser(userId);
  const [readyKey, setReadyKey] = useState<string | null>(null);
  const flushing = useRef(false);
  const lastIdentity = useRef<string | null>(null);

  useEffect(() => {
    if (lastIdentity.current && lastIdentity.current !== identityKey) {
      useBlossom.getState().resetJourney();
    }
    lastIdentity.current = identityKey;
  }, [identityKey]);

  useEffect(() => {
    if (!userId) {
      setReadyKey(identityKey);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const snapshot = await getBlossomBackendState();
        if (cancelled) return;
        applyServerSnapshot(snapshot);
      } catch {
        // Offline / first load — keep local state
      } finally {
        if (!cancelled) setReadyKey(identityKey);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId, identityKey]);

  useEffect(() => {
    if (readyKey !== identityKey || !userId) return;
    let timer: ReturnType<typeof setTimeout> | null = null;

    async function flush() {
      if (flushing.current) return;
      const pending = getPendingMutations().slice(0, MAX_BATCH);
      if (pending.length === 0) return;
      flushing.current = true;
      try {
        const result = await submitSyncBatch({ mutations: pending });
        const accepted = result?.accepted ?? [];
        const rejected = result?.rejected ?? [];
        for (const item of accepted) {
          markMutationSynced(item.mutationId);
        }
        applyAcceptedMutations(accepted);
        for (const item of rejected) {
          const mutation = pending.find((m) => m.mutationId === item.mutationId);
          markMutationFailed(item.mutationId, item.reason ?? "rejected");
          if (mutation) {
            rollbackRejectedMutation(mutation, item.reason ?? "rejected");
          }
        }
      } catch {
        // Network error — keep pending for next flush
      } finally {
        flushing.current = false;
      }
    }

    function schedule() {
      timer = setTimeout(() => {
        void flush().finally(schedule);
      }, FLUSH_INTERVAL_MS);
    }
    schedule();
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [readyKey, identityKey, userId]);

  return null;
}

export function BlossomSyncBoundary({ children }: { children: ReactNode }) {
  const userState = useCurrentUserState();
  const userId =
    userState.status === "authenticated" ? userState.user.id : null;
  const identityKey = identityKeyFromUser(userId);
  const [readyKey, setReadyKey] = useState<string | null>(null);

  useEffect(() => {
    setReadyKey(null);
    const t = setTimeout(() => setReadyKey(identityKey), 0);
    return () => clearTimeout(t);
  }, [identityKey]);

  if (readyKey !== identityKey) {
    return null;
  }

  return (
    <>
      <BlossomSyncBridge />
      {children}
    </>
  );
}
