import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CircleAlert, CircleCheck, Eye, FileCheck2, Sprout } from "lucide-react";
import { Eyebrow, Page, Surface } from "@/components/app/primitives";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CAN_DO_OBJECTIVES, LEARNING_DOMAINS, buildSkillProfile } from "@/lib/blossom/learning-os";
import { buildLearningIntelligence } from "@/lib/blossom/learning-intelligence";
import { buildReviewPlan } from "@/lib/blossom/review-scheduler";
import { useBlossom } from "@/lib/blossom/store";

export const Route = createFileRoute("/_app/learn/progress")({
  component: ProgressPage,
});

function ProgressPage() {
  const log = useBlossom((s) => s.activityLog);
  const attempts = useBlossom((s) => s.pronlabAttempts);
  const vocabulary = useBlossom((s) => s.vocabulary);
  const submissions = useBlossom((s) => s.learningSubmissions);
  const profile = buildSkillProfile(log, attempts, vocabulary);
  const reviewPlan = buildReviewPlan(submissions, attempts, vocabulary);
  const intelligence = buildLearningIntelligence(log, attempts, vocabulary, submissions, reviewPlan);
  const documented = profile.filter((item) => item.coverage >= 60).length;
  const blindSpots = profile.filter((item) => item.evidenceCount === 0);

  return (
    <Page className="kosez-feature-page">
      <header>
        <Eyebrow>ATELIER · COMPÉTENCES</Eyebrow>
        <h1 className="mt-3 font-display text-[clamp(2.7rem,6vw,5.2rem)] leading-[0.9] tracking-[-0.05em]">
          Ce que nous pouvons <span className="text-primary">déjà voir.</span>
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-muted sm:text-base">
          Ici, le pourcentage mesure la couverture de vos preuves actuelles — pas une prétendue note de niveau. Les zones faibles signifient parfois “pas encore mesuré”, pas “vous êtes mauvais”.
        </p>
      </header>

      <section className="mt-8 grid gap-3 sm:grid-cols-3">
        <Surface>
          <p className="text-xs uppercase tracking-[0.16em] text-muted">Domaines</p>
          <p className="mt-2 font-display text-4xl tabular-nums">{LEARNING_DOMAINS.length}</p>
          <p className="mt-1 text-xs text-muted">dans le modèle actuel</p>
        </Surface>
        <Surface>
          <p className="text-xs uppercase tracking-[0.16em] text-muted">Bien documentés</p>
          <p className="mt-2 font-display text-4xl tabular-nums text-primary">{documented}</p>
          <p className="mt-1 text-xs text-muted">sur {profile.length}</p>
        </Surface>
        <Surface>
          <p className="text-xs uppercase tracking-[0.16em] text-muted">Can-Do</p>
          <p className="mt-2 font-display text-4xl tabular-nums">{CAN_DO_OBJECTIVES.length}</p>
          <p className="mt-1 text-xs text-muted">objectifs reliés au parcours A2 → B1</p>
        </Surface>
      </section>

      <section className="mt-6 grid gap-3 sm:grid-cols-3">
        <Surface>
          <p className="text-xs uppercase tracking-[0.16em] text-muted">Momentum · 14 jours</p>
          <p className="mt-2 font-display text-4xl tabular-nums text-primary">{intelligence.momentum}%</p>
          <p className="mt-1 text-xs text-muted">{intelligence.activeDays14} jours réellement actifs</p>
        </Surface>
        <Surface>
          <p className="text-xs uppercase tracking-[0.16em] text-muted">Largeur du profil</p>
          <p className="mt-2 font-display text-4xl tabular-nums">{intelligence.breadth}%</p>
          <p className="mt-1 text-xs text-muted">{intelligence.domains.filter((d) => d.evidenceCount > 0).length}/{intelligence.domains.length} domaines mesurés</p>
        </Surface>
        <Surface>
          <p className="text-xs uppercase tracking-[0.16em] text-muted">Mémoire · maintenant</p>
          <p className="mt-2 font-display text-4xl tabular-nums">{intelligence.dueNow}</p>
          <p className="mt-1 text-xs text-muted">{intelligence.highPriorityDue} priorité(s) haute</p>
        </Surface>
      </section>

      <Surface className="mt-4 border border-primary/15 bg-primary/5">
        <div className="flex flex-wrap items-start gap-4">
          <div className="min-w-0 flex-1">
            <Eyebrow>{intelligence.next.eyebrow}</Eyebrow>
            <h2 className="mt-2 font-display text-2xl tracking-tight">{intelligence.next.title}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">{intelligence.next.body}</p>
          </div>
          <Link
            to={
              intelligence.next.kind === "review"
                ? "/learn/review"
                : intelligence.next.kind === "mission"
                  ? "/mission"
                  : intelligence.next.kind === "pronlab"
                    ? "/pronlab"
                    : intelligence.next.kind === "library"
                      ? "/library"
                      : "/learn/labs"
            }
            className="inline-flex shrink-0 items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-primary"
          >
            Agir maintenant <ArrowRight className="size-3.5" />
          </Link>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {intelligence.next.reasons.map((reason) => (
            <Badge key={reason} variant="outline">{reason}</Badge>
          ))}
        </div>
      </Surface>

      <section className="mt-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <Eyebrow>Profil de preuves</Eyebrow>
            <h2 className="mt-2 font-display text-3xl tracking-tight">Neuf branches, une seule histoire.</h2>
          </div>
          <Link to="/learn/review" className="hidden items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-primary sm:inline-flex">
            Réviser <ArrowRight className="size-3.5" />
          </Link>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {profile.map((entry) => (
            <article key={entry.domain.id} className="rounded-2xl bg-surface p-5 shadow-[var(--shadow-border)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-subtle">{entry.domain.shortLabel}</p>
                  <h3 className="mt-2 font-display text-2xl tracking-tight">{entry.domain.label}</h3>
                </div>
                {entry.evidenceCount > 0 ? (
                  <CircleCheck className="mt-1 size-5 text-primary" />
                ) : (
                  <CircleAlert className="mt-1 size-5 text-subtle" />
                )}
              </div>
              <div className="mt-5 flex items-end justify-between gap-3">
                <span className="text-sm text-muted">{entry.status}</span>
                <span className="font-display text-3xl tabular-nums text-primary">{entry.coverage}%</span>
              </div>
              <Progress className="mt-3" value={entry.coverage} />
              <p className="mt-4 text-sm leading-6 text-muted">{entry.signal}</p>
              <p className="mt-3 flex items-center gap-1.5 text-[11px] uppercase tracking-[0.14em] text-subtle">
                <FileCheck2 className="size-3.5" /> {entry.evidenceCount} signal{entry.evidenceCount > 1 ? "s" : ""}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-9 grid gap-4 lg:grid-cols-[1.1fr_.9fr]">
        <Surface>
          <div className="flex items-start gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Eye className="size-4.5" />
            </span>
            <div>
              <Eyebrow>À interpréter avec honnêteté</Eyebrow>
              <h2 className="mt-2 font-display text-2xl tracking-tight">La mesure doit savoir dire “je ne sais pas encore”.</h2>
            </div>
          </div>
          {blindSpots.length ? (
            <div className="mt-5 flex flex-wrap gap-2">
              {blindSpots.map((entry) => (
                <Badge key={entry.domain.id} variant="outline">{entry.domain.label}</Badge>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-muted">Aucun domaine complètement aveugle.</p>
          )}
        </Surface>

        <Link to="/learn/curriculum" className="group rounded-2xl bg-fg p-5 text-primary-foreground shadow-[var(--shadow-border)] transition hover:-translate-y-0.5 sm:p-6">
          <Sprout className="size-5 text-primary" />
          <h2 className="mt-4 font-display text-2xl tracking-tight">Faire pousser les branches manquantes</h2>
          <p className="mt-2 text-sm leading-6 text-primary-foreground/60">Le parcours propose les pratiques qui créent de nouvelles preuves au lieu de gonfler artificiellement le score.</p>
          <span className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-primary">
            Voir le parcours <ArrowRight className="size-3.5" />
          </span>
        </Link>
      </section>
    </Page>
  );
}
