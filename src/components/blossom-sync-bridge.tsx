import { useEffect, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import {
  getBlossomBackendState,
} from "@/lib/blossom/api";
import { syncBlossom } from "@/lib/blossom/sync.api";
import {
  createMutation,
  listPendingMutations,
  markConflict,
  removeMutation,
  replaceConflictWithMutation,
  setSyncOwner,
  syncChangeEventName,
} from "@/lib/blossom/sync-client";
import { mergeMissionSessions } from "@/lib/blossom/sync-merge";
import type { MissionSession } from "@/lib/blossom/mission";
import type { LearningSubmission, Homework, TeacherNote } from "@/lib/blossom/store";
import type { BackendState, SyncJsonValue, SyncMutation, SyncResult } from "@/lib/blossom/sync-types";
import { POINTS, type ActivityEvent, type PronlabAttempt } from "@/lib/blossom/engine";
import { useBlossom } from "@/lib/blossom/store";

const SYNC_INTERVAL_MS = 45_000;
const MAX_BATCHES_PER_PASS = 8;

function isActivityType(value: string): value is ActivityEvent["type"] {
  return Object.prototype.hasOwnProperty.call(POINTS, value);
}

function timestamp(value: string | undefined): number {
  const parsed = Date.parse(value ?? "");
  return Number.isFinite(parsed) ? parsed : 0;
}

function localActivityKey(event: Pick<ActivityEvent, "id" | "sourceId">): string {
  return event.sourceId ? `source:${event.sourceId}` : `id:${event.id}`;
}

function mergeBackendState(remote: BackendState): void {
  const current = useBlossom.getState();

  let profilePatch: Partial<typeof current.learner> = {};
  const profilePlan: typeof current.plan = remote.plan ?? current.plan;
  let profileWarmup = current.warmup;
  let profileLanguageId = current.languageId;
  let profileExportConsent = current.exportConsent;
  let profileTandemOpen = current.tandemOpen;

  if (remote.profile) {
    const displayName = remote.profile.displayName?.trim();
    if (displayName) {
      const parts = displayName.split(/\s+/);
      profilePatch = {
        firstName: parts.shift() ?? current.learner.firstName,
        lastName: parts.join(" ") || current.learner.lastName,
      };
    }
    if (remote.profile.level) profilePatch.level = remote.profile.level;
    if (remote.profile.targetLanguage) profileLanguageId = remote.profile.targetLanguage;
    const prefs = remote.profile.preferences;
    if (typeof prefs.warmup === "string" || prefs.warmup === null) {
      profileWarmup = prefs.warmup as string | null;
    }
    if (typeof prefs.exportConsent === "boolean") {
      profileExportConsent = prefs.exportConsent;
    }
    if (typeof prefs.tandemOpen === "boolean") {
      profileTandemOpen = prefs.tandemOpen;
    }
  }

  const activity = new Map<string, ActivityEvent>();
  for (const event of current.activityLog) {
    activity.set(localActivityKey(event), event);
  }
  for (const event of remote.activity) {
    if (!isActivityType(event.eventType)) continue;
    const mapped: ActivityEvent = {
      id: event.id,
      type: event.eventType,
      createdAt: event.occurredAt,
      sourceId: event.sourceId ?? undefined,
      note:
        typeof event.payload.note === "string"
          ? event.payload.note
          : undefined,
    };
    const key = localActivityKey(mapped);
    const existing = activity.get(key);
    if (!existing || timestamp(existing.createdAt) <= timestamp(mapped.createdAt)) {
      activity.set(key, mapped);
    }
  }

  const pronlabById = new Map<string, PronlabAttempt>(
    current.pronlabAttempts.map((attempt) => [attempt.id, attempt]),
  );
  for (const attempt of remote.pronlabAttempts) {
    if (pronlabById.has(attempt.id)) continue;
    pronlabById.set(attempt.id, {
      id: attempt.id,
      itemId: attempt.itemId,
      score: attempt.score,
      tip: attempt.tip ?? "",
      createdAt: attempt.createdAt,
      seconds: attempt.seconds,
    });
  }

  const vocabularyByWord = new Map(
    current.vocabulary.map((entry) => [entry.word.toLowerCase(), entry]),
  );
  for (const entry of remote.vocabulary) {
    const key = entry.word.toLowerCase();
    const local = vocabularyByWord.get(key);
    const remoteUpdatedAt = entry.updatedAt;
    const localUpdatedAt = local?.updatedAt;
    if (
      !local ||
      !localUpdatedAt ||
      (remoteUpdatedAt && timestamp(remoteUpdatedAt) >= timestamp(localUpdatedAt))
    ) {
      vocabularyByWord.set(key, {
        word: key,
        gloss: entry.gloss,
        firstSavedAt: entry.firstSavedAt,
        updatedAt: remoteUpdatedAt,
      });
    }
  }

  const missionSessions = { ...current.missionSessions };
  const revisions = { ...current.backendMissionRevisions };
  for (const [missionId, remoteMission] of Object.entries(remote.missionSessions)) {
    const local = missionSessions[missionId] ?? null;
    try {
      missionSessions[missionId] = mergeMissionSessions(local, remoteMission);
    } catch {
      if (!local) {
        const candidate = remoteMission.session as unknown as MissionSession;
        if (candidate?.missionId === missionId) missionSessions[missionId] = candidate;
      }
    }
    revisions[missionId] = remoteMission.revision;
  }

  const joinedEventIds = new Set(current.joinedEventIds);
  const waitlistIds = new Set(current.waitlistIds);
  for (const [eventId, status] of Object.entries(remote.eventRegistrations)) {
    if (status === "joined") {
      joinedEventIds.add(eventId);
      waitlistIds.delete(eventId);
    } else if (status === "waitlist") {
      waitlistIds.add(eventId);
      joinedEventIds.delete(eventId);
    } else {
      joinedEventIds.delete(eventId);
      waitlistIds.delete(eventId);
    }
  }

  const immersionDone = new Set(current.immersionDone);
  for (const id of remote.completedChallenges) immersionDone.add(id);

  const tandemStatus = {
    ...current.tandemStatus,
    ...remote.tandemStatus,
  };

  const homeworkById = new Map<string, Homework>(
    current.homework.map((item) => [item.id, item]),
  );
  for (const item of remote.homework) {
    homeworkById.set(item.id, {
      id: item.id,
      studentId: item.learnerUserId,
      title: item.title,
      body: item.body,
      status: item.status,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    });
  }

  const teacherNotesById = new Map<string, TeacherNote>(
    current.teacherNotes.map((note) => [note.id, note]),
  );
  for (const note of remote.teacherNotes) {
    teacherNotesById.set(note.id, {
      id: note.id,
      studentId: note.learnerUserId,
      tags: note.tags,
      text: note.note,
      createdAt: note.createdAt,
    });
  }

  const submissionById = new Map<string, LearningSubmission>(
    current.learningSubmissions.map((submission) => [submission.id, submission]),
  );
  for (const submission of remote.learningSubmissions) {
    submissionById.set(submission.id, {
      id: submission.id,
      taskId: submission.taskId,
      kind: submission.kind,
      content: submission.content,
      checks: submission.checks,
      result: submission.result,
      createdAt: submission.createdAt,
      updatedAt: submission.updatedAt,
    });
  }


  useBlossom.setState({
    learner: { ...current.learner, ...profilePatch },
    plan: profilePlan,
    warmup: profileWarmup,
    languageId: profileLanguageId,
    exportConsent: profileExportConsent,
    tandemOpen: profileTandemOpen,
    activityLog: [...activity.values()].sort(
      (a, b) => timestamp(a.createdAt) - timestamp(b.createdAt),
    ),
    pronlabAttempts: [...pronlabById.values()].sort(
      (a, b) => timestamp(a.createdAt) - timestamp(b.createdAt),
    ),
    vocabulary: [...vocabularyByWord.values()],
    missionSessions,
    backendMissionRevisions: revisions,
    joinedEventIds: [...joinedEventIds],
    eventRegistrationCounts: {
      ...(remote.eventRegistrationCounts ?? {}),
    },
    immersionDone: [...immersionDone],
    tandemStatus,
    learningSubmissions: [...submissionById.values()].sort((a, b) => timestamp(a.createdAt) - timestamp(b.createdAt)),
    homework: [...homeworkById.values()].sort((a, b) => timestamp(b.updatedAt) - timestamp(a.updatedAt)),
    teacherNotes: [...teacherNotesById.values()].sort((a, b) => timestamp(b.createdAt) - timestamp(a.createdAt)),
    bookingStatuses: {
      ...current.bookingStatuses,
      ...(remote.bookingStatuses ?? {}),
    },
    enrolledIds: [...(remote.bookingCatalogueIds ?? [])],
    waitlistIds: [...(remote.waitlistIds ?? [])],
  });
}

async function resolveMissionConflict(
  mutation: SyncMutation,
  result: Extract<SyncResult, { status: "conflict" }>,
): Promise<void> {
  const session = mutation.payload.session as SyncJsonValue | undefined;
  if (!session) return;

  const remoteSession = JSON.parse(result.currentSessionJson) as MissionSession;
  const merged = mergeMissionSessions(
    session as unknown as MissionSession,
    {
      session: remoteSession,
      revision: result.currentRevision,
      updatedAt: new Date().toISOString(),
    },
  );

  const retry = createMutation({
    operation: "mission.save",
    entityId: mutation.entityId,
    expectedRevision: result.currentRevision,
    payload: {
      session: merged as unknown as SyncJsonValue,
    },
  });

  await markConflict(mutation.mutationId, result);
  await replaceConflictWithMutation(mutation.mutationId, retry);

  useBlossom.setState({
    backendMissionRevisions: {
      ...useBlossom.getState().backendMissionRevisions,
      [mutation.entityId]: result.currentRevision + 1,
    },
    missionSessions: {
      ...useBlossom.getState().missionSessions,
      [mutation.entityId]: merged,
    },
  });
}

async function flushOutbox(): Promise<void> {
  for (let batchNumber = 0; batchNumber < MAX_BATCHES_PER_PASS; batchNumber += 1) {
    const pending = await listPendingMutations();
    if (pending.length === 0) return;

    const batch = pending.slice(0, 50);
    const deviceId = batch[0]?.deviceId;
    if (!deviceId) return;

    const response = await syncBlossom({
      data: {
        deviceId,
        mutationsJson: JSON.stringify(batch),
      },
    });

    const byId = new Map(pending.map((mutation) => [mutation.mutationId, mutation]));
    let progressed = false;

    for (const result of response.results) {
      const mutation = byId.get(result.mutationId);
      if (!mutation) continue;

      if (result.status === "applied" || result.status === "duplicate") {
        await removeMutation(result.mutationId);
        progressed = true;
        if (
          mutation.operation === "mission.save" &&
          typeof result.revision === "number"
        ) {
          useBlossom.setState({
            backendMissionRevisions: {
              ...useBlossom.getState().backendMissionRevisions,
              [mutation.entityId]: result.revision,
            },
          });
        }
        continue;
      }

      if (result.status === "conflict") {
        if (mutation.operation === "mission.save") {
          await resolveMissionConflict(mutation, result);
          progressed = true;
        } else {
          await markConflict(mutation.mutationId, result);
        }
        continue;
      }

      if (result.status === "rejected") {
        // The server's sync ledger is the durable dead letter record. Remove the
        // local command to prevent infinite retries, and roll back only the
        // optimistic UI state that this mutation could have created.
        await removeMutation(result.mutationId);

        const state = useBlossom.getState();
        if (mutation.operation === "event.register") {
          const status =
            typeof mutation.payload.status === "string"
              ? mutation.payload.status
              : undefined;
          if (status === "joined" && state.joinedEventIds.includes(mutation.entityId)) {
            useBlossom.setState({
              joinedEventIds: state.joinedEventIds.filter((id) => id !== mutation.entityId),
              eventRegistrationCounts: {
                ...state.eventRegistrationCounts,
                [mutation.entityId]: Math.max(
                  0,
                  (state.eventRegistrationCounts[mutation.entityId] ?? 1) - 1,
                ),
              },
            });
          }
        } else if (mutation.operation === "booking.request") {
          const nextStatuses = { ...state.bookingStatuses };
          delete nextStatuses[mutation.entityId];
          useBlossom.setState({
            enrolledIds: state.enrolledIds.filter((id) => id !== mutation.entityId),
            bookingStatuses: nextStatuses,
          });
        } else if (mutation.operation === "waitlist.request") {
          useBlossom.setState({
            waitlistIds: state.waitlistIds.filter((id) => id !== mutation.entityId),
          });
        } else if (mutation.operation === "tandem.status") {
          const next = { ...state.tandemStatus };
          delete next[mutation.entityId];
          useBlossom.setState({ tandemStatus: next });
        } else if (mutation.operation === "tandem.report") {
          const payload = mutation.payload as {
            previousStatus?: string;
          };
          const nextReports = { ...state.tandemReports };
          const nextCount = Math.max(
            0,
            (nextReports[mutation.entityId] ?? 1) - 1,
          );
          if (nextCount === 0) delete nextReports[mutation.entityId];
          const restoredStatus =
            payload.previousStatus === "pending" ||
            payload.previousStatus === "accepted" ||
            payload.previousStatus === "paused" ||
            payload.previousStatus === "blocked" ||
            payload.previousStatus === "suggested"
              ? payload.previousStatus
              : "suggested";
          useBlossom.setState({
            tandemReports: nextReports,
            tandemStatus: {
              ...state.tandemStatus,
              [mutation.entityId]: restoredStatus,
            },
          });
        } else if (mutation.operation === "teacher.note") {
          useBlossom.setState({
            teacherNotes: state.teacherNotes.filter((note) => note.id !== mutation.mutationId),
          });
        } else if (mutation.operation === "teacher.homework") {
          const status =
            typeof mutation.payload.status === "string"
              ? mutation.payload.status
              : undefined;
          useBlossom.setState({
            homework:
              status === "sent"
                ? state.homework.map((homework) =>
                    homework.id === mutation.entityId
                      ? { ...homework, status: "draft" as const }
                      : homework,
                  )
                : state.homework.filter((homework) => homework.id !== mutation.mutationId),
          });
        } else if (mutation.operation === "homework.complete") {
          useBlossom.setState({
            homework: state.homework.map((homework) =>
              homework.id === mutation.entityId
                ? { ...homework, status: "sent" as const }
                : homework,
            ),
          });
        } else if (mutation.operation === "activity.append") {
          useBlossom.setState({
            activityLog: state.activityLog.filter((event) => event.id !== mutation.mutationId),
          });
        }

        console.error("[blossom-sync] mutation rejected", {
          mutationId: result.mutationId,
          errorCode: result.errorCode,
        });
        toast("Une action n’a pas pu être synchronisée. Votre écran a été remis à l’état confirmé.");
        progressed = true;
      }
    }

    if (!progressed) return;
  }
}

function SyncMark({ ready }: { ready: boolean }) {
  if (ready) return null;
  return (
    <div className="min-h-dvh bg-[#0a0d0c] text-[#d9ff69] grid place-items-center px-6">
      <div className="text-center">
        <div className="mx-auto mb-4 size-8 animate-pulse rounded-full border border-[#d9ff69]/30 border-t-[#d9ff69]" />
        <p className="text-xs uppercase tracking-[0.24em] text-[#d9ff69]/70">
          BLOSSOM · synchronisation
        </p>
      </div>
    </div>
  );
}

export function BlossomSyncBridge({ onReady }: { onReady?: () => void } = {}) {
  const { user, isPending } = useCurrentUserState();
  const syncingRef = useRef(false);
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;

  useEffect(() => {
    if (isPending) return;

    if (!user) {
      setSyncOwner(null);
      useBlossom.getState().resetJourney();
      onReadyRef.current?.();
      return;
    }

    let disposed = false;
    const storedOwner = useBlossom.getState().syncOwnerUserId;
    const userChanged = storedOwner !== user.id;
    setSyncOwner(user.id);

    if (userChanged) {
      useBlossom.getState().resetJourney();
    }
    useBlossom.setState({ syncOwnerUserId: user.id });

    if (!navigator.onLine) {
      onReadyRef.current?.();
      return;
    }

    const run = async () => {
      if (disposed || syncingRef.current || !navigator.onLine) return;
      syncingRef.current = true;
      try {
        const remote = await getBlossomBackendState();
        if (disposed) return;
        mergeBackendState(remote as BackendState);
        await flushOutbox();
        if (disposed) return;
        const finalRemote = await getBlossomBackendState();
        if (!disposed) mergeBackendState(finalRemote as BackendState);
        onReadyRef.current?.();
      } catch (error) {
        if (!disposed) {
          console.warn("[blossom-sync] deferred", error);
          onReadyRef.current?.();
        }
      } finally {
        syncingRef.current = false;
      }
    };

    void run();

    const eventName = syncChangeEventName();
    const onChange = () => void run();
    const onOnline = () => void run();

    window.addEventListener(eventName, onChange);
    window.addEventListener("online", onOnline);
    const timer = window.setInterval(onChange, SYNC_INTERVAL_MS);

    return () => {
      disposed = true;
      window.removeEventListener(eventName, onChange);
      window.removeEventListener("online", onOnline);
      window.clearInterval(timer);
    };
  }, [isPending, user?.id]);

  return null;
}

export function BlossomSyncBoundary({ children }: { children: ReactNode }) {
  const { user, isPending } = useCurrentUserState();
  const [readyKey, setReadyKey] = useState<string | null>(null);
  const identityKey = isPending ? null : user?.id ?? "__signed-out__";

  useEffect(() => {
    setReadyKey(null);
    if (!isPending && !user) setReadyKey("__signed-out__");
  }, [isPending, user?.id]);

  const ready = identityKey !== null && readyKey === identityKey;

  return (
    <>
      {ready ? children : <SyncMark ready={false} />}
      <BlossomSyncBridge
        onReady={() => {
          setReadyKey(identityKey);
        }}
      />
    </>
  );
}
