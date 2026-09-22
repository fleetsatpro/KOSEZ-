import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BookOpenCheck, BrainCircuit, CircleCheck, Clock3, Sprout } from "lucide-react";
import { Eyebrow, Page } from "@/components/app/primitives";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CURRICULUM_UNITS, buildSkillProfile, curriculumUnitProgress } from "@/lib/blossom/learning-os";
import { useBlossom } from "@/lib/blossom/store";

export const Route = createFileRoute("/_app/learn/curriculum")({
  component: Curriculum,
});

function Curriculum() {
  const log = useBlossom((s) => s.activityLog);
  const attempts = useBlossom((s) => s.pronlabAttempts);
  const vocabulary = useBlossom((s) => s.vocabulary);
  const profile = buildSkillProfile(log, attempts, vocabulary);
  const averageCoverage = Math.round(profile.reduce((sum, item) => sum + item.coverage, 0) / Math.max(1, profile.length));

  return (
    <Page className="kosez-feature-page">
      <header className="relative overflow-hidden rounded-[28px] bg-fg p-6 text-primary-foreground shadow-[var(--shadow-border)] sm:p-8">
        <div className="pointer-events-none absolute -right-24 -top-28 size-80 rounded-full border border-primary-foreground/10" />
        <div className="pointer-events-none absolute -bottom-32 right-10 size-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative max-w-4xl">
          <Eyebrow className="text-primary-foreground/55">ATELIER · PARCOURS</Eyebrow>
          <h1 className="mt-3 max-w-4xl font-display text-[clamp(2.6rem,6vw,5rem)] leading-[0.9] tracking-[-0.05em]">
            Un chemin, pas une <span className="text-primary">file de contenus.</span>
          </h1>
          <p className="mt-5 max-w-2xl text-sm leading-7 text-primary-foreground/70 sm:text-base">
            Chaque unité relie une intention communicative, une compétence, une pratique et une situation où la langue doit réellement servir.
          </p>
          <div className="mt-7 flex flex-wrap gap-2">
            <Badge className="border-primary-foreground/10 bg-primary-foreground/8 text-primary-foreground">
              A2 → B1 · 10 unités
            </Badge>
            <Badge className="border-primary-foreground/10 bg-primary-foreground/8 text-primary-foreground">
              {CURRICULUM_UNITS.reduce((sum, unit) => sum + unit.lessons.length, 0)} pratiques
            </Badge>
            <Badge className="border-primary-foreground/10 bg-primary-foreground/8 text-primary-foreground">
              couverture des preuves · {averageCoverage}%
            </Badge>
          </div>
        </div>
      </header>

      <section className="mt-8 grid gap-4">
        {CURRICULUM_UNITS.map((unit) => {
          const progress = curriculumUnitProgress(unit, log, attempts, vocabulary);
          const domainLabels = unit.domainIds
            .map((id) => profile.find((item) => item.domain.id === id)?.domain.shortLabel)
            .filter(Boolean)
            .slice(0, 4);

          return (
            <Link
              key={unit.id}
              to="/learn/curriculum/$unitId"
              params={{ unitId: unit.id }}
              className="group rounded-2xl bg-surface p-5 shadow-[var(--shadow-border)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-border-hover)] sm:p-6"
            >
              <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-subtle">
                      Unité {String(unit.number).padStart(2, "0")}
                    </span>
                    <Badge variant="outline">{unit.level}</Badge>
                    {progress >= 70 ? (
                      <Badge className="border-primary/20 bg-primary/10 text-primary">
                        preuve solide
                      </Badge>
                    ) : null}
                  </div>
                  <h2 className="mt-3 font-display text-3xl tracking-tight sm:text-4xl">
                    {unit.title}
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">{unit.blurb}</p>
                  <div className="mt-5 flex flex-wrap gap-1.5">
                    {domainLabels.map((label) => (
                      <span
                        key={label}
                        className="rounded-full bg-surface-2 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted"
                      >
                        {label}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="w-full shrink-0 md:w-64">
                  <div className="flex items-center justify-between gap-3 text-xs">
                    <span className="text-muted">Couverture des preuves</span>
                    <span className="font-semibold tabular-nums text-primary">{progress}%</span>
                  </div>
                  <Progress className="mt-3" value={progress} />
                  <div className="mt-4 grid grid-cols-3 gap-2 text-xs text-muted">
                    <span className="rounded-lg bg-surface-2/70 p-2">
                      <BookOpenCheck className="mb-1 size-3.5 text-primary" />
                      {unit.lessons.length} pratiques
                    </span>
                    <span className="rounded-lg bg-surface-2/70 p-2">
                      <BrainCircuit className="mb-1 size-3.5 text-primary" />
                      {unit.objectives.length} objectifs
                    </span>
                    <span className="rounded-lg bg-surface-2/70 p-2">
                      <Clock3 className="mb-1 size-3.5 text-primary" />
                      {unit.lessons.reduce((sum, lesson) => sum + lesson.minutes, 0)} min
                    </span>
                  </div>
                  <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                    Ouvrir l'unité
                    <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </section>

      <section className="mt-8 grid gap-4 lg:grid-cols-[1.1fr_.9fr]">
        <article className="rounded-2xl border border-primary/15 bg-primary/5 p-5 shadow-[var(--shadow-border)] sm:p-6">
          <Eyebrow>CAN-DO · la preuve compte</Eyebrow>
          <h2 className="mt-2 font-display text-2xl tracking-tight">Votre parcours doit laisser des traces.</h2>
          <p className="mt-3 text-sm leading-6 text-muted">
            Une unité ne devient pas “faite” parce qu'un écran a été ouvert. K'Osez séparera progressivement exposition, pratique, démonstration et maîtrise pour que votre progression reste lisible.
          </p>
        </article>
        <Link
          to="/learn/progress"
          className="group rounded-2xl bg-surface p-5 shadow-[var(--shadow-border)] transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-border-hover)] sm:p-6"
        >
          <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Sprout className="size-5" />
          </div>
          <h2 className="mt-6 font-display text-2xl tracking-tight">Voir le profil de compétences</h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            9 domaines, les preuves disponibles et les angles morts qui méritent encore une vraie activité.
          </p>
          <span className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-primary">
            Ouvrir
            <ArrowRight className="size-3.5" />
          </span>
        </Link>
      </section>
    </Page>
  );
}
