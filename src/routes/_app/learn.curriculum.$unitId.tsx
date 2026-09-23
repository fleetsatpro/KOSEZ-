import { createFileRoute, Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { ArrowLeft, ArrowRight, BookOpen, Headphones, LibraryBig, MessageCircle, Mic2, PenLine, RotateCcw, Target, type LucideIcon } from "lucide-react";
import { Eyebrow, Page, Surface } from "@/components/app/primitives";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  CAN_DO_OBJECTIVES,
  CURRICULUM_UNITS,
  buildSkillProfile,
  curriculumUnitProgress,
  curriculumResource,
  type CurriculumResource,
  type LessonKind,
  lessonDone,
} from "@/lib/blossom/learning-os";
import { useBlossom } from "@/lib/blossom/store";

export const Route = createFileRoute("/_app/learn/curriculum/$unitId")({
  component: CurriculumUnit,
});

function lessonIcon(kind: LessonKind): LucideIcon {
  switch (kind) {
    case "mission": return Target;
    case "speak": return Mic2;
    case "pronlab": return Headphones;
    case "library": return LibraryBig;
    case "review": return RotateCcw;
    case "grammar": return BookOpen;
    case "listening": return Headphones;
    case "writing": return PenLine;
  }
}

function PracticeLink({
  resource,
  lessonId,
  className,
  children,
}: {
  resource: CurriculumResource;
  lessonId: string;
  className?: string;
  children: ReactNode;
}) {
  switch (resource.kind) {
    case "mission":
      return (
        <Link to="/mission" search={{ missionId: resource.id, lessonId }} className={className}>
          {children}
        </Link>
      );
    case "speak":
      return (
        <Link to="/osez/$id" params={{ id: resource.id }} search={{ lessonId }} className={className}>
          {children}
        </Link>
      );
    case "pronlab":
      return (
        <Link to="/pronlab/$setId" params={{ setId: resource.id }} search={{ lessonId }} className={className}>
          {children}
        </Link>
      );
    case "library":
      return (
        <Link to="/library/$id" params={{ id: resource.id }} search={{ lessonId }} className={className}>
          {children}
        </Link>
      );
    case "review":
      return (
        <Link to="/learn/review" search={{ focus: resource.id, lessonId }} className={className}>
          {children}
        </Link>
      );
    case "grammar":
    case "listening":
    case "writing":
      return (
        <Link
          to="/learn/labs"
          search={{ lab: resource.kind, task: resource.id, lessonId }}
          className={className}
        >
          {children}
        </Link>
      );
  }
}

