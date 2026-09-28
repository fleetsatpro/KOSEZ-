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
import { buildPhonemeLeaves } from "@/lib/blossom/organism";
import { setsForLanguage } from "@/lib/blossom/data";
import { useBlossom } from "@/lib/blossom/store";
import { isUiLocaleId, isLearnLanguageId, type LearnLanguageId } from "@/lib/i18n/locales";

const SYNC_INTERVAL_MS = 45_000;
const MAX_BATCHES_PER_PASS = 8;

function isActivityType(value: string): value is ActivityEvent["type"] {
  return Object.prototype.hasOwnProperty.call(POINTS, value);
}

function timestamp(value: string | undefined): number {
  const parsed = Date.parse(value ?? "");
  return Number.isFinite(parsed) ? parsed : 0;
}

function localActivityKey(event: Pick<ActivityEvent, "id" | "sourceId" | "type">): string {
  return event.sourceId
    ? `${event.type}:source:${event.sourceId}`
    : `${event.type}:id:${event.id}`;
}

function mergeBackendState(remote: BackendState): void {
  const current = useBlossom.getState();

  let profilePatch: Partial<typeof current.learner> = {};
  const profilePlan: typeof current.plan = remote.plan ?? current.plan;
  let profileWarmup = current.warmup;
  let profileLanguageId = current.languageId;
  let profileUiLocale = current.uiLocale;
  let profileExportConsent = current.exportConsent;
  let profileTandemOpen = current.tandemOpen;
  let profileImmersionPhase = current.immersionPhase;
  let profileChildMissionDone = current.childMissionDone;
  const profileChildWords = new Set(current.childWords);

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
    if (remote.profile.targetLanguage && isLearnLanguageId(remote.profile.targetLanguage)) profileLanguageId = remote.profile.targetLanguage;
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
    if (prefs.immersionPhase === "pre" || prefs.immersionPhase === "during" || prefs.immersionPhase === "post") {
      profileImmersionPhase = prefs.immersionPhase;
    }
    if (typeof prefs.uiLocale === "string" && isUiLocaleId(prefs.uiLocale)) profileUiLocale = prefs.uiLocale;
    if (typeof prefs.childMissionDone === "boolean") {
      profileChildMissionDone = profileChildMissionDone || prefs.childMissionDone;
    }
    if (Array.isArray(prefs.childWords)) {
      for (const wordId of prefs.childWords) {
        if (typeof wordId === "string" && wordId.trim()) profileChildWords.add(wordId);
      }
    }
  }

  const activity = new Map<string, ActivityEvent>();
  for (const event of current.activityLog) {
    activity.set(localActivityKey(event), event);
  }
  for (const event of remote.activity) {
    if (!isActivityType(event.eventType)) continue;
    const rawMetadata = event.payload.metadata;
    const activityMetadata: ActivityEvent["metadata"] =
      rawMetadata && typeof rawMetadata === "object" && !Array.isArray(rawMetadata)
        ? Object.fromEntries(
            Object.entries(rawMetadata).filter(
              ([, value]) =>
                typeof value === "string" ||
                typeof value === "number" ||
                typeof value === "boolean",
            ),
          ) as ActivityEvent["metadata"]
        : undefined;
    const mapped: ActivityEvent = {
      id: event.id,
      type: event.eventType,
      createdAt: event.occurredAt,
      sourceId: event.sourceId ?? undefined,
      note:
        typeof event.payload.note === "string"
          ? event.payload.note
          : undefined,
      ...(activityMetadata && Object.keys(activityMetadata).length
        ? { metadata: activityMetadata }
        : {}),
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
      metadata: attempt.metadata,
    });
  }

  const vocabularyByWord = new Map<string, (typeof current.vocabulary)[number]>(
    current.vocabulary.map((entry) => {
      const languageId = entry.metadata?.languageId ?? "en";
      return [`${languageId}:${entry.word.toLowerCase()}`, entry] as const;
    }),
  );
  for (const entry of remote.vocabulary) {
    const rawLanguageId =
      typeof entry.languageId === "string"
        ? entry.languageId
        : typeof entry.metadata?.languageId === "string"
          ? entry.metadata.languageId
          : "en";
    const languageId: LearnLanguageId = isLearnLanguageId(rawLanguageId)
      ? rawLanguageId
      : "en";
    const key = `${languageId}:${entry.word.toLowerCase()}`;
    const local = vocabularyByWord.get(key);
    const remoteUpdatedAt = entry.updatedAt;
    const localUpdatedAt = local?.updatedAt;
    if (
      !local ||
      !localUpdatedAt ||
      (remoteUpdatedAt && timestamp(remoteUpdatedAt) >= timestamp(localUpdatedAt))
    ) {
      vocabularyByWord.set(key, {
        word: entry.word.toLowerCase(),
        gloss: entry.gloss,
        firstSavedAt: entry.firstSavedAt,
        updatedAt: remoteUpdatedAt,
        metadata: { languageId },
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
    uiLocale: profileUiLocale,
    exportConsent: profileExportConsent,
    tandemOpen: profileTandemOpen,
    immersionPhase: profileImmersionPhase,
    childMissionDone: profileChildMissionDone,
    childWords: [...profileChildWords],
    activityLog: [...activity.values()].sort(
      (a, b) => timestamp(a.createdAt) - timestamp(b.createdAt),
    ),
    pronlabAttempts: [...pronlabById.values()].sort(
      (a, b) => timestamp(a.createdAt) - timestamp(b.createdAt),
    ),
    phonemeLeaves: buildPhonemeLeaves(
      [...pronlabById.values()],
      setsForLanguage(profileLanguageId).flatMap((s) => s.items),
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

  useBlossom.getState().refreshOrganism();
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
          const rollback =
            mutation.payload.rollback &&
            typeof mutation.payload.rollback === "object" &&
            !Array.isArray(mutation.payload.rollback)
              ? (mutation.payload.rollback as Record<string, unknown>)
              : null;
          const rollbackTitle =
            typeof rollback?.title === "string" ? rollback.title : null;
          const rollbackBody =
            typeof rollback?.body === "string" ? rollback.body : null;
          const rollbackUpdatedAt =
            typeof rollback?.updatedAt === "string"
              ? rollback.updatedAt
              : null;
          if (
            status === "draft" &&
            rollbackTitle !== null &&
            rollbackBody !== null &&
            rollbackUpdatedAt !== null
          ) {
            useBlossom.setState({
              homework: state.homework.map((homework) =>
                homework.id === mutation.entityId
                  ? {
                      ...homework,
                      title: rollbackTitle,
                      body: rollbackBody,
                      status: "draft" as const,
                      updatedAt: rollbackUpdatedAt,
                    }
                  : homework,
              ),
            });
          } else {
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
          }
        } else if (mutation.operation === "activity.append") {
          const nextLog = state.activityLog.filter((event) => event.id !== mutation.mutationId);
          useBlossom.setState({
            activityLog: nextLog,
            growthEvents: state.growthEvents.filter(
              (g) => g.sourceId !== mutation.entityId && g.id !== mutation.mutationId,
            ),
          });
          useBlossom.getState().refreshOrganism();
        } else if (mutation.operation === "pronlab.attempt") {
          const nextAttempts = state.pronlabAttempts.filter(
            (a) => a.id !== mutation.mutationId && a.id !== mutation.entityId,
          );
          const items = setsForLanguage(state.languageId).flatMap((s) => s.items);
          useBlossom.setState({
            pronlabAttempts: nextAttempts,
            phonemeLeaves: buildPhonemeLeaves(nextAttempts, items),
          });
        }

        console.error("[blossom-sync] mutation rejected", {
          mutationId: result.mutationId,
          errorCode: result.errorCode,
        });
        toast("Une action n'a pas pu être synchronisée. Votre écran a été rétabli.");
        continue;
      }
    }

    if (!progressed) return;
  }
}

