import type { ActivityEvent, ActivityType, PronlabAttempt } from "./engine.ts";
import type { LearningSubmission } from "./store.ts";
import { summarisePronlabItem } from "./engine.ts";
import { PRONLAB_SETS } from "./data.ts";
import type { ReviewPlan } from "./review-scheduler.ts";
import {
  CAN_DO_OBJECTIVES,
  CURRICULUM_UNITS,
  LEARNING_DOMAINS,
  curriculumResource,
  type LearningDomainId,
} from "./learning-os.ts";

export type LearningEvidenceKind =
  | "mission"
  | "speaking"
  | "listening"
  | "grammar"
  | "writing"
  | "pronunciation"
  | "vocabulary"
  | "review"
  | "tandem"
  | "lesson"
  | "reading";

export type LearningEvidence = {
  domainId: LearningDomainId;
  kind: LearningEvidenceKind;
  createdAt: string;
  direct: boolean;
  label: string;
  freshnessKnown: boolean;
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
    labKind?: "grammar" | "listening" | "writing";
    targetId?: string;
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
    LIBRARY_COMPLETED: { kind: "reading", domains: ["reading", "vocabulary"], direct: true, label: "Lecture comprise" },
  };

  if (event.type === "LESSON_COMPLETED") {
    const lesson = CURRICULUM_UNITS
      .flatMap((unit) => unit.lessons)
      .find((candidate) => candidate.id === event.sourceId);
    if (!lesson) return [];

    const domains = [
      ...new Set(
        lesson.objectiveIds
          .map((id) => CAN_DO_OBJECTIVES.find((objective) => objective.id === id)?.domain)
          .filter((id): id is LearningDomainId => Boolean(id)),
      ),
    ];
    return domains.map((domainId) => ({
      domainId,
      kind: "lesson" as const,
      createdAt: event.createdAt,
      direct: false,
      label: "Pratique du parcours",
      freshnessKnown: true,
    }));
  }

  const entry = map[event.type];
  if (!entry) return [];
  return entry.domains.map((domainId) => ({
    domainId,
    kind: entry.kind,
    createdAt: event.createdAt,
    direct: entry.direct,
    label: entry.label,
    freshnessKnown: true,
  }));
}

function submissionEvidence(submission: LearningSubmission): LearningEvidence[] {
  const domains: Record<LearningSubmission["kind"], LearningDomainId[]> = {
    grammar: ["grammar"],
    listening: ["listening"],
    writing: ["writing"],
    reading: ["reading", "vocabulary"],
    review: ["vocabulary", "pronunciation", "grammar"],
  };
  const kind: LearningEvidenceKind =
    submission.kind === "writing"
      ? "writing"
      : submission.kind === "listening"
        ? "listening"
        : submission.kind === "grammar"
          ? "grammar"
          : submission.kind === "reading"
            ? "reading"
            : "review";
  return domains[submission.kind].map((domainId) => ({
    domainId,
    kind,
    createdAt: submission.createdAt,
    direct: submission.kind !== "review",
    label: `Trace · ${kind}`,
    freshnessKnown: true,
  }));
}

function pronunciationEvidence(attempts: PronlabAttempt[]): LearningEvidence[] {
  return attempts.map((attempt) => ({
    domainId: "pronunciation",
    kind: "pronunciation",
    createdAt: attempt.createdAt,
    direct: true,
    label: `Pron'Lab · ${attempt.itemId}`,
    freshnessKnown: true,
  }));
}