function CurriculumUnit() {
  const { unitId } = Route.useParams();
  const unit = CURRICULUM_UNITS.find((item) => item.id === unitId);
  const log = useBlossom((s) => s.activityLog);
  const attempts = useBlossom((s) => s.pronlabAttempts);
  const vocabulary = useBlossom((s) => s.vocabulary);
  const profile = buildSkillProfile(log, attempts, vocabulary);

  if (!unit) {
    return (
      <Page className="max-w-2xl">
        <Surface>
          <Eyebrow>Parcours</Eyebrow>
          <h1 className="mt-2 font-display text-3xl tracking-tight">Unité introuvable</h1>
          <Button asChild className="mt-5">
            <Link to="/learn/curriculum">Retour au parcours</Link>
          </Button>
        </Surface>
      </Page>
    );
  }

  const progress = curriculumUnitProgress(unit, log, attempts, vocabulary);

  return (
    <Page className="kosez-feature-page">
      <Link
        to="/learn/curriculum"
        className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted hover:text-primary"
      >
        <ArrowLeft className="size-3.5" />
        Parcours
      </Link>

      <header className="mt-6 rounded-[28px] bg-surface p-6 shadow-[var(--shadow-border)] sm:p-8">
        <div className="flex flex-wrap items-center gap-2">
          <Eyebrow>UNITÉ {String(unit.number).padStart(2, "0")} · {unit.level}</Eyebrow>
          <Badge variant="outline">{progress}% preuve couverte</Badge>
        </div>
        <h1 className="mt-3 max-w-4xl font-display text-[clamp(2.5rem,6vw,5rem)] leading-[0.92] tracking-[-0.05em]">
          {unit.title}
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-muted sm:text-base">{unit.blurb}</p>
        <Progress className="mt-6 max-w-2xl" value={progress} />
      </header>

      <section className="mt-8 grid gap-4 lg:grid-cols-[.95fr_1.05fr]">
        <Surface>
          <Eyebrow>Objectifs communicatifs</Eyebrow>
          <div className="mt-5 space-y-3">
            {CAN_DO_OBJECTIVES.filter((objective) => unit.objectives.includes(objective.id)).map((objective) => {
              const coverage = profile.find((item) => item.domain.id === objective.domain)?.coverage ?? 0;
              return (
                <div key={objective.id} className="rounded-xl border border-border bg-surface-2/45 p-4">
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <MessageCircle className="size-4" />
                    </span>
                    <div>
                      <p className="font-medium">{objective.title}</p>
                      <p className="mt-1 text-xs leading-5 text-muted">{objective.evidence}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-3 text-[11px]">
                    <span className="text-subtle">Signal du domaine</span>
                    <span className="tabular-nums text-primary">{coverage}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Surface>

        <div className="space-y-4">
          <div>
            <Eyebrow>Pratiques reliées</Eyebrow>
            <h2 className="mt-2 font-display text-3xl tracking-tight">Chaque activité a une place.</h2>
          </div>
          {unit.lessons.map((lesson, index) => {
            const Icon = lessonIcon(lesson.kind);
            const resource = curriculumResource(lesson);
            const done = lessonDone(lesson, log);
            return (
              <div key={lesson.id} className="rounded-2xl bg-surface p-5 shadow-[var(--shadow-border)]">
                <PracticeLink lessonId={lesson.id} resource={resource} className="group block">
                  <div className="flex items-start gap-4">
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Icon className="size-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-subtle">
                          0{index + 1} · {lesson.kind}
                        </span>
                        <span className="text-xs tabular-nums text-muted">{lesson.minutes} min</span>
                        {done ? (
                          <Badge className="border-primary/20 bg-primary/10 text-primary">
                            trace enregistrée
                          </Badge>
                        ) : null}
                      </div>
                      <h3 className="mt-2 font-display text-2xl tracking-tight">{lesson.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-muted">{lesson.description}</p>
                    </div>
                    <ArrowRight className="mt-2 size-4 shrink-0 text-subtle transition group-hover:translate-x-0.5 group-hover:text-primary" />
                  </div>
                </PracticeLink>

                <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs leading-5 text-subtle">
                    {done
                      ? "La pratique liée a laissé une trace exploitable dans votre parcours."
                      : "Ouvrez la pratique liée : son propre module crée la trace lorsqu'elle est réellement réalisée."}
                  </p>
                  <PracticeLink
                    lessonId={lesson.id}
                    resource={resource}
                    className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-border bg-surface-2 px-4 text-xs font-semibold text-fg transition hover:border-primary/25 hover:text-primary"
                  >
                    {done ? "Rejouer la pratique" : "Faire la pratique"} <ArrowRight className="size-3.5" />
                  </PracticeLink>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mt-8 rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-border)] sm:p-6">
        <Eyebrow>Réflexe BLOSSOM</Eyebrow>
        <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-display text-2xl tracking-tight">Ne cherchez pas à “finir” l'unité.</p>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-muted">
              Cherchez la première preuve qui tient dans le monde réel. Le reste s'aligne autour d'elle.
            </p>
          </div>
          <Link
            to="/learn/review"
            search={{ focus: undefined }}
            className="inline-flex shrink-0 items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary"
          >
            Réviser maintenant <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </section>
    </Page>
  );
}
