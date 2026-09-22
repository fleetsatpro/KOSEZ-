import { PRONLAB_SETS } from "./data";
import { summarisePronlabItem, type PronlabAttempt } from "./engine";
import type { LearningSubmission } from "./store";
import type { ReviewItem } from "./learning-os";

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
      : addDays(anchor, 1);
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
