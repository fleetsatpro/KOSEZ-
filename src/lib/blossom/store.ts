import { create } from "zustand";
import { persist } from "zustand/middleware";
// EMERGENCY: file was corrupted during large push. Full restore in progress.
export const useBlossom = create(() => ({}));
export function isSetUnlocked() { return true; }
export function useJourney() { return { stage: { id: "seed", label: "Graine" }, points: 0, progress: 0, remaining: 16 }; }