function vocabularyEvidence(
  vocabulary: Array<{ word: string; gloss: string; firstSavedAt?: string; updatedAt?: string }>,
): LearningEvidence[] {
  return vocabulary.map((word) => ({
    domainId: "vocabulary",
    kind: "vocabulary",
    createdAt: word.updatedAt ?? word.firstSavedAt ?? new Date().toISOString(),
    direct: false,
    label: "Mot sauvegardé",
    freshnessKnown: Boolean(word.updatedAt || word.firstSavedAt),
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
  const timed = relevant.filter((item) => item.freshnessKnown);
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

  const weighted = timed.reduce((total, item) => total + recencyWeight(daysAgo(now, item.createdAt)), 0) || Math.min(1, relevant.length * 0.25);
  const direct = relevant.filter((item) => item.direct).length;
  const coverage = Math.max(
    1,
    Math.min(
      100,
      Math.round(weighted * 16 + Math.min(20, direct * 3)),
    ),
  );
  const lastSeenAt = timed[0]?.createdAt ?? null;
  const age = lastSeenAt ? daysAgo(now, lastSeenAt) : null;
  return {
    domainId,
    coverage,
    evidenceCount: relevant.length,
    directEvidenceCount: direct,
    recencyDays: age,
    lastSeenAt,
    signal: age === null ? "active" : age <= 3 ? "fresh" : age <= 14 ? "active" : "fading",
  };
}

function resourceForDomain(domainId: LearningDomainId): {
  kind: "pronlab" | "mission" | "library" | "labs";
  targetId?: string;
  labKind?: "grammar" | "listening" | "writing";
} | null {
  for (const unit of CURRICULUM_UNITS) {
    for (const lesson of unit.lessons) {
      const matches = lesson.objectiveIds.some(
        (id) => CAN_DO_OBJECTIVES.find((objective) => objective.id === id)?.domain === domainId,
      );
      if (!matches) continue;
      const resource = curriculumResource(lesson);
      switch (resource.kind) {
        case "pronlab":
        case "mission":
        case "library":
          return { kind: resource.kind, targetId: resource.id };
        case "grammar":
        case "listening":
        case "writing":
          return { kind: "labs", targetId: resource.id, labKind: resource.kind };
        case "review":
          continue;
        case "speak":
          return { kind: "mission", targetId: undefined };
      }
    }
  }
  return null;
}

function recommendation(
  domains: DomainIntelligence[],
  evidence: LearningEvidence[],
  plan: ReviewPlan,
  now: string,
): LearningIntelligence["next"] {
  const urgent = plan.due.find((item) => item.priority === "haute");
  if (urgent) {
    return {
      eyebrow: "PRIORITÉ · MÉMOIRE",
      title: urgent.title,
      body: urgent.reason,
      kind: "review",
      targetId: urgent.sourceKey,
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
      targetId: due.sourceKey,
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
      labKind: "writing",
      targetId: "write-after-class",
      reasons: [
        "Aucune production écrite enregistrée.",
        "Un lab d’écriture de quelques minutes suffit pour créer cette première preuve.",
      ],
    };
  }

  const fading = [...domains]
    .filter((item) => item.recencyDays !== null)
    .sort((a, b) => (b.recencyDays ?? 0) - (a.recencyDays ?? 0))[0];

  if (fading && (fading.recencyDays ?? 0) >= 15) {
    const label = LEARNING_DOMAINS.find((domain) => domain.id === fading.domainId)?.shortLabel ?? "compétence";
    const target = resourceForDomain(fading.domainId);
    return {
      eyebrow: "SIGNAL · À RAVIVER",
      title: `Revenir à « ${label} »`,
      body: "Cette branche a des traces, mais elles commencent à dater.",
      kind: target?.kind ?? (
        fading.domainId === "pronunciation"
          ? "pronlab"
          : fading.domainId === "reading"
            ? "library"
            : fading.domainId === "speaking" ||
                fading.domainId === "interaction" ||
                fading.domainId === "mediation"
              ? "mission"
              : "labs"
      ),
      targetId: target?.targetId,
      labKind: target?.labKind,
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
    ...(freshest ? (resourceForDomain(freshest.domainId) ?? {
      kind:
        freshest.domainId === "pronunciation"
          ? "pronlab"
          : freshest.domainId === "reading"
            ? "library"
            : freshest.domainId === "speaking" ||
                freshest.domainId === "interaction" ||
                freshest.domainId === "mediation"
              ? "mission"
              : "labs",
        labKind:
          freshest.domainId === "grammar"
            ? "grammar"
            : freshest.domainId === "listening"
              ? "listening"
              : freshest.domainId === "writing"
                ? "writing"
                : undefined,
      }) : {
      kind: "labs" as const,
    }),
    reasons: [
      domains.filter((domain) => domain.evidenceCount > 0).length +
        "/" +
        domains.length +
        " domaines ont déjà des traces.",
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
    .filter((item) => item.kind !== "vocabulary" && item.freshnessKnown)
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
    next: recommendation(domains, evidence, plan, now),
  };
}

export type WeeklyLearningBrief = {
  activeDays: number;
  evidenceCount: number;
  directEvidenceCount: number;
  reviewsAttempted: number;
  reviewAccuracy: number | null;
  strongestDomain: { id: LearningDomainId; label: string; evidenceCount: number } | null;
  topFocus: { id: LearningDomainId; label: string; recencyDays: number | null } | null;
  headline: string;
  highlights: string[];
};

export function buildWeeklyLearningBrief(
  log: ActivityEvent[],
  attempts: PronlabAttempt[],
  vocabulary: Array<{ word: string; gloss: string; firstSavedAt?: string; updatedAt?: string }>,
  submissions: LearningSubmission[],
  now = new Date().toISOString(),
): WeeklyLearningBrief {
  const evidence = collectLearningEvidence(log, attempts, submissions, vocabulary);
  const recent = evidence.filter((item) => item.freshnessKnown && daysAgo(now, item.createdAt) <= 7);
  const activeDates = new Set(recent.map((item) => item.createdAt.slice(0, 10)));
  const recentReviews = submissions.filter(
    (submission) =>
      submission.kind === "review" &&
      daysAgo(now, submission.createdAt) <= 7,
  );
  const correctReviews = recentReviews.filter(
    (submission) =>
      submission.result.correct === true ||
      submission.checks.includes("correct"),
  ).length;
  const recentDomains = LEARNING_DOMAINS.map((domain) => ({
    id: domain.id,
    label: domain.label,
    evidenceCount: recent.filter((item) => item.domainId === domain.id).length,
  })).sort((a, b) => b.evidenceCount - a.evidenceCount);
  const strongest = recentDomains[0]?.evidenceCount
    ? recentDomains[0]
    : null;
  const topFocus = [...buildLearningIntelligence(
    log,
    attempts,
    vocabulary,
    submissions,
    { due: [], upcoming: [] },
    now,
  ).domains]
    .filter((domain) => domain.recencyDays !== null)
    .sort((a, b) => (a.coverage - b.coverage) || ((b.recencyDays ?? 0) - (a.recencyDays ?? 0)))[0] ?? null;

  const directEvidenceCount = recent.filter((item) => item.direct).length;
  const headline = activeDates.size === 0
    ? "Cette semaine n'a pas encore créé de nouvelle trace."
    : `${activeDates.size} jour${activeDates.size > 1 ? "s" : ""} actif${activeDates.size > 1 ? "s" : ""} · ${recent.length} preuves observées.`;

  const highlights = [
    recent.length
      ? `${directEvidenceCount} preuve(s) directe(s) dans la fenêtre de 7 jours.`
      : "Aucune nouvelle preuve datée dans les 7 derniers jours.",
    recentReviews.length
      ? `${correctReviews}/${recentReviews.length} rappels correctement récupérés.`
      : "Pas encore de rappel enregistré cette semaine.",
    strongest
      ? `Branche la plus documentée cette semaine · ${strongest.label}.`
      : "La prochaine activité peut créer un premier signal.",
  ];

  return {
    activeDays: activeDates.size,
    evidenceCount: recent.length,
    directEvidenceCount,
    reviewsAttempted: recentReviews.length,
    reviewAccuracy: recentReviews.length ? Math.round((correctReviews / recentReviews.length) * 100) : null,
    strongestDomain: strongest,
    topFocus: topFocus
      ? { id: topFocus.domainId, label: domainLabel(topFocus.domainId), recencyDays: topFocus.recencyDays }
      : null,
    headline,
    highlights,
  };
}

export function domainLabel(domainId: LearningDomainId): string {
  return LEARNING_DOMAINS.find((domain) => domain.id === domainId)?.label ?? domainId;
}
