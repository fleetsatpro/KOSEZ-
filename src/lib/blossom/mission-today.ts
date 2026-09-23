/**
 * Single source of truth for "today's Focus" mission selection.
 * Home, Welcome, Mission Theatre, Plant door all share this.
 * Deterministic daily rotation via mission-bank + learner level.
 */
import {
  B1_TODAY_MISSION,
  missionForLevel,
  TODAY_MISSION,
  UPCOMING_MISSIONS,
  type Mission,
} from "./data.ts";
import { EXTRA_MISSIONS, selectMissionForLevel } from "./mission-bank.ts";

const CORE_BANK: Mission[] = [
  TODAY_MISSION,
  B1_TODAY_MISSION,
  ...UPCOMING_MISSIONS,
  ...EXTRA_MISSIONS,
];

/** Full bank used for daily Focus rotation. */
export function fullMissionBank(): Mission[] {
  return CORE_BANK;
}

/**
 * Today's mission for a learner level.
 * Always rotates by UTC day + band so Home / Theatre / Welcome stay in lockstep.
 */
export function todayMissionForLevel(
  level: string,
  options?: { dayKey?: string },
): Mission {
  return selectMissionForLevel(
    level,
    CORE_BANK,
    missionForLevel(level),
    { rotate: true, dayKey: options?.dayKey },
  );
}