function SyncMark({ ready }: { ready: boolean }) {
  return (
    <span
      className="sr-only"
      data-blossom-sync={ready ? "ready" : "pending"}
      aria-live="polite"
    >
      {ready ? "Synchronisé" : "Synchronisation…"}
    </span>
  );
}

export function BlossomSyncBridge({
  children,
  onReady,
}: {
  children?: ReactNode;
  onReady?: () => void;
}) {
  const userState = useCurrentUserState();
  const userId = userState.status === "authenticated" ? userState.user.id : null;
  const identityKey = userId ?? "anonymous";
  const [ready, setReady] = useState(false);
  const [readyKey, setReadyKey] = useState<string | null>(null);
  const lastPull = useRef(0);
  const flushing = useRef(false);

  useEffect(() => {
    setSyncOwner(userId);
  }, [userId]);

  useEffect(() => {
    let disposed = false;

    async function pull() {
      if (!userId) {
        if (!disposed) {
          setReady(true);
          setReadyKey(identityKey);
          onReady?.();
        }
        return;
      }
      try {
        const remote = await getBlossomBackendState();
        if (disposed) return;
        mergeBackendState(remote);
        lastPull.current = Date.now();
      } catch (error) {
        console.error("[blossom-sync] pull failed", error);
      } finally {
        if (!disposed) {
          setReady(true);
          setReadyKey(identityKey);
          onReady?.();
        }
      }
    }

    async function tick() {
      if (flushing.current) return;
      flushing.current = true;
      try {
        await flushOutbox();
        if (Date.now() - lastPull.current > SYNC_INTERVAL_MS) {
          await pull();
        }
      } finally {
        flushing.current = false;
      }
    }

    void pull();
    const interval = window.setInterval(() => {
      void tick();
    }, 8_000);
    const changeEvent = syncChangeEventName();
    const onChange = () => {
      void tick();
    };
    window.addEventListener(changeEvent, onChange);
    window.addEventListener("online", onChange);

    return () => {
      disposed = true;
      window.clearInterval(interval);
      window.removeEventListener(changeEvent, onChange);
      window.removeEventListener("online", onChange);
    };
  }, [userId, identityKey, onReady]);

  return (
    <>
      {ready ? children : <SyncMark ready={false} />}
      <BlossomSyncBridgeInner
        onReady={() => {
          setReadyKey(identityKey);
        }}
      />
    </>
  );
}

function BlossomSyncBridgeInner({ onReady }: { onReady?: () => void }) {
  useEffect(() => {
    onReady?.();
  }, [onReady]);
  return null;
}

export function BlossomSyncGate({ children }: { children: ReactNode }) {
  const userState = useCurrentUserState();
  const userId = userState.status === "authenticated" ? userState.user.id : null;
  const identityKey = userId ?? "anonymous";
  const [readyKey, setReadyKey] = useState<string | null>(null);
  const ready = readyKey === identityKey;

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
