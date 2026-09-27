import { create } from "zustand";
import { isLearnLanguageId, isUiLocaleId, uiLocaleDef, type LearnLanguageId, type UiLocaleId } from "@/lib/i18n/locales";
import { persist } from "zustand/middleware";
import { track } from "@/lib/analytics";
import { createMutation, enqueueMutation } from "./sync-client";
import type { SyncJsonValue } from "./sync-types";
import {
  activityBelongsToLanguage,
  activityLanguageMatches,
  hasSource,
  journeySnapshot,
  summarisePronlabItem,
  type ActivityEvent,
  type ActivityType,
  type PronlabAttempt,
} from "./engine";
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
  isConfirmedActivity,
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
  completeMissionSession: (missionId: string, rewardSourceId?: string | null) => { ok: boolean; reason?: string; pending?: boolean; evaluation?: ReturnType<typeof evaluateMission> };
  completeActivity: (type: ActivityType, sourceId: string, note?: string, metadata?: Record<string, string | number | boolean>) => { ok: boolean; reason?: string; pending?: boolean; event?: GrowthEvent; previousMinerals?: MineralSnapshot; minerals?: MineralSnapshot };
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
): void {
  const state = useBlossom.getState();
  voidSyncMutation({
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
    },
  });
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
        voidProfileSync(learner, current.languageId, current.plan, current.warmup, current.exportConsent, current.tandemOpen);
      },
      startMissionRun: (missionId, mode, challenge = "core") => {
        const existing = get().missionSessions[missionId];
        const current =
          existing && (!existing.languageId || existing.languageId === get().languageId)
            ? { ...existing, languageId: existing.languageId ?? get().languageId }
            : createMissionSession(missionId, get().languageId);
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
      completeActivity: (type, sourceId, note, metadata) => {
        const current = get();
        const log = current.activityLog;
        const scopedLog = activeLanguageActivityLog(log, current.languageId);
        const languageLog = log.filter((event) =>
          activityLanguageMatches(event, current.languageId),
        );
        if (hasSource(languageLog, sourceId, type)) {
          const scopedExisting = scopedLog.some(
            (event) => event.sourceId === sourceId && event.type === type,
          );
          return { ok: false, reason: scopedExisting ? "already" : "pending" };
        }
        const before = journeySnapshot(scopedLog).stage.id;
        const previousMinerals = computeMinerals(scopedLog);
        const mutation = createMutation({
          operation: "activity.append",
          entityId: sourceId,
          payload: {
            eventType: type,
            sourceId,
            note: note ?? null,
            metadata: { ...(metadata ?? {}), languageId: get().languageId, syncState: "pending" },
            occurredAt: new Date().toISOString(),
          },
        });
        const activityMetadata = {
          ...(metadata ?? {}),
          languageId: current.languageId,
          syncState: "pending" as const,
        };
        const event: ActivityEvent = {
          id: mutation.mutationId,
          type,
          createdAt: String(mutation.payload.occurredAt),
          sourceId,
          note,
          metadata: activityMetadata,
        };
        const nextLog = [...log, event];
        // Pending activity is visible to the history layer but is deliberately
        // excluded from points/minerals/stage/growth until the server confirms it.
        const nextConfirmedLog = activeLanguageActivityLog(nextLog, current.languageId);
        const mineralSnapshot = computeMinerals(nextConfirmedLog);
        const phonemeLeaves = buildPhonemeLeaves(
          current.pronlabAttempts,
          setsForLanguage(current.languageId).flatMap((setDef) => setDef.items),
        );
        set({ activityLog: nextLog, mineralSnapshot, phonemeLeaves });
        void enqueueMutation(mutation);
        const after = journeySnapshot(nextConfirmedLog).stage.id;
        if (type === "MISSION_COMPLETED") track("mission_completed_pending");
        if (type === "SPEAK_COMPLETED") track("speak_completed_pending");
        if (type === "PRONLAB_COMPLETED") track("pronlab_attempted_pending");
        if (type === "TANDEM_COMPLETED") track("tandem_completed_pending");
        if (type === "IMMERSION_ATTENDED") track("immersion_attended_pending");
        if (type === "EVENT_ATTENDED") track("event_joined_pending");
        if (before !== after) track("blossom_stage_changed", { stage: after });
        return { ok: true, pending: true, previousMinerals, minerals: mineralSnapshot };
      },
      joinEvent: (id) => {
        if (get().joinedEventIds.includes(id)) return;
        const mutation = createMutation({
          operation: "event.register",
          entityId: id,
          payload: { status: "joined" },
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
        const mutation = createMutation({
          operation: "event.register",
          entityId: id,
          payload: { status: "cancelled" },
        });
        set({
          joinedEventIds: get().joinedEventIds.filter((x) => x !== id),
          eventRegistrationCounts: { ...get().eventRegistrationCounts, [id]: Math.max(0, (get().eventRegistrationCounts[id] ?? 1) - 1) },
        });
        void enqueueMutation(mutation);
      },
      enroll: (id) => {
        if (get().enrolledIds.includes(id)) return;
        const mutation = createMutation({
          operation: "booking.request",
          entityId: id,
          payload: { catalogueItemId: id },
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
          languageId: get().languageId,
          assessment,
          provider: (evidenceMetadata?.provider as string | undefined) ?? (evidenceMetadata?.providerId as string | undefined) ?? "speech-evidence",
        };
        const safeSeconds = Math.max(0, Math.round(seconds));
        if (
          assessment === "skipped" &&
          safeSeconds <= 0 &&
          !String(evidenceMetadata?.transcript ?? "").trim()
        ) {
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
        const previousStatus = get().tandemStatus[partnerId];
        set({ tandemStatus: { ...get().tandemStatus, [partnerId]: status } });
        voidSyncMutation({
          operation: "tandem.status",
          entityId: partnerId,
          payload: {
            status,
            ...(previousStatus ? { previousStatus } : {}),
            metadata: {},
          },
        });
      },
      setTandemOpen: (value) => {
        set({ tandemOpen: value });
        const current = get();
        voidProfileSync(current.learner, current.languageId, current.plan, current.warmup, current.exportConsent, value);
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
        const now = new Date().toISOString();
        const mutation = createMutation({
          operation: "teacher.note",
          entityId: studentId,
          payload: {
            learnerUserId: studentId,
            tags,
            note: text,
          },
        });
        const note: TeacherNote = {
          id: mutation.mutationId,
          studentId,
          tags,
          text,
          createdAt: now,
        };
        set({ teacherNotes: [note, ...get().teacherNotes] });
        void enqueueMutation(mutation);
      },
      saveLearningSubmission: (input) => {
        const now = new Date().toISOString();
        const existing = get().learningSubmissions.find(
          (s) => s.taskId === input.taskId && s.result?.languageId === get().languageId,
        );
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
            ...(existing
              ? { rollback: { existed: true, submission: existing as unknown as SyncJsonValue } }
              : { rollback: { existed: false } }),
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
        voidProfileSync(current.learner, current.languageId, current.plan, text, current.exportConsent, current.tandemOpen);
      },
      saveHomeworkDraft: (studentId, title, body) => {
        const now = new Date().toISOString();
        const mutation = createMutation({
          operation: "teacher.homework",
          entityId: studentId,
          payload: {
            learnerUserId: studentId,
            title,
            body,
            status: "draft",
          },
        });
        const hw: Homework = {
          id: mutation.mutationId,
          studentId,
          title,
          body,
          status: "draft",
          createdAt: now,
          updatedAt: now,
        };
        set({ homework: [hw, ...get().homework] });
        void enqueueMutation(mutation);
      },
      sendHomework: (id) => {
        const current = get().homework.find((h) => h.id === id);
        if (!current) return;
        const now = new Date().toISOString();
        set({
          homework: get().homework.map((h) =>
            h.id === id ? { ...h, status: "sent", updatedAt: now } : h,
          ),
        });
        const mutation = createMutation({
          operation: "teacher.homework",
          entityId: id,
          payload: {
            id,
            learnerUserId: current.studentId,
            title: current.title,
            body: current.body,
            status: "sent",
          },
        });
        void enqueueMutation(mutation);
      },
      completeHomework: (id) => {
        const current = get().homework.find((h) => h.id === id);
        if (!current || current.status === "done") return;
        set({
          homework: get().homework.map((h) =>
            h.id === id ? { ...h, status: "done", updatedAt: new Date().toISOString() } : h,
          ),
        });
        const mutation = createMutation({
          operation: "homework.complete",
          entityId: id,
          payload: { homeworkId: id },
        });
        void enqueueMutation(mutation);
        get().completeActivity("HOMEWORK_COMPLETED", id, "Devoir terminé");
      },
      setExportConsent: (value) => {
        set({ exportConsent: value });
        const current = get();
        voidProfileSync(current.learner, current.languageId, current.plan, current.warmup, value, current.tandemOpen);
      },
      saveWord: (word, gloss) => {
        const now = new Date().toISOString();
        const current = get();
        const metadata = { languageId: current.languageId };
        const mutation = createMutation({
          operation: "vocabulary.upsert",
          entityId: word.toLowerCase(),
          payload: {
            word,
            gloss,
            metadata,
            rollback: existing
              ? {
                  existed: true,
                  word: existing.word,
                  gloss: existing.gloss,
                  firstSavedAt: existing.firstSavedAt ?? now,
                  updatedAt: existing.updatedAt ?? now,
                  metadata: existing.metadata ?? { languageId: current.languageId },
                }
              : { existed: false },
          },
        });
        const existing = current.vocabulary.find(
          (v) => v.word.toLowerCase() === word.toLowerCase() && v.metadata?.languageId === current.languageId,
        );
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
        const mutation = createMutation({
          operation: "waitlist.request",
          entityId: id,
          payload: { itemId: id },
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
        const mineralSnapshot = computeMinerals(
          activeLanguageActivityLog(current.activityLog, id),
        );
        set({ languageId: id, learner, phonemeLeaves, mineralSnapshot });
        voidProfileSync(learner, id, current.plan, current.warmup, current.exportConsent, current.tandemOpen);
        track("language_changed", { languageId: id });
      },
      setUiLocale: (id) => {
        if (!isUiLocaleId(id)) return;
        const current = get();
        set({ uiLocale: id });
        track("ui_locale_changed", { uiLocale: id });
        voidProfileSync(current.learner, current.languageId, current.plan, current.warmup, current.exportConsent, current.tandemOpen);
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
        const confirmedActivity = current.activityLog
          .filter(isConfirmedActivity)
          .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
        const rebuiltGrowth = confirmedActivity.reduce<GrowthEvent[]>(
          (events, event) => {
            const growth = growthEventForActivity(
              event.type,
              event.sourceId,
              event.createdAt,
            );
            if (!growth) return events;
            const tagged = event.metadata?.languageId;
            return pushGrowthEvent(events, {
              ...growth,
              languageId: typeof tagged === "string" ? tagged : "en",
            });
          },
          [],
        );
        const mineralSnapshot = computeMinerals(
          activeLanguageActivityLog(current.activityLog, current.languageId),
        );
        const phonemeLeaves = buildPhonemeLeaves(
          current.pronlabAttempts,
          setsForLanguage(current.languageId).flatMap((setDef) => setDef.items),
        );
        let leoLetters = current.leoLetters;
        const latestLetter = composeLeoLetter(
          mineralSnapshot,
          rebuiltGrowth,
          current.learner.firstName,
        );
        if (!leoLetters.some((letter) => letter.id === latestLetter.id)) {
          leoLetters = [latestLetter, ...leoLetters].slice(0, 12);
        }
        set({
          growthEvents: rebuiltGrowth,
          mineralSnapshot,
          phonemeLeaves,
          leoLetters,
        });
      },
      resetJourney: () => {
        set({
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
    { name: "kosez-blossom-v2" },
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
