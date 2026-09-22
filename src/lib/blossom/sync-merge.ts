import {
  activeMissionRun,
  type MissionRun,
  type MissionSession,
} from "./mission";
import type { BackendMission } from "./sync-types";

function timestamp(value: string | null | undefined): number {
  const parsed = Date.parse(value ?? "");
  return Number.isFinite(parsed) ? parsed : 0;
}

function mergeRun(a: MissionRun, b: MissionRun): MissionRun {
  const newer = timestamp(b.lastUpdatedAt) >= timestamp(a.lastUpdatedAt) ? b : a;
  const attempts = new Map(a.attempts.map((attempt) => [attempt.id, attempt]));
  for (const attempt of b.attempts) attempts.set(attempt.id, attempt);

  return {
    ...a,
    ...b,
    mode: newer.mode,
    challenge: newer.challenge,
    startedAt:
      timestamp(a.startedAt) === 0 || timestamp(b.startedAt) < timestamp(a.startedAt)
        ? a.startedAt
        : b.startedAt,
    lastUpdatedAt: newer.lastUpdatedAt,
    attempts: [...attempts.values()].sort(
      (left, right) => timestamp(left.endedAt) - timestamp(right.endedAt),
    ),
    reflection: newer.reflection ?? a.reflection ?? b.reflection,
    completedAt:
      a.completedAt && b.completedAt
        ? timestamp(a.completedAt) >= timestamp(b.completedAt)
          ? a.completedAt
          : b.completedAt
        : a.completedAt ?? b.completedAt,
    supportUsed: Boolean(a.supportUsed || b.supportUsed),
  };
}

export function mergeMissionSessions(
  local: MissionSession | null,
  remote: BackendMission,
): MissionSession {
  const remoteSession = remote.session as MissionSession;
  if (!local) return remoteSession;

  const byId = new Map(local.runs.map((run) => [run.id, run]));
  for (const remoteRun of remoteSession.runs) {
    const localRun = byId.get(remoteRun.id);
    byId.set(
      remoteRun.id,
      localRun ? mergeRun(localRun, remoteRun) : remoteRun,
    );
  }

  const runs = [...byId.values()].sort(
    (a, b) => timestamp(a.startedAt) - timestamp(b.startedAt),
  );
  const candidates = runs.filter((run) => run.id === local.activeRunId || run.id === remoteSession.activeRunId);
  const active = candidates.sort(
    (a, b) => timestamp(b.lastUpdatedAt) - timestamp(a.lastUpdatedAt),
  )[0];

  return {
    missionId: remoteSession.missionId,
    runs,
    activeRunId: active?.id ?? remoteSession.activeRunId ?? local.activeRunId,
  };
}

export function latestRun(session: MissionSession | null): MissionRun | null {
  if (!session) return null;
  return [...session.runs].sort(
    (a, b) => timestamp(b.lastUpdatedAt) - timestamp(a.lastUpdatedAt),
  )[0] ?? activeMissionRun(session);
}
