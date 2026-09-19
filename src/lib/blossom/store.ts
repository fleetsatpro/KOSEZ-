import { create } from "zustand";
import { persist } from "zustand/middleware";
import { track } from "@/lib/analytics";
import {
  hasSource,
  journeySnapshot,
  scoreAttempt,
  summarisePronlabItem,
  type ActivityType,
  type PronlabAttempt,
} from "./engine";
import {
  findPronlabItem,
  findPronlabSet,
  INITIAL_LOG,
  INITIAL_PRONLAB_ATTEMPTS,
  LEARNER,
  PRONLAB_SETS,
  type PlanId,
} from "./data";

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
  warmup: string | null;
  exportConsent: boolean;
  vocabulary: { word: string; gloss: string }[];
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
  enter: () => void;
  setParentMode: (value: boolean) => void;
  setTeacherMode: (value: boolean) => void;
  setOrgMode: (value: boolean) => void;
  setChildMode: (value: boolean) => void;
  setPlan: (plan: PlanId) => void;
  claimProof: () => void;
  updateLearner: (patch: Partial<LearnerProfile>) => void;
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
  resetJourney: () => void;
};

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
        set({ plan });
        track("plan_selected", { plan });
      },
      claimProof: () => set({ proofClaimed: true }),
      updateLearner: (patch) =>
        set({ learner: { ...get().learner, ...patch } }),
      completeActivity: (type, sourceId, note) => {
        const log = get().activityLog;
        if (hasSource(log, sourceId)) {
          return { ok: false, reason: "already" };
        }
        const before = journeySnapshot(log).stage.id;
        const event = {
          id: `evt-${Date.now()}`,
          type,
          createdAt: new Date().toISOString(),
          sourceId,
          note,
        };
        const nextLog = [...log, event];
        set({ activityLog: nextLog });
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
        track("event_joined");
      },
      leaveEvent: (id) =>
        set({
          joinedEventIds: get().joinedEventIds.filter((item) => item !== id),
        }),
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
        const score = scoreAttempt(itemId, prior.length, seconds);
        const attempt: PronlabAttempt = {
          id: `pa-${Date.now()}`,
          itemId,
          score,
          tip: item.tip,
          createdAt: new Date().toISOString(),
          seconds,
        };
        const nextAttempts = [...get().pronlabAttempts, attempt];
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
      setTandemStatus: (partnerId, status) =>
        set({
          tandemStatus: { ...get().tandemStatus, [partnerId]: status },
        }),
      setTandemOpen: (value) => set({ tandemOpen: value }),
      reportTandem: (partnerId) => {
        const count = (get().tandemReports[partnerId] ?? 0) + 1;
        set({
          tandemReports: { ...get().tandemReports, [partnerId]: count },
          tandemStatus: { ...get().tandemStatus, [partnerId]: "blocked" },
        });
        return { count, escalated: count >= 2 };
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
      saveWarmup: (text) => set({ warmup: text }),
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
      setExportConsent: (value) => set({ exportConsent: value }),
      saveWord: (word, gloss) => {
        const key = word.toLowerCase();
        if (get().vocabulary.some((v) => v.word === key)) return;
        set({
          vocabulary: [...get().vocabulary, { word: key, gloss }],
        });
      },
      setImmersionPhase: (phase) => set({ immersionPhase: phase }),
      completeChallenge: (id) => {
        if (get().immersionDone.includes(id)) return;
        set({ immersionDone: [...get().immersionDone, id] });
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
      setLanguage: (id) => set({ languageId: id }),
      resetJourney: () =>
        set({
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
