import type { ActivityEvent, ActivityType, PronlabAttempt } from "./engine";
import type { LearningSubmission } from "./store";
import { summarisePronlabItem, PRONLAB_SETS } from "./engine";
import type { ScheduledReviewItem, ReviewPlan } from "./review-scheduler";
import { LEARNING_DOMAINS, type LearningDomainId } from "./learning-os";

export type LearningEvidenceKind =
  | "mission"
  | "speaking"
  | "listening"
  | "grammar"
  | "writing"
  | "pronunciation"
  | "vocabulary"
  | "review"
  | "tandem";

export type LearningEvidence = {
  domainId: LearningDomainId;
  kind: LearningEvidenceKind;
  createdAt: string;
  direct: boolean;
  label: string;
};

export type DomainIntelligence = {
  domainId: LearningDomainId;
  coverage: number;
  evidenceCount: number;
  directEvidenceCount: number;
  recencyDays: number | null;
  lastSeenAt: string | null;
  signal: "fresh" | "active" | "fading" | "unmeasured";
};

export type LearningIntelligence = {
  domains: DomainIntelligence[];
  activeDays14: number;
  activeDays30: number;
  momentum: number;
  breadth: number;
  friction: number;
  dueNow: number;
  highPriorityDue: number;
  next: {
    eyebrow: string;
    title: string;
    body: string;
    kind: "pronlab" | "mission" | "library" | "review" | "labs";
    reasons: string[];
  };
};

const DAY_MS = 86_400_000;

function daysAgo(now: string, createdAt: string): number {
  return Math.max(0, Math.floor((new Date(now).getTime() - new Date(createdAt).getTime()) / DAY_MS));
}

function recencyWeight(age: number): number {
  if (age <= 3) return 1;
  if (age <= 7) return 0.85;
  if (age <= 14) return 0.65;
  if (age <= 30) return 0.4;
  return 0.18;
}

function uniqueDays(dates: string[], now: string, horizon: number): number {
  return new Set(
    dates
      .filter((date) => daysAgo(now, date) <= horizon)
      .map((date) => date.slice(0, 10)),
  ).size;
}

function activityEvidence(event: ActivityEvent): LearningEvidence[] {
  const map: Partial<Record<ActivityType, { kind: LearningEvidenceKind; domains: LearningDomainId[]; direct: boolean; label: string }>> = {
    MISSION_COMPLETED: { kind: "mission", domains: ["interaction", "speaking"], direct: true, label: "Mission terrain" },
    SPEAK_COMPLETED: { kind: "speaking", domains: ["speaking", "interaction"], direct: true, label: "Pratique de parole" },
    PRONLAB_COMPLETED: { kind: "pronunciation", domains: ["pronunciation"], direct: true, label: "Pron'Lab terminé" },
    PRONLAB_MASTERY: { kind: "pronunciation", domains: ["pronunciation"], direct: true, label: "Maîtrise Pron'Lab" },
    LISTENING_COMPLETED: { kind: "listening", domains: ["listening"], direct: true, label: "Lab d'écoute" },
    GRAMMAR_COMPLETED: { kind: "grammar", domains: ["grammar"], direct: true, label: "Lab de grammaire" },
    WRITING_COMPLETED: { kind: "writing", domains: ["writing"], direct: true, label: "Lab d'écriture" },
    TANDEM_COMPLETED: { kind: "tandem", domains: ["interaction", "speaking", "mediation"], direct: true, label: "Tandem" },
    REVIEW_COMPLETED: { kind: "review", domains: ["vocabulary", "pronunciation", "grammar"], direct: false, label: "Révision" },
    CLASS_ATTENDED: { kind: "mission", domains: ["speaking", "listening"], direct: false, label: "Cours" },
    EVENT_ATTENDED: { kind: "mission", domains: ["speaking", "interaction"], direct: false, label: "Événement" },
    REAL_WORLD_BONUS: { kind: "mission", domains: ["speaking", "interaction"], direct: true, label: "Geste terrain" },
    HOMEWORK_COMPLETED: { kind: "writing", domains: ["writing"], direct: true, label: "Devoir" },
    IMMERSION_ATTENDED: { kind: "mission", domains: ["speaking", "listening", "interaction"], direct: false, label: "Immersion" },
    DIAGNOSTIC_COMPLETED: { kind: "review", domains: ["speaking", "listening", "writing", "grammar", "interaction"], direct: false, label: "Repère" },
  };
  const entry = map[event.type];
  if (!entry) return [];
  return entry.domains.map((domainId) => ({
    domainId,
    kind: entry.kind,
    createdAt: event.createdAt,
    direct: entry.direct,
    label: entry.label,
  }));
}

