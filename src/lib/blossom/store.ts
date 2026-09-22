import { create } from "zustand";
import { persist } from "zustand/middleware";
import { track } from "@/lib/analytics";
import { createMutation, enqueueMutation } from "./sync-client";
import type { SyncJsonValue } from "./sync-types";
import {
  hasSource,
  journeySnapshot,
    summarisePronlabItem,
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
  INITIAL_LOG,
  INITIAL_PRONLAB_ATTEMPTS,
  LEARNER,
  PRONLAB_SETS,
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

export type LearnerProfile = typeof LEARNER;

export type TandemStatus = "suggested" | "pending" | "accepted" | "blocked" | "paused";

export type Homework = {
  id: string;
  studentId: string;
  title: string;
  body: string;
  status: "draft" | "sent" | "done";
  createdAt: string;
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
  childMode: boolean;
  learner: LearnerProfile;
  activityLog: typeof INITIAL_LOG;
  joinedEventIds: string[];
  enrolledIds: string[];
  pronlabAttempts: PronlabAttempt[];
  assignedSetIds: string[];
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
  }[];
  immersionPhase: "pre" | "during" | "post";
  immersionDone: string[];
  plan: PlanId;
  proofClaimed: boolean;
  childMissionDone: boolean;
  childWords: string[];
  waitlistIds: string[];
  orgInvites: number;
  invoiceRequested: boolean;
  languageId: string;
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
  setChildMode: (value: boolean) => void;
  setPlan: (plan: PlanId) => void;
  claimProof: () => void;
  updateLearner: (patch: Partial<LearnerProfile>) => void;
  startMissionRun: (missionId: string, mode: MissionMode, challenge?: MissionChallenge) => string | null;
  recordMissionAttempt: (
    missionId: string,
    kind: "warmup" | "mission",
    capture: MissionCapture,
    seconds: number,
  ) => boolean;
  recordMissionSupport: (missionId: string) => boolean;
  saveMissionReflection: (
    missionId: string,
    reflection: MissionReflection,
  ) => boolean;
  reopenMissionSession: (missionId: string) => boolean;
  completeMissionSession: (missionId: string) => {
    ok: boolean;
    reason?: string;
    evaluation?: ReturnType<typeof evaluateMission>;
  };
  completeActivity: (
    type: ActivityType,
    sourceId: string,
    note?: string,
  ) => { ok: boolean; reason?: string };
  joinEvent: (id: string) => void;
  leaveEvent: (id: string) => void;
  enroll: (id: string) => void;
  recordPronlabAttempt: (itemId: string, seconds: number) => PronlabAttempt | null;
  assignSet: (setId: string) => void;
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
  inviteOrgSeat: () => { ok: boolean };
  requestInvoice: () => void;
  setLanguage: (id: string) => void;
  completePulse: (dareId: string, seconds: number, offline: boolean) => void;
  markLeoLetterRead: (id: string) => void;
  refreshOrganism: () => void;
  resetJourney: () => void;
};

function queueSyncMutation(input: Parameters<typeof createMutation>[0]): void {
  void enqueueMutation(createMutation(input));
}

function queueMissionSync(
  missionId: string,
  session: MissionSession,
  currentRevisions: Record<string, number>,
): Record<string, number> {
  const expectedRevision = currentRevisions[missionId] ?? 0;
  queueSyncMutation({
    operation: "mission.save",
    entityId: missionId,
    expectedRevision,
    payload: {
      session: session as unknown as SyncJsonValue,
    },
  });
  return {
    ...currentRevisions,
    [missionId]: expectedRevision + 1,
  };
}

function localTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

