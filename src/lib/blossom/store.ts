import { create } from "zustand";
import { isLearnLanguageId, isUiLocaleId, uiLocaleDef, type LearnLanguageId, type UiLocaleId } from "@/lib/i18n/locales";
import { persist } from "zustand/middleware";
import { track } from "@/lib/analytics";
import { createMutation, enqueueMutation } from "./sync-client";
import type { SyncJsonObject, SyncJsonValue } from "./sync-types";

const PROFILE_INTENT_KEY = "kosez-blossom-profile-intent-v1";

let blossomHydrated = false;
const hydrationListeners = new Set<() => void>();

export function isBlossomHydrated() {
  return blossomHydrated;
}

export function subscribeBlossomHydration(listener: () => void) {
  if (blossomHydrated) {
    listener();
    return () => undefined;
  }
  hydrationListeners.add(listener);
  return () => hydrationListeners.delete(listener);
}

function markBlossomHydrated() {
  if (blossomHydrated) return;
  blossomHydrated = true;
  for (const listener of hydrationListeners) listener();
  hydrationListeners.clear();
}
import {
  activityBelongsToLanguage,
  hasSource,
  journeySnapshot,
  summarisePronlabItem,
  type ActivityEvent,
  type ActivityType,
  type PronlabAttempt,
} from "./engine";
import { mergeMissionSessions } from "./sync-merge";
import {
  activeMissionRun,
  appendMissionAttempt,
  beginMissionRun,
  createMissionSession,
  evaluateMission,
  finishMissionRun,
  reopenMissionRun,
  recordMissionSupport as persistMissionSupport,
  saveMissionReflection,
  type MissionCapture,
  type MissionChallenge,
  type MissionMode,
  type MissionReflection,
  type MissionSession,
} from "./mission";
import {
  findPronlabItem,
  findPronlabSet,
  PRONLAB_SETS,
  setsForLanguage,
  type PlanId,
} from "./data";
import {
  buildPhonemeLeaves,
  composeLeoLetter,
  computeMinerals,
  growthEventForActivity,
  pushGrowthEvent,
  type GrowthEvent,
  type LeoLetter,
  type MineralSnapshot,
  type PhonemeLeaf,
} from "./organism";

export type LearnerProfile = {
  firstName: string;
  lastName: string;
  city: string;
  avatar: string;
  nativeLanguage: string;
  creole: string;
  targetLanguage: string;
  level: string;
  goal: string;
  interests: string[];
  practiceWindow: string;
  coach: string;
  coachVoice: string;
};

export const NEW_LEARNER: LearnerProfile = {
  firstName: "",
  lastName: "",
  city: "Saint-Pierre",
  avatar: "",
  nativeLanguage: "Français",
  creole: "Créole réunionnais",
  targetLanguage: "English",
  level: "A2",
  goal: "",
  interests: [],
  practiceWindow: "",
  coach: "Léo",
  coachVoice: "Posé, précis, jamais infantilisant.",
};

export type TandemStatus = "suggested" | "pending" | "accepted" | "blocked" | "paused";

export type Homework = {
  id: string;
  studentId: string;
  title: string;
  body: string;
  status: "draft" | "sent" | "done";
  createdAt: string;
  updatedAt: string;
};

