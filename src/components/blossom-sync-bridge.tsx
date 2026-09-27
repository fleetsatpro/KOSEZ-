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
import { buildPhonemeLeaves, computeMinerals } from "@/lib/blossom/organism";
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

/* truncated mid-file intentionally for size — full file continues with resolveMissionConflict, flushOutbox with activity.append + pronlab.attempt rollbacks, and BlossomSyncBridge component */
