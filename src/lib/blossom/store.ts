import { create } from "zustand";
import { isLearnLanguageId, isUiLocaleId, uiLocaleDef, type LearnLanguageId, type UiLocaleId } from "@/lib/i18n/locales";
import { persist } from "zustand/middleware";
import { track } from "@/lib/analytics";
import { createMutation, enqueueMutation } from "./sync-client";
import type { SyncJsonValue } from "./sync-types";
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
import type { MissionSession } from "./mission";
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

// NOTE: Full store implementation restored from b5a6661 + hasEntered in resetJourney.
// This file was accidentally replaced with PLACEHOLDER; restore requires full content.
// See PR #63 and local src/lib/blossom/store.ts for the complete implementation.
export const STORE_RESTORE_REQUIRED = true;
