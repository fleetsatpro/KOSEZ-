import { PRONLAB_SETS, TODAY_MISSION } from "./data.ts";
import { GRAMMAR_TASKS, LISTENING_TASKS, WRITING_PROMPTS } from "./lab-content.ts";
import { summarisePronlabItem, type PronlabAttempt } from "./engine.ts";
import type { LearningSubmission } from "./store.ts";
import type { ReviewItem } from "./learning-os.ts";

export type ScheduledReviewItem = ReviewItem & {
  dueAt: string;
  intervalDays: number;
  sourceKey: string;
  state: "due" | "upcoming";
  lastReviewedAt?: string;
};

export type ReviewPlan = {
  due: ScheduledReviewItem[];
  upcoming: ScheduledReviewItem[];
};

const REVIEW_INTERVALS = [1, 3, 7, 14, 30] as const;

function addDays(iso: string, days: number): string {
  const date = new Date(iso);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString();
}

function daysBetween(a: string, b: string): number {
  return Math.max(0, Math.floor((new Date(b).getTime() - new Date(a).getTime()) / 86_400_000));
}

function isCorrectSubmission(submission: LearningSubmission): boolean {
  if (typeof submission.result.correct === "boolean") return submission.result.correct;
  const checks = submission.checks.map((check) => check.toLowerCase());
  if (checks.includes("correct")) return true;
  const checkCount = Number(submission.result.checkCount);
  const checkTotal = Number(submission.result.checkTotal);
  return Number.isFinite(checkCount) && Number.isFinite(checkTotal) && checkTotal > 0 && checkCount >= checkTotal;
}

function reviewStreak(submissions: LearningSubmission[], sourceKey: string): number {
  const relevant = submissions
    .filter((submission) => submission.kind === "review" && submission.taskId === sourceKey)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  let streak = 0;
  for (const submission of relevant) {
    if (!isCorrectSubmission(submission)) break;
    streak += 1;
  }
  return streak;
}

function latestReview(submissions: LearningSubmission[], sourceKey: string): LearningSubmission | null {
  return submissions
    .filter((submission) => submission.kind === "review" && submission.taskId === sourceKey)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0] ?? null;
}

function intervalForSubmission(
  submission: LearningSubmission,
  submissions: LearningSubmission[],
): number {
  if (!isCorrectSubmission(submission)) return 1;
  const streak = reviewStreak(submissions, submission.taskId);
  return REVIEW_INTERVALS[Math.min(Math.max(streak - 1, 0), REVIEW_INTERVALS.length - 1)]!;
}

