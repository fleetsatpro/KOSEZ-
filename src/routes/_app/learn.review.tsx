import { createFileRoute, Link, useRouterState } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Check, LibraryBig, Mic2, RotateCcw, Target } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { GrowthCeremony } from "@/components/app/growth-ceremony";
import type { GrowthEvent, MineralSnapshot } from "@/lib/blossom/organism";
import { Eyebrow, Page, Surface } from "@/components/app/primitives";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { buildReviewQueue, type ReviewItem } from "@/lib/blossom/learning-os";
import { buildReviewPlan, type ScheduledReviewItem } from "@/lib/blossom/review-scheduler";
import { useBlossom } from "@/lib/blossom/store";
import {
  clearCurriculumLessonContext,
  readCurriculumLessonContext,
} from "@/lib/blossom/curriculum-context";

type CeremonyState = {
  event: GrowthEvent;
  minerals: MineralSnapshot;
  previousMinerals: MineralSnapshot;
};

export const Route = createFileRoute("/_app/learn/review")({
  component: Review,
});

function kindIcon(kind: ReviewItem["kind"]) {
  switch (kind) {
    case "pronunciation": return Mic2;
    case "vocabulary": return LibraryBig;
    case "mission": return Target;
  }
}

function Review() {
  const search = useRouterState({ select: (state) => state.location.searchStr });
  const focusSource = new URLSearchParams(search).get("item");
  const [curriculumLessonId] = useState<string | null>(() => readCurriculumLessonContext());
  useEffect(() => {
    if (curriculumLessonId) clearCurriculumLessonContext();
  }, [curriculumLessonId]);
  const attempts = useBlossom((s) => s.pronlabAttempts);
  const vocabulary = useBlossom((s) => s.vocabulary);
  const submissions = useBlossom((s) => s.learningSubmissions);
  const saveLearningSubmission = useBlossom((s) => s.saveLearningSubmission);
  const completeActivity = useBlossom((s) => s.completeActivity);
  const plan = useMemo(
    () => buildReviewPlan(submissions, attempts, vocabulary),
    [submissions, attempts, vocabulary],
  );
  const fallback = useMemo(() => buildReviewQueue(attempts, vocabulary), [attempts, vocabulary]);
  const initial = useMemo(
    () => (plan.due.length ? plan.due : fallback.map((item) => ({
      ...item,
      dueAt: new Date().toISOString(),
      intervalDays: 1,
      sourceKey: item.id,
      state: "due" as const,
    }))),
    [plan.due, fallback],
  );
  const focusedInitial = useMemo(() => {
    if (!focusSource) return initial;
    const index = initial.findIndex((item) => item.sourceKey === focusSource);
    return index < 0 ? initial : [initial[index]!, ...initial.slice(0, index), ...initial.slice(index + 1)];
  }, [focusSource, initial]);
  const [queue, setQueue] = useState<ScheduledReviewItem[]>(() => focusedInitial);
  const [sessionTotal] = useState(() => Math.max(initial.length, 1));
  const [revealed, setRevealed] = useState(false);
  const [done, setDone] = useState(false);
  const [reviewed, setReviewed] = useState(0);
  const [misses, setMisses] = useState<Record<string, number>>({});
  const [ceremony, setCeremony] = useState<CeremonyState | null>(null);

  const current = queue[0];
  const total = sessionTotal;
  const finished = reviewed >= total && !current;

  function answer(correct: boolean) {
    if (!current) return;
    const nextMiss = (misses[current.id] ?? 0) + (correct ? 0 : 1);
    saveLearningSubmission({
      taskId: current.sourceKey,
      kind: "review",
      content: correct ? "correct" : "again",
      checks: [correct ? "correct" : "again"],
      result: {
        correct,
        sourceKind: current.kind,
        reviewedAt: new Date().toISOString(),
      },
    });
    setMisses((value) => ({ ...value, [current.id]: nextMiss }));
    setQueue((items) => {
      const [, ...rest] = items;
      return correct || nextMiss >= 2 ? rest : [...rest, current];
    });
    setReviewed((value) => value + 1);
    setRevealed(false);
  }

  function finish() {
    const day = new Date().toISOString().slice(0, 10);
    const reviewSourceId = `review-${day}`;
    let growth = completeActivity(
      "REVIEW_COMPLETED",
      reviewSourceId,
      `Révision · ${reviewed} passages · ${plan.due.length} dues au départ`,
    );
    if (curriculumLessonId) {
      const evidence = completeActivity(
        "CURRICULUM_EVIDENCE_RECORDED",
        curriculumLessonId,
        `Preuve curriculum · révision · ${reviewSourceId}`,
        { supportId: reviewSourceId },
      );
      if (evidence.ok && evidence.event) growth = evidence;
    }
    if (growth.ok && growth.event && growth.minerals && growth.previousMinerals) {
      setCeremony({
        event: growth.event,
        minerals: growth.minerals,
        previousMinerals: growth.previousMinerals,
      });
    }
    setDone(true);
  }

  if (done || finished) {
    return (
      <Page className="max-w-3xl">
        <Surface className="overflow-hidden border border-primary/20 bg-primary/5 p-6 sm:p-8">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-primary/12 text-primary">
            <Check className="size-6" />
          </span>
          <Eyebrow className="mt-6">RÉVISION · TERMINÉE</Eyebrow>
          <h1 className="mt-2 font-display text-4xl tracking-tight sm:text-5xl">Les traces restent. Le rappel aussi.</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-muted sm:text-base">
            Vous avez fait {reviewed} passage{reviewed > 1 ? "s" : ""}. Une réponse hésitante n'est pas une faute : elle indique simplement ce que K'Osez devra remettre en circulation.
          </p>
          <div className="mt-7 flex flex-wrap gap-2">
            <Button asChild>
              <Link to="/learn/curriculum">Reprendre le parcours <ArrowRight className="size-4" /></Link>
            </Button>
            <Button variant="secondary" asChild>
              <Link to="/learn/progress">Voir mes preuves</Link>
            </Button>
          </div>
          {ceremony ? (
            <GrowthCeremony
              event={ceremony.event}
              minerals={ceremony.minerals}
              previousMinerals={ceremony.previousMinerals}
              open
              onDismiss={() => setCeremony(null)}
            />
          ) : null}
        </Surface>
      </Page>
    );
  }

  if (!current) {
    return (
      <Page className="max-w-2xl">
        <Surface>
          <Eyebrow>RÉVISION</Eyebrow>
          <h1 className="mt-2 font-display text-3xl tracking-tight">Aucune révision due.</h1>
          <p className="mt-2 text-sm leading-6 text-muted">
            Votre prochain meilleur geste est une activité qui crée une nouvelle preuve.
          </p>
          <Button className="mt-5" asChild><Link to="/mission">Faire une mission <ArrowRight className="size-4" /></Link></Button>
        </Surface>
      </Page>
    );
  }

  const Icon = kindIcon(current.kind);
  const progress = Math.min(100, Math.round((reviewed / total) * 100));

  return (
    <Page className="kosez-feature-page max-w-3xl">
      <div className="flex items-center justify-between gap-4">
        <Link to="/learn" className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted hover:text-primary">
          <ArrowLeft className="size-3.5" /> Atelier
        </Link>
        <Badge variant="outline">{current.kind}</Badge>
      </div>

      <header className="mt-7">
        <Eyebrow>RÉVISION ADAPTATIVE</Eyebrow>
        <h1 className="mt-2 font-display text-4xl tracking-tight sm:text-5xl">Ce que votre mémoire a besoin de revoir.</h1>
        <div className="mt-6 h-1.5 overflow-hidden rounded-full bg-surface-2" aria-label="Progression de la révision">
          <div className="h-full rounded-full bg-primary transition-[width] duration-300" style={{ width: `${progress}%` }} />
        </div>
        <p className="mt-2 text-xs tabular-nums text-subtle">{reviewed} / {total} passages</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Badge variant="outline">{plan.due.length} dues maintenant</Badge>
          {plan.upcoming.length > 0 ? <Badge variant="outline">{plan.upcoming.length} à venir</Badge> : null}
        </div>
      </header>

      {plan.upcoming.length > 0 ? (
        <Surface className="mt-4">
          <Eyebrow>Prochains rappels</Eyebrow>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {plan.upcoming.slice(0, 6).map((item) => (
              <div key={item.id} className="rounded-xl border border-border bg-surface-2/40 p-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-medium">{item.title}</span>
                  <span className="text-[10px] uppercase tracking-[0.14em] text-subtle">{item.intervalDays} j</span>
                </div>
                <p className="mt-1 text-xs text-muted">
                  {new Date(item.dueAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}
                </p>
              </div>
            ))}
          </div>
        </Surface>
      ) : null}

      <Surface className="mt-8">
        <div className="flex items-start gap-4">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Icon className="size-5" />
          </span>
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-subtle">{current.priority} · {current.reason}</span>
            <h2 className="mt-3 font-display text-3xl tracking-tight">{current.title}</h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-muted">{current.prompt}</p>
          </div>
        </div>

        {revealed ? (
          <div className="mt-8 rounded-2xl border border-primary/20 bg-primary/5 p-5">
            <Eyebrow>Réponse de référence</Eyebrow>
            <p className="mt-2 font-display text-2xl tracking-tight">{current.answer}</p>
          </div>
        ) : (
          <Button size="lg" variant="secondary" className="mt-8 w-full sm:w-auto" onClick={() => setRevealed(true)}>
            Révéler
          </Button>
        )}

        {revealed ? (
          <div className="mt-7 grid gap-2 sm:grid-cols-2">
            <Button size="lg" onClick={() => answer(true)}>
              <Check className="size-4" /> Je le savais
            </Button>
            <Button size="lg" variant="secondary" onClick={() => answer(false)}>
              <RotateCcw className="size-4" /> À revoir
            </Button>
          </div>
        ) : null}

        <div className="mt-6 flex flex-wrap gap-2">
          <Link
            to={current.link === "pronlab" ? "/pronlab" : current.link === "library" ? "/library" : "/mission"}
            className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-primary"
          >
            Ouvrir la source <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </Surface>
    </Page>
  );
}