function submissionEvidence(submission: LearningSubmission): LearningEvidence[] {
  const domains: Record<LearningSubmission["kind"], LearningDomainId[]> = {
    grammar: ["grammar"],
    listening: ["listening"],
    writing: ["writing"],
    review: ["vocabulary", "pronunciation", "grammar"],
  };
  const kind: LearningEvidenceKind = submission.kind === "writing"
    ? "writing"
    : submission.kind === "listening"
      ? "listening"
      : submission.kind === "grammar"
        ? "grammar"
        : "review";
  return domains[submission.kind].map((domainId) => ({
    domainId,
    kind,
    createdAt: submission.createdAt,
    direct: submission.kind !== "review",
    label: `Trace · ${kind}`,
  }));
}

function pronunciationEvidence(attempts: PronlabAttempt[]): LearningEvidence[] {
  return attempts.map((attempt) => ({
    domainId: "pronunciation",
    kind: "pronunciation",
    createdAt: attempt.createdAt,
    direct: true,
    label: `Pron'Lab · ${attempt.itemId}`,
  }));
}

function vocabularyEvidence(
  vocabulary: Array<{ word: string; gloss: string; firstSavedAt?: string; updatedAt?: string }>,
): LearningEvidence[] {
  return vocabulary.map((word) => ({
    domainId: "vocabulary",
    kind: "vocabulary",
    createdAt: word.updatedAt ?? word.firstSavedAt ?? "1970-01-01T00:00:00.000Z",
    direct: false,
    label: "Mot sauvegardé",
  }));
}

