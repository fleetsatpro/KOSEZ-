import type { ActivityEvent, PronlabAttempt } from "./engine";

function daysAgo(days: number, hour = 12): string {
  const date = new Date("2026-08-30T12:00:00.000Z");
  date.setUTCDate(date.getUTCDate() - days);
  date.setUTCHours(hour, 10, 0, 0);
  return date.toISOString();
}

export const LEARNER = {
  firstName: "Camille",
  lastName: "Morel",
  city: "Saint-Pierre",
  avatar: "/images/camille.jpg",
  nativeLanguage: "Français",
  creole: "Créole réunionnais",
  targetLanguage: "English",
  level: "A2",
  goal: "Parler anglais au travail et en voyage, sans basculer vers le français.",
  interests: ["Cuisine", "Océan", "Musique"],
  practiceWindow: "12:00 – 13:00",
  coach: "Léo",
  coachVoice: "Posé, précis, jamais infantilisant.",
} as const;

export const INITIAL_LOG: ActivityEvent[] = [
  { id: "a1", type: "MISSION_COMPLETED", createdAt: daysAgo(18), sourceId: "m-hist-1" },
  { id: "a2", type: "MISSION_COMPLETED", createdAt: daysAgo(16), sourceId: "m-hist-2" },
  { id: "a3", type: "MISSION_COMPLETED", createdAt: daysAgo(14), sourceId: "m-hist-3" },
  { id: "a4", type: "MISSION_COMPLETED", createdAt: daysAgo(11), sourceId: "m-hist-4" },
  { id: "a5", type: "SPEAK_COMPLETED", createdAt: daysAgo(9, 18), sourceId: "speak-cafe-hist" },
  { id: "a6", type: "MISSION_COMPLETED", createdAt: daysAgo(8), sourceId: "m-hist-5" },
  { id: "a7", type: "MISSION_COMPLETED", createdAt: daysAgo(6), sourceId: "m-hist-6" },
  { id: "a8", type: "MISSION_COMPLETED", createdAt: daysAgo(4), sourceId: "m-hist-7" },
  { id: "a9", type: "MISSION_COMPLETED", createdAt: daysAgo(2), sourceId: "m-hist-8" },
];

export const INITIAL_PRONLAB_ATTEMPTS: PronlabAttempt[] = [
  { id: "pa1", itemId: "th-1", score: 48, tip: "Pas un S.", createdAt: daysAgo(5, 12), seconds: 2 },
  { id: "pa2", itemId: "th-1", score: 54, tip: "Le souffle y est presque.", createdAt: daysAgo(3, 12), seconds: 3 },
  { id: "pa3", itemId: "pl-1", score: 71, tip: "Bill encore un peu trop tenu.", createdAt: daysAgo(4, 13), seconds: 4 },
  { id: "pa4", itemId: "pl-1", score: 79, tip: "Le could est plus doux.", createdAt: daysAgo(2, 13), seconds: 3 },
  { id: "pa5", itemId: "pl-1", score: 86, tip: "Vous y êtes.", createdAt: daysAgo(1, 13), seconds: 3 },
];
