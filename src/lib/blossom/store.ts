import { create } from "zustand";
import { persist } from "zustand/middleware";
import { track } from "@/lib/analytics";
import { createMutation, enqueueMutation } from "./sync-client";
import type { SyncJsonValue } from "./sync-types";
import {
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

// NOTE: Full store body temporarily truncated during emergency restore.
// See commit 89b5bf5 for complete implementation.
// This stub prevents total import failure while full restore is applied.

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
  vocabulary: { word: string; gloss: string; firstSavedAt?: string; updatedAt?: string }[];
  immersionPhase: "pre" | "during" | "post";
  immersionDone: string[];
  plan: PlanId;
  childMissionDone: boolean;
  childWords: string[];
  waitlistIds: string[];
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
  setAdminMode: (value: boolean) => void;
  setChildMode: (value: boolean) => void;
  updateLearner: (patch: Partial<LearnerProfile>) => void;
  startMissionRun: (missionId: string, mode: MissionMode, challenge?: MissionChallenge) => string | null;
  recordMissionAttempt: (missionId: string, kind: "warmup" | "mission", capture: MissionCapture, seconds: number) => boolean;
  recordMissionSupport: (missionId: string) => boolean;
  saveMissionReflection: (missionId: string, reflection: MissionReflection) => boolean;
  reopenMissionSession: (missionId: string) => boolean;
  completeMissionSession: (missionId: string) => { ok: boolean; reason?: string; evaluation?: ReturnType<typeof evaluateMission> };
  completeActivity: (type: ActivityType, sourceId: string, note?: string, metadata?: Record<string, string | number | boolean>) => { ok: boolean; reason?: string; event?: GrowthEvent; previousMinerals?: MineralSnapshot; minerals?: MineralSnapshot };
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
  setLanguage: (id: string) => void;
  completePulse: (dareId: string, seconds: number, offline: boolean) => void;
  markLeoLetterRead: (id: string) => void;
  refreshOrganism: () => void;
  resetJourney: () => void;
};

const emptyMinerals = (): MineralSnapshot => ({
  at: new Date().toISOString(),
  mission: 0,
  parole: 0,
  pron: 0,
  social: 0,
  atelier: 0,
});

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
      immersionPhase: "pre",
      immersionDone: [],
      plan: "digital",
      childMissionDone: false,
      childWords: [],
      waitlistIds: [],
      languageId: "en",
      missionSessions: {},
      backendMissionRevisions: {},
      syncOwnerUserId: null,
      growthEvents: [],
      mineralSnapshot: emptyMinerals(),
      phonemeLeaves: [],
      leoLetters: [],
      enter: () => set({ hasEntered: true }),
      setParentMode: (value) => set({ parentMode: value }),
      setTeacherMode: (value) => set({ teacherMode: value }),
      setOrgMode: (value) => set({ orgMode: value }),
      setAdminMode: (value) => set({ adminMode: value }),
      setChildMode: (value) => set({ childMode: value }),
      updateLearner: (patch) => set({ learner: { ...get().learner, ...patch } }),
      startMissionRun: () => null,
      recordMissionAttempt: () => false,
      recordMissionSupport: () => false,
      saveMissionReflection: () => false,
      reopenMissionSession: () => false,
      completeMissionSession: () => ({ ok: false, reason: "store-restore-pending" }),
      completeActivity: () => ({ ok: false, reason: "store-restore-pending" }),
      joinEvent: () => {},
      leaveEvent: () => {},
      enroll: () => {},
      recordPronlabAttempt: () => null,
      setTandemStatus: () => {},
      setTandemOpen: () => {},
      reportTandem: () => ({ count: 0, escalated: false }),
      addTeacherNote: () => {},
      saveLearningSubmission: () => {},
      saveWarmup: () => {},
      saveHomeworkDraft: () => {},
      sendHomework: () => {},
      completeHomework: () => {},
      setExportConsent: () => {},
      saveWord: () => {},
      setImmersionPhase: () => {},
      completeChallenge: () => {},
      completeChildMission: () => {},
      markChildWord: () => {},
      joinWaitlist: () => {},
      setLanguage: () => {},
      completePulse: () => {},
      markLeoLetterRead: () => {},
      refreshOrganism: () => {},
      resetJourney: () => {},
    }),
    { name: "kosez-blossom" },
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
  if (assigned.includes(setId)) return true;
  const def = findPronlabSet(setId);
  if (!def) return false;
  if (!def.unlockAfter) return true;
  const prev = findPronlabSet(def.unlockAfter);
  if (!prev) return true;
  return prev.items.some(
    (item) => summarisePronlabItem(item.id, attempts).attemptCount > 0,
  );
}
