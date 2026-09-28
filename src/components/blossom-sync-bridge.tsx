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
const PROFILE_INTENT_KEY = "kosez-blossom-profile-intent-v1";

function readLocalProfileIntent() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(PROFILE_INTENT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function clearLocalProfileIntent(mutationId) {
  if (typeof window === "undefined") return;
  try {
    const current = readLocalProfileIntent();
    if (!mutationId || !current || current.mutationId === mutationId) {
      window.localStorage.removeItem(PROFILE_INTENT_KEY);
    }
  } catch {
    // Local persistence is an optimization; server state remains authoritative.
  }
}

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

function mergeBackendState(remote: BackendState, pendingMutations: SyncMutation[] = []): void {
  const current = useBlossom.getState();

  let profilePatch: Partial<typeof current.learner> = {};
  // The isolated learner smoke build intentionally owns its local plan so the
  // evidence journey can exercise Premium-only library behavior without a
  // subscription fixture. Deployed/auth-enabled builds remain server-authoritative.
  const profilePlan: typeof current.plan =
    import.meta.env.VITE_BROWSER_SMOKE === "true" ? current.plan : (remote.plan ?? current.plan);
  let profileWarmup = current.warmup;
  let profileLanguageId = current.languageId;
  let profileUiLocale = current.uiLocale;
  let profileExportConsent = current.exportConsent;
  let profileTandemOpen = current.tandemOpen;
  let profileImmersionPhase = current.immersionPhase;
  let profileChildMissionDone = current.childMissionDone;
  const profileChildWords = new Set(current.childWords);

  const pendingProfile = [...pendingMutations]
    .filter((mutation) => mutation.operation === "profile.upsert")
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .at(-1);
  const pendingProfilePayload =
    pendingProfile?.payload &&
    typeof pendingProfile.payload === "object" &&
    !Array.isArray(pendingProfile.payload)
      ? pendingProfile.payload
      : null;
  const localProfileIntent = readLocalProfileIntent();

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
    if (remote.profile.targetLanguage && isLearnLanguageId(remote.profile.targetLanguage)) {
      profileLanguageId = remote.profile.targetLanguage;
      profilePatch.targetLanguage = remote.profile.targetLanguage;
    }
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
    if (typeof prefs.city === "string") profilePatch.city = prefs.city;
    if (typeof prefs.avatar === "string") profilePatch.avatar = prefs.avatar;
    if (typeof prefs.nativeLanguage === "string") profilePatch.nativeLanguage = prefs.nativeLanguage;
    if (typeof prefs.creole === "string") profilePatch.creole = prefs.creole;
    if (typeof prefs.goal === "string") profilePatch.goal = prefs.goal;
    if (Array.isArray(prefs.interests)) {
      profilePatch.interests = prefs.interests.filter((item): item is string => typeof item === "string").slice(0, 8);
    }
    if (typeof prefs.practiceWindow === "string") profilePatch.practiceWindow = prefs.practiceWindow;
    if (typeof prefs.coach === "string") profilePatch.coach = prefs.coach;
    if (typeof prefs.coachVoice === "string") profilePatch.coachVoice = prefs.coachVoice;

  }

  // Do not let an older server snapshot overwrite a newer profile change that
  // is already durably queued on this device. The outbox is the user's intent;
  // the server snapshot becomes authoritative again once the mutation applies.
  const profileIntentActive = Boolean(
    localProfileIntent &&
    typeof localProfileIntent.createdAt === "string" &&
    (!remote.profile?.updatedAt ||
      timestamp(remote.profile.updatedAt) < timestamp(localProfileIntent.createdAt)),
  );
  if (pendingProfilePayload) {
    const targetLanguage = pendingProfilePayload.targetLanguage;
    if (typeof targetLanguage === "string" && isLearnLanguageId(targetLanguage)) {
      profileLanguageId = targetLanguage;
      profilePatch.targetLanguage = targetLanguage;
    }
    const displayName =
      typeof pendingProfilePayload.displayName === "string"
        ? pendingProfilePayload.displayName.trim()
        : "";
    if (displayName) {
      const parts = displayName.split(/\s+/);
      profilePatch = {
        ...profilePatch,
        firstName: parts.shift() ?? current.learner.firstName,
        lastName: parts.join(" ") || current.learner.lastName,
      };
    }
    if (typeof pendingProfilePayload.level === "string" && pendingProfilePayload.level.trim()) {
      profilePatch.level = pendingProfilePayload.level.trim();
    }
  }

  if (profileIntentActive) {
    const intent = localProfileIntent;
    if (typeof intent.targetLanguage === "string" && isLearnLanguageId(intent.targetLanguage)) {
      profileLanguageId = intent.targetLanguage;
      profilePatch.targetLanguage = intent.targetLanguage;
    }
    if (typeof intent.displayName === "string" && intent.displayName.trim()) {
      const parts = intent.displayName.trim().split(/\\s+/);
      profilePatch.firstName = parts.shift() ?? current.learner.firstName;
      profilePatch.lastName = parts.join(" ") || current.learner.lastName;
    }
    if (typeof intent.level === "string" && intent.level.trim()) {
      profilePatch.level = intent.level.trim();
    }
    const preferences =
      intent.preferences && typeof intent.preferences === "object" && !Array.isArray(intent.preferences)
        ? intent.preferences
        : null;
    if (preferences) {
      const textFields = [
        "city", "nativeLanguage", "creole", "goal", "practiceWindow", "coach", "coachVoice", "avatar",
      ];
      for (const field of textFields) {
        const value = preferences[field];
        if (typeof value === "string") profilePatch[field] = value;
      }
      if (Array.isArray(preferences.interests)) {
        profilePatch.interests = preferences.interests.filter((item) => typeof item === "string").slice(0, 8);
      }
      if (typeof preferences.uiLocale === "string" && isUiLocaleId(preferences.uiLocale)) {
        profileUiLocale = preferences.uiLocale;
      }
    }
  }

  const remoteMatchesLocalIntent = Boolean(
    localProfileIntent && remote.profile &&
    (typeof localProfileIntent.targetLanguage !== "string" || remote.profile.targetLanguage === localProfileIntent.targetLanguage) &&
    (typeof localProfileIntent.displayName !== "string" || (remote.profile.displayName ?? "").trim() === localProfileIntent.displayName.trim()) &&
    (typeof localProfileIntent.level !== "string" || (remote.profile.level ?? "") === localProfileIntent.level) &&
    (!localProfileIntent.preferences || typeof localProfileIntent.preferences !== "object" || Array.isArray(localProfileIntent.preferences) ||
      Object.entries(localProfileIntent.preferences).every(([key, value]) => {
        if (key === "uiLocale") return remote.profile?.preferences?.uiLocale === value;
        if (key === "city" || key === "nativeLanguage" || key === "creole" || key === "goal" || key === "practiceWindow" || key === "coach" || key === "coachVoice" || key === "avatar") {
          return remote.profile?.preferences?.[key] === value;
        }
        return true;
      }))
  );
  if (remoteMatchesLocalIntent) clearLocalProfileIntent();

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
        // The server's sync ledger is the durable dead letter record. Remove the
        // local command to prevent infinite retries, and roll back only the
        // optimistic UI state that this mutation could have created.
        await removeMutation(result.mutationId);

        const state = useBlossom.getState();
        if (mutation.operation === "event.register") {
          const rollback =
            mutation.payload.rollback &&
            typeof mutation.payload.rollback === "object" &&
            !Array.isArray(mutation.payload.rollback)
              ? (mutation.payload.rollback as Record<string, unknown>)
              : null;
          const wasJoined = rollback?.joined === true;
          const priorCount = Number.isFinite(Number(rollback?.count))
            ? Math.max(0, Number(rollback?.count))
            : 0;
          const joinedEventIds = wasJoined
            ? Array.from(new Set([...state.joinedEventIds, mutation.entityId]))
            : state.joinedEventIds.filter((id) => id !== mutation.entityId);
          useBlossom.setState({
            joinedEventIds,
            eventRegistrationCounts: {
              ...state.eventRegistrationCounts,
              [mutation.entityId]: priorCount,
            },
          });
        } else if (mutation.operation === "booking.request") {
          const rollback =
            mutation.payload.rollback &&
            typeof mutation.payload.rollback === "object" &&
            !Array.isArray(mutation.payload.rollback)
              ? (mutation.payload.rollback as Record<string, unknown>)
              : null;
          const wasEnrolled = rollback?.enrolled === true;
          const priorStatus =
            rollback?.status === "requested" || rollback?.status === "confirmed"
              ? rollback.status
              : null;
          const enrolledIds = wasEnrolled
            ? Array.from(new Set([...state.enrolledIds, mutation.entityId]))
            : state.enrolledIds.filter((id) => id !== mutation.entityId);
          const bookingStatuses = { ...state.bookingStatuses };
          if (priorStatus) bookingStatuses[mutation.entityId] = priorStatus;
          else delete bookingStatuses[mutation.entityId];
          useBlossom.setState({ enrolledIds, bookingStatuses });
        } else if (mutation.operation === "waitlist.request") {
          const rollback =
            mutation.payload.rollback &&
            typeof mutation.payload.rollback === "object" &&
            !Array.isArray(mutation.payload.rollback)
              ? (mutation.payload.rollback as Record<string, unknown>)
              : null;
          if (rollback?.waitlisted === true) {
            useBlossom.setState({
              waitlistIds: Array.from(new Set([...state.waitlistIds, mutation.entityId])),
            });
          } else {
            useBlossom.setState({
              waitlistIds: state.waitlistIds.filter((id) => id !== mutation.entityId),
            });
          }
        } else if (mutation.operation === "tandem.status") {
          const previous =
            mutation.payload.previousStatus === "suggested" ||
            mutation.payload.previousStatus === "pending" ||
            mutation.payload.previousStatus === "accepted" ||
            mutation.payload.previousStatus === "blocked" ||
            mutation.payload.previousStatus === "paused"
              ? mutation.payload.previousStatus
              : null;
          const next = { ...state.tandemStatus };
          if (previous) next[mutation.entityId] = previous;
          else delete next[mutation.entityId];
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
          useBlossom.getState().refreshOrganism();
        } else if (mutation.operation === "pronlab.attempt") {
          useBlossom.setState({
            pronlabAttempts: state.pronlabAttempts.filter((attempt) => attempt.id !== mutation.mutationId),
          });
          useBlossom.getState().refreshOrganism();
        } else if (mutation.operation === "profile.upsert") {
          clearLocalProfileIntent(mutation.mutationId);
          const rollback =
            mutation.payload.rollback &&
            typeof mutation.payload.rollback === "object" &&
            !Array.isArray(mutation.payload.rollback)
              ? (mutation.payload.rollback as Record<string, unknown>)
              : null;
          const learnerRollback =
            rollback?.learner &&
            typeof rollback.learner === "object" &&
            !Array.isArray(rollback.learner)
              ? (rollback.learner as typeof state.learner)
              : null;
          if (learnerRollback) useBlossom.setState({ learner: learnerRollback });
          if (typeof rollback?.languageId === "string" && isLearnLanguageId(rollback.languageId)) {
            useBlossom.setState({ languageId: rollback.languageId });
          }
          if (typeof rollback?.plan === "string") {
            useBlossom.setState({ plan: rollback.plan as typeof state.plan });
          }
          if (typeof rollback?.warmup === "string" || rollback?.warmup === null) {
            useBlossom.setState({ warmup: rollback.warmup as string | null });
          }
          if (typeof rollback?.exportConsent === "boolean") {
            useBlossom.setState({ exportConsent: rollback.exportConsent });
          }
          if (typeof rollback?.tandemOpen === "boolean") {
            useBlossom.setState({ tandemOpen: rollback.tandemOpen });
          }
          useBlossom.getState().refreshOrganism();
        } else if (mutation.operation === "vocabulary.upsert") {
          const rollback = mutation.payload.rollback;
          const previous =
            rollback && typeof rollback === "object" && !Array.isArray(rollback)
              ? (rollback as Record<string, unknown>).existing
              : null;
          if (previous && typeof previous === "object" && !Array.isArray(previous)) {
            const prior = previous as typeof state.vocabulary[number];
            useBlossom.setState({
              vocabulary: [
                ...state.vocabulary.filter(
                  (entry) =>
                    !(
                      entry.word.toLowerCase() === prior.word.toLowerCase() &&
                      (entry.metadata?.languageId ?? "en") === (prior.metadata?.languageId ?? "en")
                    ),
                ),
                prior,
              ],
            });
          } else {
            const word = typeof mutation.payload.word === "string" ? mutation.payload.word.toLowerCase() : "";
            const languageId =
              typeof mutation.payload.metadata === "object" &&
              mutation.payload.metadata &&
              !Array.isArray(mutation.payload.metadata)
                ? String((mutation.payload.metadata as Record<string, unknown>).languageId ?? state.languageId)
                : state.languageId;
            useBlossom.setState({
              vocabulary: state.vocabulary.filter(
                (entry) =>
                  !(entry.word.toLowerCase() === word && (entry.metadata?.languageId ?? "en") === languageId),
              ),
            });
          }
        } else if (mutation.operation === "learning.submission") {
          const rollback = mutation.payload.rollback;
          const previous =
            rollback && typeof rollback === "object" && !Array.isArray(rollback)
              ? (rollback as Record<string, unknown>).existing
              : null;
          if (previous && typeof previous === "object" && !Array.isArray(previous)) {
            const prior = previous as typeof state.learningSubmissions[number];
            useBlossom.setState({
              learningSubmissions: [
                ...state.learningSubmissions.filter((item) => item.id !== prior.id && item.taskId !== prior.taskId),
                prior,
              ],
            });
          } else {
            useBlossom.setState({
              learningSubmissions: state.learningSubmissions.filter(
                (item) => item.id !== mutation.mutationId && item.taskId !== mutation.entityId,
              ),
            });
          }
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

    // Keep a second pass when mutations arrive during an active pass.
    // This is important for causal chains such as LIBRARY_COMPLETED ->
    // CURRICULUM_EVIDENCE_RECORDED: the dependent evidence must never be
    // allowed to outrun the source mutation on the server.
    let rerunAfterSync = false;

    const run = async () => {
      if (disposed || !navigator.onLine) return;
      if (syncingRef.current) {
        rerunAfterSync = true;
        return;
      }
      syncingRef.current = true;
      try {
        const remote = await getBlossomBackendState();
        if (disposed) return;
        const pendingAtHydration = await listPendingMutations();
        mergeBackendState(remote as BackendState, pendingAtHydration);
        await flushOutbox();
        if (disposed) return;
        const finalRemote = await getBlossomBackendState();
        const pendingAfterFlush = await listPendingMutations();
        if (!disposed) mergeBackendState(finalRemote as BackendState, pendingAfterFlush);
        onReadyRef.current?.();
      } catch (error) {
        if (!disposed) {
          console.warn("[blossom-sync] deferred", error);
          onReadyRef.current?.();
        }
      } finally {
        syncingRef.current = false;
        if (!disposed && rerunAfterSync && navigator.onLine) {
          rerunAfterSync = false;
          queueMicrotask(() => void run());
        }
      }
    };

    const eventName = syncChangeEventName();
    const onChange = () => void run();
    const onOnline = () => void run();

    // Install the change listener before the first run. Otherwise a mutation
    // emitted during initial hydration can miss the event and wait a full
    // interval before reaching the server, breaking causal timing guarantees.
    window.addEventListener(eventName, onChange);
    window.addEventListener("online", onOnline);
    const timer = window.setInterval(onChange, SYNC_INTERVAL_MS);

    void run();

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

  const ready = identityKey !== null && readyKey === identityKey;

  useEffect(() => {
    if (identityKey === null || ready) return;
    // Never block the learner shell indefinitely on a remote/bootstrap problem.
    // BLOSSOM is offline-first: local state is usable while sync keeps retrying.
    const timer = window.setTimeout(() => setReadyKey(identityKey), 2500);
    return () => window.clearTimeout(timer);
  }, [identityKey, ready]);

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