export function buildReviewPlan(
  submissions: LearningSubmission[],
  attempts: PronlabAttempt[],
  vocabulary: Array<{ word: string; gloss: string; firstSavedAt?: string; updatedAt?: string }>,
  now = new Date().toISOString(),
): ReviewPlan {
  const items: ScheduledReviewItem[] = [];

  const pronItems = PRONLAB_SETS.flatMap((set) => set.items);
  for (const item of pronItems) {
    const summary = summarisePronlabItem(item.id, attempts);
    if (!summary.attemptCount) continue;
    const sourceKey = `pron:${item.id}`;
    const latest = latestReview(submissions, sourceKey);
    const baseDue = latest
      ? addDays(latest.createdAt, intervalForSubmission(latest, submissions))
      : addDays(
          attempts.filter((attempt) => attempt.itemId === item.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]?.createdAt ?? now,
          summary.struggling ? 1 : summary.mastered ? 7 : 3,
        );
    items.push({
      id: `review-pron-${item.id}`,
      kind: "pronunciation",
      title: item.phrase,
      prompt: `Quel son ou segment vous voulez stabiliser dans « ${item.phrase} » ?`,
      answer: item.problemSegment || item.focus,
      reason: summary.struggling
        ? "Votre historique Pron'Lab montre une difficulté persistante."
        : "Votre dernière preuve Pron'Lab mérite un retour espacé.",
      priority: summary.struggling ? "haute" : "normale",
      link: "pronlab",
      dueAt: baseDue,
      intervalDays: Math.max(1, daysBetween(latest?.createdAt ?? now, baseDue)),
      sourceKey,
      state: baseDue <= now ? "due" : "upcoming",
      lastReviewedAt: latest?.createdAt,
    });
  }

  for (const word of vocabulary) {
    const sourceKey = `vocab:${word.word}`;
    const latest = latestReview(submissions, sourceKey);
    const anchor = latest?.createdAt ?? word.updatedAt ?? word.firstSavedAt ?? now;
    const dueAt = latest
      ? addDays(latest.createdAt, intervalForSubmission(latest, submissions))
      : anchor;
    items.push({
      id: `review-word-${word.word}`,
      kind: "vocabulary",
      title: word.word,
      prompt: "Rappelez le sens puis utilisez le mot dans une phrase nouvelle.",
      answer: word.gloss,
      reason: latest ? "Le mot revient selon votre dernière réponse de rappel." : "Premier rappel après l'enregistrement du mot.",
      priority: "normale",
      link: "library",
      dueAt,
      intervalDays: Math.max(1, daysBetween(anchor, dueAt)),
      sourceKey,
      state: dueAt <= now ? "due" : "upcoming",
      lastReviewedAt: latest?.createdAt,
    });
  }


  const latestPractice = new Map<string, LearningSubmission>();
  for (const submission of submissions) {
    if (!["grammar", "listening", "writing"].includes(submission.kind)) continue;
    const key = submission.kind + ":" + submission.taskId;
    const prior = latestPractice.get(key);
    if (!prior || prior.createdAt < submission.createdAt) {
      latestPractice.set(key, submission);
    }
  }

  for (const submission of latestPractice.values()) {
    const sourceKey = submission.kind + ":" + submission.taskId;
    const latest = latestReview(submissions, sourceKey);
    const correct = isCorrectSubmission(submission);
    const anchorTime = submission.createdAt;
    const dueAt = latest
      ? addDays(latest.createdAt, intervalForSubmission(latest, submissions))
      : addDays(anchorTime, correct ? 3 : 1);

    const common = {
      id: "review-" + submission.kind + "-" + submission.taskId,
      reason:
        latest && !isCorrectSubmission(latest)
          ? "Votre dernier rappel demande encore un passage."
          : correct
            ? "Cette pratique vient d'être travaillée ; le rappel espacé la remettra en circulation."
            : "La dernière production n'était pas entièrement maîtrisée.",
      priority: (!correct || (latest !== null && !isCorrectSubmission(latest))
        ? "haute"
        : "normale") as "haute" | "normale",
      link: "labs" as const,
      dueAt,
      intervalDays: Math.max(1, daysBetween(latest?.createdAt ?? anchorTime, dueAt)),
      sourceKey,
      state: (dueAt <= now ? "due" : "upcoming") as "due" | "upcoming",
      lastReviewedAt: latest?.createdAt,
    };

    if (submission.kind === "grammar") {
      const task = GRAMMAR_TASKS.find((item) => item.id === submission.taskId);
      if (!task) continue;
      items.push({
        ...common,
        kind: "grammar",
        title: task.target,
        prompt: task.prompt,
        answer: task.answer,
      });
      continue;
    }

    if (submission.kind === "listening") {
      const task = LISTENING_TASKS.find((item) => item.id === submission.taskId);
      if (!task) continue;
      items.push({
        ...common,
        kind: "listening",
        title: task.question,
        prompt: task.question,
        answer: task.answer,
      });
      continue;
    }

    const task = WRITING_PROMPTS.find((item) => item.id === submission.taskId);
    if (!task) continue;
    items.push({
      ...common,
      kind: "writing",
      title: task.title,
      prompt: task.task,
      answer: task.model,
    });
  }

  for (const kit of TODAY_MISSION.scene?.languageKit ?? []) {
    const sourceKey = `mission:${kit.phrase}`;
    const latest = latestReview(submissions, sourceKey);
    const interval = latest ? intervalForSubmission(latest, submissions) : 0;
    const dueAt = latest ? addDays(latest.createdAt, interval) : now;
    items.push({
      id: `review-kit-${kit.phrase}`,
      kind: "mission",
      title: kit.phrase,
      prompt: kit.meaning,
      answer: kit.meaning,
      reason: latest
        ? "Cette formule revient selon votre historique de rappel."
        : "Phrase utile liée à la mission du moment.",
      priority: latest ? "normale" : "nouvelle",
      link: "mission",
      dueAt,
      intervalDays: interval,
      sourceKey,
      state: dueAt <= now ? "due" : "upcoming",
      lastReviewedAt: latest?.createdAt,
    });
  }

  return {
    due: items
      .filter((item) => item.state === "due")
      .sort((a, b) => {
        const p = { haute: 0, normale: 1, nouvelle: 2 } as const;
        return (p[a.priority] - p[b.priority]) || a.dueAt.localeCompare(b.dueAt);
      }),
    upcoming: items
      .filter((item) => item.state === "upcoming")
      .sort((a, b) => a.dueAt.localeCompare(b.dueAt))
      .slice(0, 12),
  };
}
