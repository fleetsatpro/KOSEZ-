import { createFileRoute, Link } from "@tanstack/react-router";
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
  type LessonKind,
  lessonDone,
} from "@/lib/blossom/learning-os";
import { useBlossom } from "@/lib/blossom/store";
import { setCurriculumLessonContext } from "@/lib/blossom/curriculum-context";

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

function lessonLink(kind: LessonKind): "/mission" | "/osez" | "/pronlab" | "/library" | "/learn/review" | "/learn/labs" {
  switch (kind) {
    case "mission": return "/mission";
    case "speak": return "/osez";
    case "pronlab": return "/pronlab";
    case "library": return "/library";
    case "review": return "/learn/review";
    case "grammar":
    case "listening":
    case "writing": return "/learn/labs";
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

  const progress = curriculumUnitProgress(unit, log);

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
          <Badge variant="outline">{progress}% étapes exécutées</Badge>
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
            const href = lessonLink(lesson.kind);
            const done = lessonDone(lesson, log);
            return (
              <div key={lesson.id} className="rounded-2xl bg-surface p-5 shadow-[var(--shadow-border)]">
                <Link
                  to={href}
                  className="group block"
                  onClick={() => setCurriculumLessonContext(lesson.id)}
                >
                  <div className="flex items-start gap-4">
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Icon className="size-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-subtle">0{index + 1} · {lesson.kind}</span>
                        <span className="text-xs tabular-nums text-muted">{lesson.minutes} min</span>
                        {done ? <Badge className="border-primary/20 bg-primary/10 text-primary">preuve enregistrée</Badge> : null}
                      </div>
                      <h3 className="mt-2 font-display text-2xl tracking-tight">{lesson.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-muted">{lesson.description}</p>
                    </div>
                    <ArrowRight className="mt-2 size-4 shrink-0 text-subtle transition group-hover:translate-x-0.5 group-hover:text-primary" />
                  </div>
                </Link>
                <div className="mt-4 border-t border-border pt-4">
                  <p className="text-xs leading-5 text-subtle">
                    {done
                      ? "Cette étape possède maintenant une preuve issue de l’activité reliée."
                      : "Ouvrez l’activité et terminez-la pour créer la preuve. Une simple déclaration ne complète plus l’étape."}
                  </p>
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
            className="inline-flex shrink-0 items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary"
          >
            Réviser maintenant <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </section>
    </Page>
  );
}
