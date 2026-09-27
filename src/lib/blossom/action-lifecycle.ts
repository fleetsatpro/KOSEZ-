/**
 * Shared domain state machine for learner actions that can produce evidence/reward.
 *
 * Distinct phases — never collapse these into ad-hoc booleans:
 * - PRACTICE_ONLY: local practice, no server session, never reward-eligible
 * - SERVER_SESSION_STARTED: server created an authoritative session
 * - ACTIVE: learner is performing the action
 * - SERVER_VERIFIED: server accepted end/completion of the session
 * - REWARD_PENDING: client has submitted reward evidence, awaiting durable accept
 * - REWARD_CONFIRMED: durable evidence accepted
 * - FAILED / ABANDONED: terminal non-reward outcomes
 */

export type ActionLifecyclePhase =
  | "idle"
  | "practice_only"
  | "server_session_started"
  | "active"
  | "server_verified"
  | "reward_pending"
  | "reward_confirmed"
  | "failed"
  | "abandoned";

export type ActionLifecycle = {
  phase: ActionLifecyclePhase;
  serverSessionId: string | null;
  practiceOnly: boolean;
  errorMessage: string | null;
  /** True only after durable reward acceptance — gates GrowthCeremony. */
  mayShowGrowthCeremony: boolean;
  /** True when UI may claim "la terre s'en souvient" / stem growth. */
  mayClaimReward: boolean;
};

export function idleLifecycle(): ActionLifecycle {
  return {
    phase: "idle",
    serverSessionId: null,
    practiceOnly: false,
    errorMessage: null,
    mayShowGrowthCeremony: false,
    mayClaimReward: false,
  };
}

export function beginPracticeOnly(): ActionLifecycle {
  return {
    phase: "practice_only",
    serverSessionId: null,
    practiceOnly: true,
    errorMessage: null,
    mayShowGrowthCeremony: false,
    mayClaimReward: false,
  };
}

export function beginServerSession(sessionId: string): ActionLifecycle {
  return {
    phase: "server_session_started",
    serverSessionId: sessionId,
    practiceOnly: false,
    errorMessage: null,
    mayShowGrowthCeremony: false,
    mayClaimReward: false,
  };
}

export function markActive(prev: ActionLifecycle): ActionLifecycle {
  if (prev.phase === "practice_only") {
    return { ...prev, phase: "active" };
  }
  if (prev.phase === "server_session_started" || prev.phase === "active") {
    return { ...prev, phase: "active" };
  }
  return prev;
}

export function markServerVerified(prev: ActionLifecycle): ActionLifecycle {
  if (!prev.serverSessionId || prev.practiceOnly) {
    return {
      ...prev,
      phase: "failed",
      errorMessage: "Session serveur absente — aucune croissance possible.",
      mayShowGrowthCeremony: false,
      mayClaimReward: false,
    };
  }
  return {
    ...prev,
    phase: "server_verified",
    errorMessage: null,
  };
}

export function markRewardPending(prev: ActionLifecycle): ActionLifecycle {
  if (prev.phase !== "server_verified") {
    return {
      ...prev,
      phase: "failed",
      errorMessage: "Récompense demandée avant validation serveur.",
      mayShowGrowthCeremony: false,
      mayClaimReward: false,
    };
  }
  return {
    ...prev,
    phase: "reward_pending",
  };
}

export function markRewardConfirmed(prev: ActionLifecycle): ActionLifecycle {
  if (prev.phase !== "reward_pending" && prev.phase !== "server_verified") {
    return {
      ...prev,
      phase: "failed",
      errorMessage: "Confirmation de récompense hors cycle.",
      mayShowGrowthCeremony: false,
      mayClaimReward: false,
    };
  }
  return {
    ...prev,
    phase: "reward_confirmed",
    mayShowGrowthCeremony: true,
    mayClaimReward: true,
    errorMessage: null,
  };
}

export function markFailed(prev: ActionLifecycle, message: string): ActionLifecycle {
  return {
    ...prev,
    phase: "failed",
    errorMessage: message,
    mayShowGrowthCeremony: false,
    mayClaimReward: false,
  };
}

export function markAbandoned(prev: ActionLifecycle): ActionLifecycle {
  return {
    ...prev,
    phase: "abandoned",
    mayShowGrowthCeremony: false,
    mayClaimReward: false,
  };
}

/** Human-facing status line for learner UI (French default). */
export function lifecycleStatusCopy(life: ActionLifecycle): string {
  switch (life.phase) {
    case "idle":
      return "Prêt.";
    case "practice_only":
      return "Mode pratique — ne compte pas encore pour la croissance.";
    case "server_session_started":
    case "active":
      return "Session en cours.";
    case "server_verified":
      return "Validation serveur confirmée.";
    case "reward_pending":
      return "En attente de synchronisation.";
    case "reward_confirmed":
      return "Votre geste est enregistré.";
    case "failed":
      return life.errorMessage ?? "Échec — réessayez.";
    case "abandoned":
      return "Session abandonnée.";
    default:
      return "";
  }
}