function queueProfileSync(
  learner: LearnerProfile,
  languageId: string,
  plan: PlanId,
  warmup: string | null,
  exportConsent: boolean,
): void {
  queueSyncMutation({
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
      childMode: false,
      learner: LEARNER,
      activityLog: INITIAL_LOG,
      joinedEventIds: [],
      enrolledIds: ["cat-a2"],
      pronlabAttempts: INITIAL_PRONLAB_ATTEMPTS,
      assignedSetIds: [],
      tandemStatus: {},
      tandemOpen: true,
      tandemReports: {},
      homework: [],
      teacherNotes: [],
      learningSubmissions: [],
      warmup: null,
      exportConsent: false,
      vocabulary: [],
      immersionPhase: "pre",
      immersionDone: [],
      plan: "centre",
      proofClaimed: false,
      childMissionDone: false,
      childWords: [],
      waitlistIds: [],
      orgInvites: 0,
      invoiceRequested: false,
      languageId: "en",
      missionSessions: {},
      backendMissionRevisions: {},
      syncOwnerUserId: null,
      growthEvents: [],
      mineralSnapshot: computeMinerals(INITIAL_LOG),
      phonemeLeaves: buildPhonemeLeaves(
        INITIAL_PRONLAB_ATTEMPTS,
        PRONLAB_SETS.flatMap((s) => s.items),
      ),
      leoLetters: [],
      enter: () => {
        if (!get().hasEntered) track("onboarding_completed");
        set({ hasEntered: true });
      },
      setParentMode: (value) =>
        set({ parentMode: value, teacherMode: false, orgMode: false, childMode: false }),
      setTeacherMode: (value) =>
        set({ teacherMode: value, parentMode: false, orgMode: false, childMode: false }),
      setOrgMode: (value) =>
        set({ orgMode: value, parentMode: false, teacherMode: false, childMode: false }),
      setChildMode: (value) =>
        set({ childMode: value, parentMode: false, teacherMode: false, orgMode: false }),
      setPlan: (plan) => {
        const current = get();
        set({ plan });
        queueProfileSync(
          current.learner,
          current.languageId,
          plan,
          current.warmup,
          current.exportConsent,
        );
        track("plan_selected", { plan });
      },
      claimProof: () => set({ proofClaimed: true }),
      updateLearner: (patch) => {
        const current = get();
        const learner = { ...current.learner, ...patch };
        set({ learner });
        queueProfileSync(
          learner,
          current.languageId,
          current.plan,
          current.warmup,
          current.exportConsent,
        );
      },
      startMissionRun: (missionId, mode, challenge = "core") => {
        const current =
          get().missionSessions[missionId] ?? createMissionSession(missionId);
        const next = beginMissionRun(current, mode, challenge);
        const active = activeMissionRun(next);
        if (next === current || !active) {
          return active?.id ?? null;
        }
        const revisions = queueMissionSync(
          missionId,
          next,
          get().backendMissionRevisions,
        );
        set({
          missionSessions: {
            ...get().missionSessions,
            [missionId]: next,
          },
          backendMissionRevisions: revisions,
        });
        if (active) {
          track("mission_mode_selected", { mode, challenge, resumed: current.activeRunId === active.id });
        }
        return active?.id ?? null;
      },
      recordMissionAttempt: (missionId, kind, capture, seconds) => {
        const current = get().missionSessions[missionId];
        if (!current || !activeMissionRun(current)) return false;
        const next = appendMissionAttempt(current, {
          kind,
          capture,
          seconds,
        });
        if (next === current) return false;
        const revisions = queueMissionSync(
          missionId,
          next,
          get().backendMissionRevisions,
        );
        set({
          missionSessions: {
            ...get().missionSessions,
            [missionId]: next,
          },
          backendMissionRevisions: revisions,
        });
        track("mission_attempt_completed", {
          missionId,
          kind,
          capture,
          seconds: Math.max(0, Math.round(seconds)),
        });
        return true;
      },
      recordMissionSupport: (missionId) => {
        const current = get().missionSessions[missionId];
        if (!current || !activeMissionRun(current)) return false;
        const next = persistMissionSupport(current);
        if (next === current) return false;
        const revisions = queueMissionSync(
          missionId,
          next,
          get().backendMissionRevisions,
        );
        set({
          missionSessions: {
            ...get().missionSessions,
            [missionId]: next,
          },
          backendMissionRevisions: revisions,
        });
        track("mission_lifeline_used", { missionId });
        return true;
      },
      reopenMissionSession: (missionId) => {
        const current = get().missionSessions[missionId];
        if (!current || !activeMissionRun(current)) return false;
        const next = reopenMissionRun(current);
        if (next === current) return false;
        const revisions = queueMissionSync(
          missionId,
          next,
          get().backendMissionRevisions,
        );
        set({
          missionSessions: {
            ...get().missionSessions,
            [missionId]: next,
          },
          backendMissionRevisions: revisions,
        });
        track("mission_session_reopened", { missionId });
        return true;
      },
      saveMissionReflection: (missionId, reflection) => {
        const current = get().missionSessions[missionId];
        if (!current || !activeMissionRun(current)) return false;
        const next = saveMissionReflection(current, reflection);
        if (next === current) return false;
        const revisions = queueMissionSync(
          missionId,
          next,
          get().backendMissionRevisions,
        );
        set({
          missionSessions: {
            ...get().missionSessions,
            [missionId]: next,
          },
          backendMissionRevisions: revisions,
        });
        const evaluation = evaluateMission(reflection);
        track("mission_reflection_saved", {
          missionId,
          outcome: evaluation.outcome,
          evidence: evaluation.evidenceCount,
          confidence: reflection.confidence,
        });
        return true;
      },
      completeMissionSession: (missionId) => {
        const current = get().missionSessions[missionId];
        const active = current ? activeMissionRun(current) : null;
        if (!active?.reflection) {
          return { ok: false, reason: "reflection-required" };
        }

        const evaluation = evaluateMission(active.reflection);
        const finished = finishMissionRun(current!);
        if (finished === current) {
          return { ok: false, reason: "session-not-finishable", evaluation };
        }

        const revisions = queueMissionSync(
          missionId,
          finished,
          get().backendMissionRevisions,
        );
        set({
          missionSessions: {
            ...get().missionSessions,
            [missionId]: finished,
          },
          backendMissionRevisions: revisions,
        });

        const result = get().completeActivity(
          "MISSION_COMPLETED",
          missionId,
          "Evidence " +
            String(evaluation.evidenceCount) +
            "/3 · " +
            evaluation.outcome,
        );
        track("mission_session_completed", {
          missionId,
          outcome: evaluation.outcome,
          evidence: evaluation.evidenceCount,
        });
        return { ...result, evaluation };
      },
      completeActivity: (type, sourceId, note) => {
        const log = get().activityLog;
        if (hasSource(log, sourceId)) {
          return { ok: false, reason: "already" };
        }
        const before = journeySnapshot(log).stage.id;
        const mutation = createMutation({
          operation: "activity.append",
          entityId: sourceId,
          payload: {
            eventType: type,
            sourceId,
            note: note ?? null,
            occurredAt: new Date().toISOString(),
          },
        });
        const event = {
          id: mutation.mutationId,
          type,
          createdAt: String(mutation.payload.occurredAt),
          sourceId,
          note,
        };
        const nextLog = [...log, event];
        const ge = growthEventForActivity(type, sourceId, event.createdAt);
        const growthEvents = ge
          ? pushGrowthEvent(get().growthEvents, ge)
          : get().growthEvents;
        const mineralSnapshot = computeMinerals(nextLog);
        const phonemeLeaves = buildPhonemeLeaves(
          get().pronlabAttempts,
          PRONLAB_SETS.flatMap((s) => s.items),
        );
        let leoLetters = get().leoLetters;
        const letter = composeLeoLetter(
          mineralSnapshot,
          growthEvents,
          get().learner.firstName,
        );
        if (!leoLetters.some((l) => l.id === letter.id)) {
          leoLetters = [letter, ...leoLetters].slice(0, 12);
        }
        set({
          activityLog: nextLog,
          growthEvents,
          mineralSnapshot,
          phonemeLeaves,
          leoLetters,
        });
        void enqueueMutation(mutation);
        const after = journeySnapshot(nextLog).stage.id;
        if (type === "MISSION_COMPLETED") track("mission_completed");
        if (type === "SPEAK_COMPLETED") track("speak_completed");
        if (type === "PRONLAB_COMPLETED") track("pronlab_attempted");
        if (type === "TANDEM_COMPLETED") track("tandem_completed");
        if (type === "IMMERSION_ATTENDED") track("immersion_attended");
        if (type === "EVENT_ATTENDED") track("event_joined");
        if (before !== after) track("blossom_stage_changed", { stage: after });
        return { ok: true };
      },
      joinEvent: (id) => {
        if (get().joinedEventIds.includes(id)) return;
        set({ joinedEventIds: [...get().joinedEventIds, id] });
        queueSyncMutation({
          operation: "event.register",
          entityId: id,
          payload: { status: "joined" },
        });
        track("event_joined");
      },
      leaveEvent: (id) => {
        set({
          joinedEventIds: get().joinedEventIds.filter((item) => item !== id),
        });
        queueSyncMutation({
          operation: "event.register",
          entityId: id,
          payload: { status: "cancelled" },
        });
      },
      enroll: (id) => {
        if (get().enrolledIds.includes(id)) return;
        set({ enrolledIds: [...get().enrolledIds, id] });
        track("booking_created");
      },
      recordPronlabAttempt: (itemId, seconds) => {
        const item = findPronlabItem(itemId);
        if (!item) return null;
        const prior = get().pronlabAttempts.filter((a) => a.itemId === itemId);
        const before = summarisePronlabItem(itemId, get().pronlabAttempts);
        const score = 0;
        const metadata = {
          assessment: "capture-only",
          provider: "unavailable",
        };
        const mutation = createMutation({
          operation: "pronlab.attempt",
          entityId: itemId,
          payload: {
            itemId,
            score,
            seconds: Math.max(0, Math.round(seconds)),
            tip: item.tip,
            metadata,
          },
        });
        const attempt: PronlabAttempt = {
          id: mutation.mutationId,
          itemId,
          score,
          tip: item.tip,
          createdAt: new Date().toISOString(),
          seconds: Math.max(0, Math.round(seconds)),
          metadata,
        };
        const nextAttempts = [...get().pronlabAttempts, attempt];
        void enqueueMutation(mutation);
        set({ pronlabAttempts: nextAttempts });
        track("pronlab_attempted");
        const after = summarisePronlabItem(itemId, nextAttempts);
        if (!before.mastered && after.mastered) {
          get().completeActivity("PRONLAB_MASTERY", `mastery-${itemId}`);
        }
        const setDef = PRONLAB_SETS.find((s) =>
          s.items.some((i) => i.id === itemId),
        );
        if (setDef) {
          const allMastered = setDef.items.every(
            (i) => summarisePronlabItem(i.id, nextAttempts).attemptCount > 0,
          );
          if (allMastered) {
            get().completeActivity("PRONLAB_COMPLETED", `pronlab-${setDef.id}`);
          }
        }
        return attempt;
      },
      assignSet: (setId) => {
        if (get().assignedSetIds.includes(setId)) return;
        set({ assignedSetIds: [...get().assignedSetIds, setId] });
      },
      setTandemStatus: (partnerId, status) => {
        set({
          tandemStatus: { ...get().tandemStatus, [partnerId]: status },
        });
        queueSyncMutation({
          operation: "tandem.status",
          entityId: partnerId,
          payload: { status, metadata: {} },
        });
      },
      setTandemOpen: (value) => set({ tandemOpen: value }),
      reportTandem: (partnerId) => {
        const count = (get().tandemReports[partnerId] ?? 0) + 1;
        set({
          tandemReports: { ...get().tandemReports, [partnerId]: count },
          tandemStatus: { ...get().tandemStatus, [partnerId]: "blocked" },
        });
        return { count, escalated: count >= 2 };
      },
      saveLearningSubmission: (input) => {
        const mutation = createMutation({
          operation: "learning.submission",
          entityId: input.taskId,
          payload: {
            taskId: input.taskId,
            kind: input.kind,
            content: input.content,
            checks: input.checks,
            result: input.result as SyncJsonValue,
          },
        });
        const now = new Date().toISOString();
        const submission: LearningSubmission = {
          ...input,
          id: mutation.mutationId,
          createdAt: now,
          updatedAt: now,
        };
        set({
          learningSubmissions: [...get().learningSubmissions.filter((item) => item.id !== submission.id), submission],
        });
        void enqueueMutation(mutation);
      },
      addTeacherNote: (studentId, tags, text) => {
        const note: TeacherNote = {
          id: `note-${Date.now()}`,
          studentId,
          tags,
          text,
          createdAt: new Date().toISOString(),
        };
        set({ teacherNotes: [...get().teacherNotes, note] });
      },
      saveWarmup: (text) => {
        const current = get();
        set({ warmup: text });
        queueProfileSync(
          current.learner,
          current.languageId,
          current.plan,
          text,
          current.exportConsent,
        );
      },
      saveHomeworkDraft: (studentId, title, body) => {
        const existing = get().homework.find(
          (h) => h.studentId === studentId && h.status === "draft",
        );
        if (existing) {
          set({
            homework: get().homework.map((h) =>
              h.id === existing.id ? { ...h, title, body } : h,
            ),
          });
          return;
        }
        set({
          homework: [
            ...get().homework,
            {
              id: `hw-${Date.now()}`,
              studentId,
              title,
              body,
              status: "draft",
              createdAt: new Date().toISOString(),
            },
          ],
        });
      },
      sendHomework: (id) => {
        set({
          homework: get().homework.map((h) =>
            h.id === id ? { ...h, status: "sent" as const } : h,
          ),
        });
      },
      completeHomework: (id) => {
        const item = get().homework.find((h) => h.id === id);
        if (!item || item.status === "done") return;
        set({
          homework: get().homework.map((h) =>
            h.id === id ? { ...h, status: "done" as const } : h,
          ),
        });
        get().completeActivity("HOMEWORK_COMPLETED", `hw-${item.id}`);
      },
      setExportConsent: (value) => {
        const current = get();
        set({ exportConsent: value });
        queueProfileSync(
          current.learner,
          current.languageId,
          current.plan,
          current.warmup,
          value,
        );
      },
      saveWord: (word, gloss) => {
        const key = word.toLowerCase();
        if (get().vocabulary.some((v) => v.word === key)) return;
        const now = new Date().toISOString();
        set({
          vocabulary: [
            ...get().vocabulary,
            { word: key, gloss, firstSavedAt: now, updatedAt: now },
          ],
        });
        queueSyncMutation({
          operation: "vocabulary.upsert",
          entityId: key,
          payload: { word: key, gloss, metadata: {} },
        });
      },
      setImmersionPhase: (phase) => set({ immersionPhase: phase }),
      completeChallenge: (id) => {
        if (get().immersionDone.includes(id)) return;
        set({ immersionDone: [...get().immersionDone, id] });
        queueSyncMutation({
          operation: "challenge.complete",
          entityId: id,
          payload: {},
        });
      },
      completeChildMission: () => set({ childMissionDone: true }),
      markChildWord: (id) => {
        if (get().childWords.includes(id)) return;
        set({ childWords: [...get().childWords, id] });
      },
      joinWaitlist: (id) => {
        if (get().waitlistIds.includes(id)) return;
        set({ waitlistIds: [...get().waitlistIds, id] });
        track("immersion_waitlist", { id });
      },
      inviteOrgSeat: () => {
        const used = 6 + get().orgInvites;
        if (used >= 8) return { ok: false };
        set({ orgInvites: get().orgInvites + 1 });
        return { ok: true };
      },
      requestInvoice: () => set({ invoiceRequested: true }),
      setLanguage: (id) => {
        const current = get();
        set({ languageId: id });
        queueProfileSync(
          current.learner,
          id,
          current.plan,
          current.warmup,
          current.exportConsent,
        );
      },
      completePulse: (dareId, seconds, offline) => {
        get().completeActivity(
          "SPEAK_COMPLETED",
          `pulse-${dareId}`,
          offline ? "pulse-offline" : `pulse-${Math.max(0, Math.round(seconds))}s`,
        );
      },
      markLeoLetterRead: (id) =>
        set({
          leoLetters: get().leoLetters.map((l) =>
            l.id === id ? { ...l, read: true } : l,
          ),
        }),
      refreshOrganism: () => {
        const log = get().activityLog;
        const attempts = get().pronlabAttempts;
        const items = PRONLAB_SETS.flatMap((s) => s.items);
        set({
          mineralSnapshot: computeMinerals(log),
          phonemeLeaves: buildPhonemeLeaves(attempts, items),
        });
      },
      resetJourney: () =>
        set({
          learner: LEARNER,
          syncOwnerUserId: null,
          activityLog: INITIAL_LOG,
          joinedEventIds: [],
          enrolledIds: ["cat-a2"],
          parentMode: false,
          teacherMode: false,
          childMode: false,
          pronlabAttempts: INITIAL_PRONLAB_ATTEMPTS,
          assignedSetIds: [],
          tandemStatus: {},
          tandemOpen: true,
          tandemReports: {},
          homework: [],
          teacherNotes: [],
          learningSubmissions: [],
          warmup: null,
          exportConsent: false,
          vocabulary: [],
          immersionPhase: "pre",
          immersionDone: [],
          orgMode: false,
          plan: "centre",
          proofClaimed: false,
          childMissionDone: false,
          childWords: [],
          waitlistIds: [],
          orgInvites: 0,
          invoiceRequested: false,
          languageId: "en",
          missionSessions: {},
          backendMissionRevisions: {},
          growthEvents: [],
          mineralSnapshot: computeMinerals(INITIAL_LOG),
          phonemeLeaves: buildPhonemeLeaves(
            INITIAL_PRONLAB_ATTEMPTS,
            PRONLAB_SETS.flatMap((s) => s.items),
          ),
          leoLetters: [],
        }),
    }),
    {
      name: "kosez-blossom-v2",
      merge: (persisted, current) => ({
        ...current,
        ...(persisted as object),
      }),
    },
  ),
);

export function useJourney() {
  const log = useBlossom((s) => s.activityLog);
  return journeySnapshot(log);
}

export function isSetUnlocked(
  setId: string,
  attempts: PronlabAttempt[],
  assigned: string[],
): boolean {
  const def = findPronlabSet(setId);
  if (!def) return false;
  if (assigned.includes(setId)) return true;
  if (!def.unlockAfter) return true;
  const prev = findPronlabSet(def.unlockAfter);
  if (!prev) return true;
  return prev.items.some(
    (item) => summarisePronlabItem(item.id, attempts).attemptCount > 0,
  );
}
