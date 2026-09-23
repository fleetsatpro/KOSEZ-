/**
 * Shared daily mission selection — Home Focus and Mission Theatre
 * use the same Réunion-anchored bank rotation.
 */
import {
  B1_TODAY_MISSION,
  TODAY_MISSION,
  UPCOMING_MISSIONS,
  missionForLevel,
  type Mission,
} from "./data.ts";
import { EXTRA_MISSIONS, selectMissionForLevel } from "./mission-bank.ts";

const BANK: Mission[] = [
  TODAY_MISSION,
  B1_TODAY_MISSION,
  ...UPCOMING_MISSIONS,
  ...EXTRA_MISSIONS,
];

export function todayMissionForLevel(level: string): Mission {
  return selectMissionForLevel(level, BANK, missionForLevel(level), {
    rotate: true,
  });
}

export function missionBankAll(): Mission[] {
  return BANK;
}