export function collectLearningEvidence(
  log: ActivityEvent[],
  attempts: PronlabAttempt[],
  submissions: LearningSubmission[],
  vocabulary: Array<{ word: string; gloss: string }>,
): LearningEvidence[] {
  return [
    ...log.flatMap(activityEvidence),
    ...submissions.flatMap(submissionEvidence),
    ...pronunciationEvidence(attempts),
    ...vocabularyEvidence(vocabulary),
  ].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function domainSignal(
  domainId: LearningDomainId,
  evidence: LearningEvidence[],
  now: string,
): DomainIntelligence {
  const relevant = evidence.filter((item) => item.domainId === domainId);
  if (!relevant.length) {
    return {
      domainId,
      coverage: 0,
      evidenceCount: 0,
      directEvidenceCount: 0,
      recencyDays: null,
      lastSeenAt: null,
      signal: "unmeasured",
    };
  }

  const weighted = relevant.reduce((total, item) => total + recencyWeight(daysAgo(now, item.createdAt)), 0);
  const direct = relevant.filter((item) => item.direct).length;
  const coverage = Math.max(
    1,
    Math.min(
      100,
      Math.round(weighted * 16 + Math.min(20, direct * 3)),
    ),
  );
  const lastSeenAt = relevant[0]!.createdAt;
  const age = daysAgo(now, lastSeenAt);
  return {
    domainId,
    coverage,
    evidenceCount: relevant.length,
    directEvidenceCount: direct,
    recencyDays: age,
    lastSeenAt,
    signal: age <= 3 ? "fresh" : age <= 14 ? "active" : "fading",
  };
}

function recommendation(
  domains: DomainIntelligence[],
  evidence: LearningEvidence[],
  plan: ReviewPlan,
  submissions: LearningSubmission[],
  now: string,
): LearningIntelligence["next"] {
  const urgent = plan.due.find((item) => item.priority === "haute");
  if (urgent) {
    return {
      eyebrow: "PRIORITÉ · MÉMOIRE",
      title: urgent.title,
      body: urgent.reason,
      kind: "review",
      reasons: [
        "Le système a identifié une révision due.",
        `${urgent.intervalDays} jour(s) depuis le dernier intervalle planifié.`,
      ],
    };
  }

  const due = plan.due[0];
  if (due) {
    return {
      eyebrow: "À FAIRE · MAINTENANT",
      title: due.title,
      body: due.reason,
      kind: "review",
      reasons: [
        `${plan.due.length} rappel(s) sont dus aujourd'hui.`,
        due.kind === "pronunciation" ? "La trace vient directement de Pron'Lab." : "Le rappel s'appuie sur votre historique.",
      ],
    };
  }

  const writing = domains.find((item) => item.domainId === "writing");
  if (!writing || writing.evidenceCount === 0) {
    return {
      eyebrow: "ANGLE MORT · ÉCRIT",
      title: "Créer votre première trace écrite",
      body: "Votre profil ne contient pas encore de preuve directe en production écrite.",
      kind: "labs",
      reasons: [
        "Aucune production écrite enregistrée.",
        "Un lab de quelques minutes suffit pour créer cette première preuve.",
      ],
    };
  }

  const fading = [...domains]
    .filter((item) => item.recencyDays !== null)
    .sort((a, b) => (b.recencyDays ?? 0) - (a.recencyDays ?? 0))[0];

  if (fading && (fading.recencyDays ?? 0) >= 15) {
    const label = LEARNING_DOMAINS.find((domain) => domain.id === fading.domainId)?.shortLabel ?? "compétence";
    return {
      eyebrow: "SIGNAL · À RAVIVER",
      title: `Revenir à « ${label} »`,
      body: "Cette branche a des traces, mais elles commencent à dater.",
      kind: fading.domainId === "pronunciation" ? "pronlab" : "labs",
      reasons: [
        `Dernière preuve il y a ${fading.recencyDays} jours.`,
        "Raviver une compétence évite que la progression repose uniquement sur les nouveautés.",
      ],
    };
  }

  const recentMission = evidence.some(
    (item) =>
      item.kind === "mission" &&
      daysAgo(now, item.createdAt) <= 5,
  );
  if (!recentMission) {
    return {
      eyebrow: "MONDE RÉEL · PROCHAIN PAS",
      title: "Remettre la langue dehors",
      body: "Votre historique récent contient peu de preuves situées dans une vraie interaction.",
      kind: "mission",
      reasons: [
        "Aucune preuve de mission récente.",
        "Une courte scène terrain crée une trace plus riche qu'une suite de quiz.",
      ],
    };
  }

  const freshest = [...domains].sort((a, b) => a.coverage - b.coverage)[0];
  const label = freshest ? LEARNING_DOMAINS.find((domain) => domain.id === freshest.domainId)?.shortLabel : "une compétence";
  return {
    eyebrow: "PROCHAINE ACTION",
    title: `Approfondir « ${label} »`,
    body: "Votre profil est assez nourri pour passer de l'exposition à une pratique plus ciblée.",
    kind: "labs",
    reasons: [
      `${domains.filter((domain) => domain.evidenceCount > 0).length}/${domains.length} domaines ont déjà des traces.`,
      "La prochaine valeur vient maintenant d'une preuve plus précise.",
    ],
  };
}

export function buildLearningIntelligence(
  log: ActivityEvent[],
  attempts: PronlabAttempt[],
  vocabulary: Array<{ word: string; gloss: string }>,
  submissions: LearningSubmission[],
  plan: ReviewPlan,
  now = new Date().toISOString(),
): LearningIntelligence {
  const evidence = collectLearningEvidence(log, attempts, submissions, vocabulary);
  const domains = LEARNING_DOMAINS.map((domain) => domainSignal(domain.id, evidence, now));
  const dates = evidence
    .filter((item) => item.kind !== "vocabulary")
    .map((item) => item.createdAt);
  const activeDays14 = uniqueDays(dates, now, 14);
  const activeDays30 = uniqueDays(dates, now, 30);
  const momentum = Math.round(Math.min(100, (activeDays14 / 14) * 100));
  const breadth = Math.round((domains.filter((domain) => domain.evidenceCount > 0).length / Math.max(1, domains.length)) * 100);
  const friction = submissions.filter(
    (submission) => submission.kind === "review" && (
      submission.result.correct === false ||
      submission.checks.includes("again")
    ),
  ).length + PRONLAB_SETS.flatMap((set) => set.items).filter((item) => summarisePronlabItem(item.id, attempts).struggling).length;

  const highPriorityDue = plan.due.filter((item) => item.priority === "haute").length;
  return {
    domains,
    activeDays14,
    activeDays30,
    momentum,
    breadth,
    friction,
    dueNow: plan.due.length,
    highPriorityDue,
    next: recommendation(domains, evidence, plan, submissions, now),
  };
}

export function domainLabel(domainId: LearningDomainId): string {
  return LEARNING_DOMAINS.find((domain) => domain.id === domainId)?.label ?? domainId;
}