export type LearningSubmission = {
  id: string;
  taskId: string;
  kind: "grammar" | "listening" | "writing" | "review";
  content: string;
  checks: string[];
  result: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type TeacherNote = {
  id: string;
  studentId: string;
  tags: string[];
  text: string;
  createdAt: string;
};

type AppState = {
  hasEntered: boolean;
  parentMode: boolean;
  teacherMode: boolean;
  orgMode: boolean;
  adminMode: boolean;
  childMode: boolean;
  learner: LearnerProfile;
  activityLog: ActivityEvent[];
  joinedEventIds: string[];
  eventRegistrationCounts: Record<string, number>;
  enrolledIds: string[];
  assignedSetIds: string[];
  bookingStatuses: Record<string, "requested" | "confirmed">;
  pronlabAttempts: PronlabAttempt[];
  tandemStatus: Record<string, TandemStatus>;
  tandemOpen: boolean;
  tandemReports: Record<string, number>;
  homework: Homework[];
  teacherNotes: TeacherNote[];
  learningSubmissions: LearningSubmission[];
  warmup: string | null;
  exportConsent: boolean;
  vocabulary: {
    word: string;
    gloss: string;
    firstSavedAt?: string;
    updatedAt?: string;
    metadata?: { languageId?: LearnLanguageId };
  }[];
  immersionPhase: "pre" | "during" | "post";
  immersionDone: string[];
  plan: PlanId;
  childMissionDone: boolean;
  childWords: string[];
  waitlistIds: string[];
  languageId: LearnLanguageId;
  uiLocale: UiLocaleId;
  missionSessions: Record<string, MissionSession>;
  backendMissionRevisions: Record<string, number>;
  syncOwnerUserId: string | null;
  growthEvents: GrowthEvent[];
  mineralSnapshot: MineralSnapshot;
  phonemeLeaves: PhonemeLeaf[];
  leoLetters: LeoLetter[];
  enter: () => void;
  setParentMode: (value: boolean) => void;
  setTeacherMode: (value: boolean) => void;
  setOrgMode: (value: boolean) => void;
  setAdminMode: (value: boolean) => void;
  setChildMode: (value: boolean) => void;
  updateLearner: (patch: Partial<LearnerProfile>) => void;
  startMissionRun: (missionId: string, mode: MissionMode, challenge?: MissionChallenge) => string | null;
  recordMissionAttempt: (missionId: string, kind: "warmup" | "mission", capture: MissionCapture, seconds: number) => boolean;
  recordMissionSupport: (missionId: string) => boolean;
  saveMissionReflection: (missionId: string, reflection: MissionReflection) => boolean;
  reopenMissionSession: (missionId: string) => boolean;
  completeMissionSession: (missionId: string, rewardSourceId?: string | null) => { ok: boolean; reason?: string; evaluation?: ReturnType<typeof evaluateMission> };
  completeActivity: (type: ActivityType, sourceId: string, note?: string, metadata?: Record<string, string | number | boolean>) => { ok: boolean; reason?: string; event?: GrowthEvent; previousMinerals?: MineralSnapshot; minerals?: MineralSnapshot };
  acceptConfirmedActivity: (event: ActivityEvent) => void;
  joinEvent: (id: string) => void;
  leaveEvent: (id: string) => void;
  enroll: (id: string) => void;
  recordPronlabAttempt: (itemId: string, seconds: number, metadata?: Record<string, unknown>) => PronlabAttempt | null;
  setTandemStatus: (partnerId: string, status: TandemStatus) => void;
  setTandemOpen: (value: boolean) => void;
  reportTandem: (partnerId: string) => { count: number; escalated: boolean };
  addTeacherNote: (studentId: string, tags: string[], text: string) => void;
  saveLearningSubmission: (input: Omit<LearningSubmission, "id" | "createdAt" | "updatedAt"> & { taskId: string }) => void;
  saveWarmup: (text: string) => void;
  saveHomeworkDraft: (studentId: string, title: string, body: string) => void;
  sendHomework: (id: string) => void;
  completeHomework: (id: string) => void;
  setExportConsent: (value: boolean) => void;
  saveWord: (word: string, gloss: string) => void;
  setImmersionPhase: (phase: "pre" | "during" | "post") => void;
  completeChallenge: (id: string) => void;
  completeChildMission: () => void;
  markChildWord: (id: string) => void;
  joinWaitlist: (id: string) => void;
  setLanguage: (id: LearnLanguageId) => void;
  setUiLocale: (id: UiLocaleId) => void;
  completePulse: (dareId: string, seconds: number, offline: boolean) => void;
  startLibraryReading: (documentId: string) => void;
  completeLibraryReading: (documentId: string) => void;
  markLeoLetterRead: (id: string) => void;
  refreshOrganism: () => void;
  resetJourney: () => void;
};

function voidSyncMutation(input: Parameters<typeof createMutation>[0]): void {
  void enqueueMutation(createMutation(input));
}

function voidMissionSync(
  missionId: string,
  session: MissionSession,
  currentRevisions: Record<string, number>,
): Record<string, number> {
  const expectedRevision = currentRevisions[missionId] ?? 0;
  voidSyncMutation({
    operation: "mission.save",
    entityId: missionId,
    expectedRevision,
    payload: { session: session as unknown as SyncJsonValue },
  });
  return { ...currentRevisions, [missionId]: expectedRevision + 1 };
}

function activeLanguageActivityLog(
  log: ActivityEvent[],
  languageId: LearnLanguageId,
): ActivityEvent[] {
  return log.filter((event) => activityBelongsToLanguage(event, languageId));
}

function localTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

function voidProfileSync(
  learner: LearnerProfile,
  languageId: string,
  plan: PlanId,
  warmup: string | null,
  exportConsent: boolean,
  tandemOpen: boolean,
  rollback?: SyncJsonObject,
): void {
  const state = useBlossom.getState();
  const mutation = createMutation({
    operation: "profile.upsert",
    entityId: "profile",
    payload: {
      displayName: `${learner.firstName} ${learner.lastName}`.trim(),
      targetLanguage: languageId,
      level: learner.level,
      timezone: localTimezone(),
      preferences: {
        city: learner.city,
        nativeLanguage: learner.nativeLanguage,
        creole: learner.creole,
        goal: learner.goal,
        interests: learner.interests,
        practiceWindow: learner.practiceWindow,
        coach: learner.coach,
        coachVoice: learner.coachVoice,
        avatar: learner.avatar,
        plan,
        warmup,
        exportConsent,
        tandemOpen,
        immersionPhase: state.immersionPhase,
        childMissionDone: state.childMissionDone,
        childWords: state.childWords,
        uiLocale: state.uiLocale,
      },
      ...(rollback ? { rollback } : {}),
    },
  });
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(
        PROFILE_INTENT_KEY,
        JSON.stringify({
          mutationId: mutation.mutationId,
          ownerUserId: mutation.ownerUserId ?? null,
          createdAt: mutation.createdAt,
          displayName: mutation.payload.displayName,
          targetLanguage: mutation.payload.targetLanguage,
          level: mutation.payload.level,
          preferences: {
            city: learner.city,
            nativeLanguage: learner.nativeLanguage,
            creole: learner.creole,
            goal: learner.goal,
            interests: learner.interests,
            practiceWindow: learner.practiceWindow,
            coach: learner.coach,
            coachVoice: learner.coachVoice,
            avatar: learner.avatar,
            uiLocale: state.uiLocale,
          },
        }),
      );
    } catch {
      // The durable outbox remains the source of intent when localStorage is unavailable.
    }
  }
  void enqueueMutation(mutation);
}

