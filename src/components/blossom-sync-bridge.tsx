import { useEffect, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import {
  getBlossomBackendState,
  applyBlossomBackendState,
  type BlossomBackendState,
} from "@/lib/blossom/domain.api";
import { useBlossom } from "@/lib/blossom/store";
import {
  dequeueMutation,
  flushPendingMutations,
  getPendingMutations,
  type SyncMutation,
} from "@/lib/blossom/sync-client";
import type { PronlabAttempt } from "@/lib/blossom/engine";
import {
  buildPhonemeLeaves,
  computeMinerals,
  pushGrowthEvent,
  type GrowthEvent,
} from "@/lib/blossom/organism";
import { setsForLanguage } from "@/lib/blossom/data";

function mergeRemoteState(
  current: ReturnType<typeof useBlossom.getState>,
  remote: BlossomBackendState,
): Partial<ReturnType<typeof useBlossom.getState>> {
  const pronlabById = new Map<string, PronlabAttempt>(
    current.pronlabAttempts.map((attempt) => [attempt.id, attempt]),
  );
  for (const attempt of remote.pronlabAttempts ?? []) {
    if (pronlabById.has(attempt.id)) continue;
    pronlabById.set(attempt.id, attempt as PronlabAttempt);
  }

  let profileTandemOpen = current.tandemOpen;
  const prefs = (remote.profile?.preferences ?? {}) as Record<string, unknown>;
  if (typeof prefs.tandemOpen === "boolean") {
    profileTandemOpen = prefs.tandemOpen;
  }

  const tandemStatus = {
    ...current.tandemStatus,
    ...(remote.tandemStatus ?? {}),
  };

  return {
    activityLog: remote.activityLog ?? current.activityLog,
    joinedEventIds: remote.joinedEventIds ?? current.joinedEventIds,
    enrolledIds: remote.enrolledIds ?? current.enrolledIds,
    pronlabAttempts: [...pronlabById.values()].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    ),
    tandemStatus,
    tandemOpen: profileTandemOpen,
    homework: remote.homework ?? current.homework,
    vocabulary: remote.vocabulary ?? current.vocabulary,
    missionSessions: remote.missionSessions ?? current.missionSessions,
    growthEvents: remote.growthEvents ?? current.growthEvents,
    mineralSnapshot: remote.mineralSnapshot ?? current.mineralSnapshot,
    phonemeLeaves: remote.phonemeLeaves ?? current.phonemeLeaves,
    leoLetters: remote.leoLetters ?? current.leoLetters,
    syncOwnerUserId: remote.userId ?? current.syncOwnerUserId,
  };
}

function applyRejectionRollback(mutation: SyncMutation): void {
  const state = useBlossom.getState();

  if (mutation.operation === "activity.append") {
    const nextLog = state.activityLog.filter((e) => e.id !== mutation.mutationId);
    const scoped = nextLog.filter(
      (e) => (e.metadata as any)?.languageId === state.languageId || !e.metadata,
    );
    useBlossom.setState({
      activityLog: nextLog,
      mineralSnapshot: computeMinerals(scoped),
      growthEvents: state.growthEvents.filter((g) => g.id !== mutation.mutationId),
    });
    toast.error("Activité refusée par le serveur. Annulation.");
    return;
  }

  if (mutation.operation === "pronlab.attempt") {
    const next = state.pronlabAttempts.filter((a) => a.id !== mutation.mutationId);
    useBlossom.setState({
      pronlabAttempts: next,
      phonemeLeaves: buildPhonemeLeaves(
        next,
        setsForLanguage(state.languageId).flatMap((s) => s.items),
      ),
    });
    toast.error("Tentative Pron'Lab refusée. Annulation.");
    return;
  }

  if (mutation.operation === "tandem.status") {
    const previous =
      mutation.payload &&
      typeof mutation.payload === "object" &&
      "previousStatus" in mutation.payload
        ? (mutation.payload as any).previousStatus
        : null;
    const next = { ...state.tandemStatus };
    if (previous === null || previous === undefined) {
      delete next[mutation.entityId];
    } else {
      next[mutation.entityId] = previous;
    }
    useBlossom.setState({ tandemStatus: next });
    toast.error("Statut tandem refusé. Annulation.");
    return;
  }

  if (mutation.operation === "tandem.report") {
    const nextReports = { ...state.tandemReports };
    delete nextReports[mutation.entityId];
    useBlossom.setState({ tandemReports: nextReports });
    return;
  }

  // homework / vocabulary / profile rollbacks can be added similarly
  toast.error("Opération refusée par le serveur.");
}

export function BlossomSyncBridge({ children }: { children: ReactNode }) {
  const { user, isPending } = useCurrentUserState();
  const [hydrated, setHydrated] = useState(false);
  const flushing = useRef(false);

  useEffect(() => {
    if (isPending) return;
    if (!user) {
      // Identity isolation: clear persisted journey when signed out
      const current = useBlossom.getState();
      if (current.syncOwnerUserId) {
        useBlossom.getState().resetJourney();
      }
      setHydrated(true);
      return;
    }

    let cancelled = false;
    async function hydrate() {
      try {
        const remote = await getBlossomBackendState();
        if (cancelled || !remote) {
          setHydrated(true);
          return;
        }
        const current = useBlossom.getState();
        if (current.syncOwnerUserId && current.syncOwnerUserId !== remote.userId) {
          // Different identity — hard reset to avoid leakage
          useBlossom.getState().resetJourney();
        }
        const patch = mergeRemoteState(useBlossom.getState(), remote);
        useBlossom.setState(patch);
        useBlossom.getState().refreshOrganism();
      } catch {
        // offline / network — keep local
      } finally {
        if (!cancelled) setHydrated(true);
      }
    }
    void hydrate();
    return () => {
      cancelled = true;
    };
  }, [user, isPending]);

  useEffect(() => {
    if (!hydrated || !user) return;

    async function flush() {
      if (flushing.current) return;
      flushing.current = true;
      try {
        const pending = getPendingMutations();
        if (!pending.length) return;
        const results = await flushPendingMutations();
        for (const result of results) {
          if (result.status === "rejected" || result.status === "conflict") {
            applyRejectionRollback(result.mutation);
            dequeueMutation(result.mutation.mutationId);
          } else if (result.status === "applied") {
            dequeueMutation(result.mutation.mutationId);
          }
        }
      } catch {
        // will retry on next interval / focus
      } finally {
        flushing.current = false;
      }
    }

    void flush();
    const interval = window.setInterval(() => void flush(), 12_000);
    const onFocus = () => void flush();
    window.addEventListener("focus", onFocus);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, [hydrated, user]);

  if (isPending || !hydrated) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <span className="size-2 animate-pulse rounded-full bg-primary" />
      </div>
    );
  }

  return <>{children}</>;
}