export const useBlossom = create<AppState>()(
  persist(
    (set, get) => ({
      hasEntered: false,
      parentMode: false,
      teacherMode: false,
      orgMode: false,
      adminMode: false,
      childMode: false,
      learner: NEW_LEARNER,
      activityLog: [],
      joinedEventIds: [],
      eventRegistrationCounts: {},
      enrolledIds: [],
      assignedSetIds: [],
      bookingStatuses: {},
      pronlabAttempts: [],
      tandemStatus: {},
      tandemOpen: false,
      tandemReports: {},
      homework: [],
      teacherNotes: [],
      learningSubmissions: [],
      warmup: null,
      exportConsent: false,
      vocabulary: [],
      immersionPhase: "pre" as const,
      immersionDone: [],
      plan: "digital" as PlanId,
      childMissionDone: false,
      childWords: [],
      waitlistIds: [],
      languageId: "en",
      uiLocale: "fr",
      missionSessions: {},
      backendMissionRevisions: {},
      syncOwnerUserId: null,
      growthEvents: [],
      mineralSnapshot: computeMinerals([]),
      phonemeLeaves: buildPhonemeLeaves([], PRONLAB_SETS.flatMap((s) => s.items)),
      leoLetters: [],
      enter: () => {
        if (!get().hasEntered) track("onboarding_completed");
        set({ hasEntered: true });
      },
      setParentMode: (value) => set({ parentMode: value, teacherMode: false, orgMode: false, childMode: false }),
      setTeacherMode: (value) => set({ teacherMode: value, parentMode: false, orgMode: false, childMode: false }),
      setOrgMode: (value) => set({ orgMode: value, parentMode: false, teacherMode: false, adminMode: false, childMode: false }),
      setAdminMode: (value) => set({ adminMode: value, parentMode: false, teacherMode: false, orgMode: false, childMode: false }),
      setChildMode: (value) => set({ childMode: value, parentMode: false, teacherMode: false, orgMode: false }),
      updateLearner: (patch) => {
        const current = get();
        const learner = { ...current.learner, ...patch };
        set({ learner });
        voidProfileSync(
          learner,
          current.languageId,
          current.plan,
          current.warmup,
          current.exportConsent,
          current.tandemOpen,
          {
            learner: current.learner,
            languageId: current.languageId,
            plan: current.plan,
            warmup: current.warmup,
            exportConsent: current.exportConsent,
            tandemOpen: current.tandemOpen,
          },
        );
      },
      startMissionRun: (missionId, mode, challenge = "core") => {
        const current = get().missionSessions[missionId] ?? createMissionSession(missionId);
        const next = beginMissionRun(current, mode, challenge);
        const active = activeMissionRun(next);
        if (next === current || !active) return active?.id ?? null;
        const revisions = voidMissionSync(missionId, next, get().backendMissionRevisions);
        set({ missionSessions: { ...get().missionSessions, [missionId]: next }, backendMissionRevisions: revisions });
        if (active) track("mission_mode_selected", { mode, challenge, resumed: current.activeRunId === active.id });
        return active?.id ?? null;
      },
      recordMissionAttempt: (missionId, kind, capture, seconds) => {
        const current = get().missionSessions[missionId];
        if (!current || !activeMissionRun(current)) return false;
        const next = appendMissionAttempt(current, { kind, capture, seconds });
        if (next === current) return false;
        const revisions = voidMissionSync(missionId, next, get().backendMissionRevisions);
        set({ missionSessions: { ...get().missionSessions, [missionId]: next }, backendMissionRevisions: revisions });
        track("mission_attempt_completed", { missionId, kind, capture, seconds: Math.max(0, Math.round(seconds)) });
        return true;
      },
      recordMissionSupport: (missionId) => {
        const current = get().missionSessions[missionId];
        if (!current || !activeMissionRun(current)) return false;
        const next = persistMissionSupport(current);
        if (next === current) return false;
        const revisions = voidMissionSync(missionId, next, get().backendMissionRevisions);
        set({ missionSessions: { ...get().missionSessions, [missionId]: next }, backendMissionRevisions: revisions });
        track("mission_lifeline_used", { missionId });
        return true;
      },
      reopenMissionSession: (missionId) => {
        const current = get().missionSessions[missionId];
        if (!current || !activeMissionRun(current)) return false;
        const next = reopenMissionRun(current);
        if (next === current) return false;
        const revisions = voidMissionSync(missionId, next, get().backendMissionRevisions);
        set({ missionSessions: { ...get().missionSessions, [missionId]: next }, backendMissionRevisions: revisions });
        track("mission_session_reopened", { missionId });
        return true;
      },
      saveMissionReflection: (missionId, reflection) => {
        const current = get().missionSessions[missionId];
        if (!current || !activeMissionRun(current)) return false;
        const next = saveMissionReflection(current, reflection);
        if (next === current) return false;
        const revisions = voidMissionSync(missionId, next, get().backendMissionRevisions);
        set({ missionSessions: { ...get().missionSessions, [missionId]: next }, backendMissionRevisions: revisions });
        const evaluation = evaluateMission(reflection);
        track("mission_reflection_saved", { missionId, outcome: evaluation.outcome, evidence: evaluation.evidenceCount, confidence: reflection.confidence });
        return true;
      },
      completeMissionSession: (missionId, rewardSourceId = null) => {
        const current = get().missionSessions[missionId];
        const active = current ? activeMissionRun(current) : null;
        if (!active?.reflection) return { ok: false, reason: "reflection-required" };
        const evaluation = evaluateMission(active.reflection);
        const finished = finishMissionRun(current!);
        if (finished === current) return { ok: false, reason: "session-not-finishable", evaluation };
        const revisions = voidMissionSync(missionId, finished, get().backendMissionRevisions);
        set({ missionSessions: { ...get().missionSessions, [missionId]: finished }, backendMissionRevisions: revisions });
        const result = rewardSourceId
          ? get().completeActivity(
              "MISSION_COMPLETED",
              rewardSourceId,
              "Evidence " + String(evaluation.evidenceCount) + "/3 · " + evaluation.outcome,
            )
          : { ok: true as const };
        track("mission_session_completed", {
          missionId,
          outcome: evaluation.outcome,
          evidence: evaluation.evidenceCount,
          rewarded: Boolean(rewardSourceId),
        });
        return { ...result, evaluation };
      },
      acceptConfirmedActivity: (event) => {
        const current = get();
        if (hasSource(activeLanguageActivityLog(current.activityLog, current.languageId), event.sourceId ?? "", event.type)) {
          return;
        }
        set({ activityLog: [...current.activityLog, event] });
        get().refreshOrganism();
      },
      completeActivity: (type, sourceId, note, metadata) => {
        const current = get();
        const log = current.activityLog;
        const scopedLog = activeLanguageActivityLog(log, current.languageId);
        if (hasSource(scopedLog, sourceId, type)) return { ok: false, reason: "already" };
        const before = journeySnapshot(scopedLog).stage.id;
        const previousMinerals = computeMinerals(scopedLog);
        const mutation = createMutation({
          operation: "activity.append",
          entityId: sourceId,
          payload: {
            eventType: type,
            sourceId,
            note: note ?? null,
            metadata: { ...(metadata ?? {}), languageId: get().languageId },
            occurredAt: new Date().toISOString(),
          },
        });
        // Optimistic activity is visible locally but must not feed progress
        // or organism derivations until the server confirms it. The sync bridge
        // will replace this pending copy with the server activity on success and
        // remove it on rejection.
        const activityMetadata = {
          ...(metadata ?? {}),
          languageId: current.languageId,
          syncState: "pending" as const,
        };
        const event = {
          id: mutation.mutationId,
          type,
          createdAt: String(mutation.payload.occurredAt),
          sourceId,
          note,
          metadata: activityMetadata,
        };
        const nextLog = [...log, event];
        const ge = growthEventForActivity(type, sourceId, event.createdAt);
        const languageGrowthEvent = ge ? { ...ge, languageId: current.languageId } : null;
        const growthEvents = languageGrowthEvent
          ? pushGrowthEvent(get().growthEvents, languageGrowthEvent)
          : get().growthEvents;
        const mineralSnapshot = computeMinerals(activeLanguageActivityLog(nextLog, current.languageId));
        const phonemeLeaves = buildPhonemeLeaves(
          current.pronlabAttempts,
          setsForLanguage(current.languageId).flatMap((setDef) => setDef.items),
        );
        let leoLetters = get().leoLetters;
        const letter = composeLeoLetter(mineralSnapshot, growthEvents, get().learner.firstName);
        if (!leoLetters.some((l) => l.id === letter.id)) leoLetters = [letter, ...leoLetters].slice(0, 12);
        set({ activityLog: nextLog, growthEvents, mineralSnapshot, phonemeLeaves, leoLetters });
        void enqueueMutation(mutation);
        const after = journeySnapshot(activeLanguageActivityLog(nextLog, current.languageId)).stage.id;
        if (type === "MISSION_COMPLETED") track("mission_completed");
        if (type === "SPEAK_COMPLETED") track("speak_completed");
        if (type === "PRONLAB_COMPLETED") track("pronlab_attempted");
        if (type === "TANDEM_COMPLETED") track("tandem_completed");
        if (type === "IMMERSION_ATTENDED") track("immersion_attended");
        if (type === "EVENT_ATTENDED") track("event_joined");
        if (before !== after) track("blossom_stage_changed", { stage: after });
        return { ok: true, event: ge ?? undefined, previousMinerals, minerals: mineralSnapshot };
      },
      joinEvent: (id) => {
        if (get().joinedEventIds.includes(id)) return;
        const current = get();
        const mutation = createMutation({
          operation: "event.register",
          entityId: id,
          payload: {
            status: "joined",
            rollback: {
              joined: current.joinedEventIds.includes(id),
              count: current.eventRegistrationCounts[id] ?? 0,
            },
          },
        });
        set({
          joinedEventIds: [...get().joinedEventIds, id],
          eventRegistrationCounts: { ...get().eventRegistrationCounts, [id]: (get().eventRegistrationCounts[id] ?? 0) + 1 },
        });
        void enqueueMutation(mutation);
        track("event_joined");
      },
      leaveEvent: (id) => {
        if (!get().joinedEventIds.includes(id)) return;
        const current = get();
        const mutation = createMutation({
          operation: "event.register",
          entityId: id,
          payload: {
            status: "cancelled",
            rollback: {
              joined: true,
              count: current.eventRegistrationCounts[id] ?? 1,
            },
          },
        });
        set({
          joinedEventIds: get().joinedEventIds.filter((x) => x !== id),
          eventRegistrationCounts: { ...get().eventRegistrationCounts, [id]: Math.max(0, (get().eventRegistrationCounts[id] ?? 1) - 1) },
        });
        void enqueueMutation(mutation);
      },
      enroll: (id) => {
        if (get().enrolledIds.includes(id)) return;
        const current = get();
        const mutation = createMutation({
          operation: "booking.request",
          entityId: id,
          payload: {
            catalogueItemId: id,
            rollback: {
              enrolled: current.enrolledIds.includes(id),
              status: current.bookingStatuses[id] ?? null,
            },
          },
        });
        set({
          enrolledIds: [...get().enrolledIds, id],
          bookingStatuses: { ...get().bookingStatuses, [id]: "requested" },
        });
        void enqueueMutation(mutation);
        track("course_enrolled");
      },
      recordPronlabAttempt: (itemId, seconds, evidenceMetadata) => {
        const item = findPronlabItem(itemId);
        if (!item) return null;
        const before = summarisePronlabItem(itemId, get().pronlabAttempts);
        const assessment = typeof evidenceMetadata?.assessment === "string" ? evidenceMetadata.assessment : "capture-only";
        const scoreFromEvidence =
          typeof evidenceMetadata?.score === "number" && Number.isFinite(evidenceMetadata.score)
            ? Math.max(0, Math.min(100, Math.round(evidenceMetadata.score as number)))
            : 0;
        const metadata = {
          ...(evidenceMetadata ?? {}),
          assessment,
          provider: (evidenceMetadata?.provider as string | undefined) ?? (evidenceMetadata?.providerId as string | undefined) ?? "speech-evidence",
        };
        const safeSeconds = Math.round(seconds);
        if (!Number.isFinite(safeSeconds) || safeSeconds <= 0 || safeSeconds > 3600) {
          return null;
        }
        const mutation = createMutation({
          operation: "pronlab.attempt",
          entityId: itemId,
          payload: { itemId, score: scoreFromEvidence, seconds: safeSeconds, tip: item.tip, metadata },
        });
        const attempt: PronlabAttempt = {
          id: mutation.mutationId,
          itemId,
          score: scoreFromEvidence,
          tip: item.tip,
          createdAt: new Date().toISOString(),
          seconds: safeSeconds,
          metadata,
        };
        const nextAttempts = [...get().pronlabAttempts, attempt];
        void enqueueMutation(mutation);
        const phonemeLeaves = buildPhonemeLeaves(nextAttempts, setsForLanguage(get().languageId).flatMap((s) => s.items));
        set({ pronlabAttempts: nextAttempts, phonemeLeaves });
        track("pronlab_attempted", { itemId, assessment, score: scoreFromEvidence, seconds: safeSeconds });
        const after = summarisePronlabItem(itemId, nextAttempts);
        // Mastery is now server-authoritative. Capture-only practice can still
        // shape the local learner state, but it cannot mint a reward event.
        if (before.attemptCount === 0 && after.attemptCount === 1) {
          get().completeActivity("PRONLAB_COMPLETED", `pron-touch-${itemId}`, `Premier passage · ${item.focus || item.phrase}`);
        }
        const setDef = PRONLAB_SETS.find((s) => s.items.some((i) => i.id === itemId));
        if (setDef) {
          const allMastered = setDef.items.every((i) => summarisePronlabItem(i.id, nextAttempts).mastered);
          if (allMastered) {
            get().completeActivity("PRONLAB_COMPLETED", `pronlab-set-${setDef.id}`, `Set complet · ${setDef.title}`);
          }
        }
        return attempt;
      },
      setTandemStatus: (partnerId, status) => {
        const previousStatus = get().tandemStatus[partnerId] ?? null;
        set({ tandemStatus: { ...get().tandemStatus, [partnerId]: status } });
        voidSyncMutation({
          operation: "tandem.status",
          entityId: partnerId,
          payload: { status, metadata: {}, previousStatus },
        });
      },
      setTandemOpen: (value) => {
        const current = get();
        set({ tandemOpen: value });
        voidProfileSync(
          current.learner,
          current.languageId,
          current.plan,
          current.warmup,
          current.exportConsent,
          value,
          { tandemOpen: current.tandemOpen, learner: current.learner },
        );
      },
      reportTandem: (partnerId) => {
        const previousStatus = get().tandemStatus[partnerId];
        const count = (get().tandemReports[partnerId] ?? 0) + 1;
        const mutation = createMutation({
          operation: "tandem.report",
          entityId: partnerId,
          payload: {
            reason: "reported-from-tandem",
            ...(previousStatus ? { previousStatus } : {}),
          },
        });
        set({
          tandemReports: { ...get().tandemReports, [partnerId]: count },
          tandemStatus: { ...get().tandemStatus, [partnerId]: "blocked" },
        });
        void enqueueMutation(mutation);
        return { count, escalated: count >= 3 };
      },
      addTeacherNote: (studentId, tags, text) => {
        const note: TeacherNote = { id: `note-${Date.now()}`, studentId, tags, text, createdAt: new Date().toISOString() };
        set({ teacherNotes: [note, ...get().teacherNotes] });
      },
      saveLearningSubmission: (input) => {
        const now = new Date().toISOString();
        const existing = get().learningSubmissions.find((s) => s.taskId === input.taskId);
        const languageId = get().languageId;
        const submissionResult = {
          ...input.result,
          languageId,
        };
        const mutation = createMutation({
          operation: "learning.submission",
          entityId: input.taskId,
          payload: {
            taskId: input.taskId,
            kind: input.kind,
            content: input.content,
            checks: input.checks,
            result: submissionResult as SyncJsonValue,
            rollback: existing ? { existing: existing as unknown as SyncJsonValue } : { existing: null },
          },
        });
        if (existing) {
          set({
            learningSubmissions: get().learningSubmissions.map((s) =>
              s.taskId === input.taskId ? { ...s, ...input, result: submissionResult, updatedAt: now } : s,
            ),
          });
        } else {
          set({
            learningSubmissions: [
              { ...input, id: mutation.mutationId, result: submissionResult, createdAt: now, updatedAt: now },
              ...get().learningSubmissions,
            ],
          });
        }
        void enqueueMutation(mutation);
      },
      saveWarmup: (text) => {
        set({ warmup: text });
        const current = get();
        voidProfileSync(current.learner, current.languageId, current.plan, text, current.exportConsent, current.tandemOpen, { warmup: get().warmup });
      },
      saveHomeworkDraft: (studentId, title, body) => {
        const now = new Date().toISOString();
        const hw: Homework = { id: `hw-${Date.now()}`, studentId, title, body, status: "draft", createdAt: now, updatedAt: now };
        set({ homework: [hw, ...get().homework] });
      },
      sendHomework: (id) => {
        set({ homework: get().homework.map((h) => (h.id === id ? { ...h, status: "sent", updatedAt: new Date().toISOString() } : h)) });
      },
      completeHomework: (id) => {
        set({ homework: get().homework.map((h) => (h.id === id ? { ...h, status: "done", updatedAt: new Date().toISOString() } : h)) });
      },
      setExportConsent: (value) => {
        set({ exportConsent: value });
        const current = get();
        voidProfileSync(current.learner, current.languageId, current.plan, current.warmup, value, current.tandemOpen, { exportConsent: current.exportConsent });
      },
      saveWord: (word, gloss) => {
        const now = new Date().toISOString();
        const current = get();
        const metadata = { languageId: current.languageId };
        const existing = current.vocabulary.find(
          (v) =>
            v.word.toLowerCase() === word.toLowerCase() &&
            v.metadata?.languageId === current.languageId,
        );
        const mutation = createMutation({
          operation: "vocabulary.upsert",
          entityId: word.toLowerCase(),
          payload: {
            word,
            gloss,
            metadata,
            rollback: existing
              ? { existing: existing as unknown as SyncJsonValue }
              : { existing: null },
          },
        });
        if (existing) {
          set({
            vocabulary: current.vocabulary.map((v) =>
              v === existing ? { ...v, gloss, metadata, updatedAt: now } : v,
            ),
          });
        } else {
          set({
            vocabulary: [
              { word, gloss, metadata, firstSavedAt: now, updatedAt: now },
              ...current.vocabulary,
            ],
          });
        }
        void enqueueMutation(mutation);
      },
      setImmersionPhase: (phase) => set({ immersionPhase: phase }),
      completeChallenge: (id) => {
        if (get().immersionDone.includes(id)) return;
        const mutation = createMutation({
          operation: "challenge.complete",
          entityId: id,
          payload: {},
        });
        set({ immersionDone: [...get().immersionDone, id] });
        void enqueueMutation(mutation);
        get().completeActivity("IMMERSION_ATTENDED", id);
      },
      completeChildMission: () => set({ childMissionDone: true }),
      markChildWord: (id) => {
        if (get().childWords.includes(id)) return;
        set({ childWords: [...get().childWords, id] });
      },
      joinWaitlist: (id) => {
        if (get().waitlistIds.includes(id)) return;
        const current = get();
        const mutation = createMutation({
          operation: "waitlist.request",
          entityId: id,
          payload: {
            itemId: id,
            rollback: { waitlisted: current.waitlistIds.includes(id) },
          },
        });
        set({ waitlistIds: [...get().waitlistIds, id] });
        void enqueueMutation(mutation);
      },
      setLanguage: (id) => {
        if (!isLearnLanguageId(id)) return;
        const current = get();
        const learner = { ...current.learner, targetLanguage: id };
        const phonemeLeaves = buildPhonemeLeaves(
          current.pronlabAttempts,
          setsForLanguage(id).flatMap((setDef) => setDef.items),
        );
        set({ languageId: id, learner, phonemeLeaves });
        // Language changes must immediately rebuild the organism from only the
        // newly active language; otherwise Plant/OSEZ can briefly display stale
        // minerals/growth from the previous learning language.
        get().refreshOrganism();
        voidProfileSync(
          learner,
          id,
          current.plan,
          current.warmup,
          current.exportConsent,
          current.tandemOpen,
          { learner: current.learner, languageId: current.languageId },
        );
        track("language_changed", { languageId: id });
      },
      setUiLocale: (id) => {
        if (!isUiLocaleId(id)) return;
        const current = get();
        set({ uiLocale: id });
        track("ui_locale_changed", { uiLocale: id });
        voidProfileSync(
          current.learner,
          current.languageId,
          current.plan,
          current.warmup,
          current.exportConsent,
          current.tandemOpen,
          { uiLocale: current.uiLocale },
        );
        if (typeof document !== "undefined") {
          const locale = uiLocaleDef(id);
          document.documentElement.lang = locale.bcp47;
          document.documentElement.dir = locale.dir;
        }
      },
      completePulse: (dareId, seconds, offline) => {
        get().completeActivity("PULSE_COMPLETED", dareId, offline ? "offline" : "online", { seconds });
      },
      startLibraryReading: (documentId) => {
        if (!documentId.trim()) return;
        void enqueueMutation(
          createMutation({
            operation: "library.start",
            entityId: documentId,
            payload: {},
          }),
        );
      },
      completeLibraryReading: (documentId) => {
        if (!documentId.trim()) return;
        void enqueueMutation(
          createMutation({
            operation: "library.complete",
            entityId: documentId,
            payload: {},
          }),
        );
      },
      markLeoLetterRead: (id) => {
        set({ leoLetters: get().leoLetters.map((l) => (l.id === id ? { ...l, read: true } : l)) });
      },
      refreshOrganism: () => {
        const current = get();
        const scoped = activeLanguageActivityLog(current.activityLog, current.languageId);
        let growthEvents: GrowthEvent[] = [];
        for (const event of scoped) {
          const growth = growthEventForActivity(event.type, event.sourceId, event.createdAt);
          if (!growth) continue;
          growthEvents = pushGrowthEvent(growthEvents, { ...growth, languageId: current.languageId });
        }
        const mineralSnapshot = computeMinerals(scoped);
        const phonemeLeaves = buildPhonemeLeaves(
          current.pronlabAttempts,
          setsForLanguage(current.languageId).flatMap((setDef) => setDef.items),
        );
        const letter = composeLeoLetter(mineralSnapshot, growthEvents, current.learner.firstName);
        const existing = current.leoLetters.find((item) => item.id === letter.id);
        const leoLetters = growthEvents.length
          ? [{ ...letter, read: existing?.read ?? letter.read }, ...current.leoLetters.filter((item) => item.id !== letter.id)].slice(0, 12)
          : current.leoLetters;
        set({ growthEvents, mineralSnapshot, phonemeLeaves, leoLetters });
      },
      resetJourney: () => {
        set({
          hasEntered: false,
          parentMode: false,
          teacherMode: false,
          orgMode: false,
          adminMode: false,
          childMode: false,
          learner: NEW_LEARNER,
          activityLog: [],
          joinedEventIds: [],
          eventRegistrationCounts: {},
          enrolledIds: [],
          assignedSetIds: [],
          bookingStatuses: {},
          pronlabAttempts: [],
          tandemStatus: {},
          tandemOpen: false,
          tandemReports: {},
          homework: [],
          teacherNotes: [],
          learningSubmissions: [],
          warmup: null,
          exportConsent: false,
          vocabulary: [],
          immersionPhase: "pre",
          immersionDone: [],
          plan: "digital",
          childMissionDone: false,
          childWords: [],
          waitlistIds: [],
          languageId: "en",
          uiLocale: "fr",
          missionSessions: {},
          backendMissionRevisions: {},
          syncOwnerUserId: null,
          growthEvents: [],
          mineralSnapshot: computeMinerals([]),
          phonemeLeaves: buildPhonemeLeaves([], setsForLanguage("en").flatMap((setDef) => setDef.items)),
          leoLetters: [],
        });
      },
    }),
    {
      name: "kosez-blossom-v2",
      onRehydrateStorage: () => () => {
        markBlossomHydrated();
      },
    },
  ),
);

export function useJourney() {
  const activityLog = useBlossom((s) => s.activityLog);
  const languageId = useBlossom((s) => s.languageId);
  return journeySnapshot(activeLanguageActivityLog(activityLog, languageId));
}

export function isSetUnlocked(setId: string, attempts: PronlabAttempt[], assigned: string[]): boolean {
  if (assigned.includes(setId)) return true;
  const def = findPronlabSet(setId);
  if (!def) return false;
  if (!def.unlockAfter) return true;
  const prev = findPronlabSet(def.unlockAfter);
  if (!prev) return true;
  return prev.items.some((item) => summarisePronlabItem(item.id, attempts).attemptCount > 0);
}
