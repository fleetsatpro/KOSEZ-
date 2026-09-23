import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { toast } from "sonner";
import {
  ArrowRight,
  BookOpen,
  Check,
  ChevronRight,
  Lock,
  ChartNoAxesCombined,
  GraduationCap,
  FlaskConical,
  History,
  Mic2,
  RotateCcw,
  Sparkles,
  Target,
} from "lucide-react";
import { Eyebrow, Page, Surface } from "@/components/app/primitives";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  CATALOGUE,
  LIBRARY,
  planAllows,
  setsForLanguage,
} from "@/lib/blossom/data";
import { summarisePronlabItem } from "@/lib/blossom/engine";
import { buildSkillProfile, CURRICULUM_UNITS } from "@/lib/blossom/learning-os";
import { buildReviewPlan } from "@/lib/blossom/review-scheduler";
import { buildLearningIntelligence, buildWeeklyLearningBrief } from "@/lib/blossom/learning-intelligence";
import { isSetUnlocked, useBlossom, useJourney } from "@/lib/blossom/store";
import { cn } from "@/lib/utils";

const PILLARS = [
  {
    key: "speak",
    label: "Parole",
    title: "Osez parler",
    detail: "Des situations réelles, sans traduction live.",
    to: "/osez",
    icon: Mic2,
    tone: "bg-primary text-primary-foreground",
  },
  {
    key: "pronlab",
    label: "Pron'Lab",
    title: "Affiner",
    detail: "Travailler le son qui vous ralentit vraiment.",
    to: "/pronlab",
    icon: Target,
    tone: "bg-surface-2 text-fg",
  },
  {
    key: "library",
    label: "Bibliothèque",
    title: "Lire & garder",
    detail: "Quelques textes, du vocabulaire qui revient.",
    to: "/library",
    icon: BookOpen,
    tone: "bg-surface text-fg",
  },
  {
    key: "immersion",
    label: "Immersion",
    title: "Sortir du cours",
    detail: "Préparer, vivre et raconter l'expérience.",
    to: "/immersion",
    icon: Sparkles,
    tone: "bg-fg text-primary-foreground",
  },
] as const;

function NextActionLink({
  action,
  className,
  children,
}: {
  action: ReturnType<typeof buildLearningIntelligence>["next"];
  className?: string;
  children: ReactNode;
}) {
  switch (action.kind) {
    case "pronlab":
      return (
        <Link to="/pronlab" className={className}>
          {children}
        </Link>
      );
    case "library":
      return (
        <Link to="/library" className={className}>
          {children}
        </Link>
      );
    case "mission":
      return (
        <Link to="/mission" search={{ missionId: undefined }} className={className}>
          {children}
        </Link>
      );
    case "labs":
      return (
        <Link
          to="/learn/labs"
          search={{ lab: action.labKind, task: action.targetId }}
          className={className}
        >
          {children}
        </Link>
      );
    case "review":
      return (
        <Link to="/learn/review" search={{ focus: action.targetId }} className={className}>
          {children}
        </Link>
      );
  }
}

export function LearnDashboard() {
  const enrolledIds = useBlossom((s) => s.enrolledIds);
  const bookingStatuses = useBlossom((s) => s.bookingStatuses);
  const syncOwnerUserId = useBlossom((s) => s.syncOwnerUserId);
  const log = useBlossom((s) => s.activityLog);
  const homework = useBlossom((s) => s.homework).filter(
    (item) =>
      item.studentId === syncOwnerUserId &&
      (item.status === "sent" || item.status === "done"),
  );
  const completeHomework = useBlossom((s) => s.completeHomework);
  const vocab = useBlossom((s) => s.vocabulary);
  const attempts = useBlossom((s) => s.pronlabAttempts);
  const submissions = useBlossom((s) => s.learningSubmissions);
  const assigned = useBlossom((s) => s.assignedSetIds);
  const plan = useBlossom((s) => s.plan);
  const journey = useJourney();
  const skillProfile = buildSkillProfile(log, attempts, vocab);
  const reviewPlan = buildReviewPlan(submissions, attempts, vocab);
  const intelligence = buildLearningIntelligence(
    log,
    attempts,
    vocab,
    submissions,
    reviewPlan,
  );
  const weeklyBrief = buildWeeklyLearningBrief(
    log,
    attempts,
    vocab,
    submissions,
  );
  const nextAction = intelligence.next;

  const sets = setsForLanguage(useBlossom((s) => s.languageId));
  const libraryOk = planAllows(plan, "library");

  const activeHomework = homework.find((item) => item.status === "sent") ?? null;
  const enrolled = CATALOGUE.filter((item) => enrolledIds.includes(item.id));
  const activeSet = sets.find((set) => {
    if (!isSetUnlocked(set.id, attempts, assigned)) return false;
    return set.items.some((item) => summarisePronlabItem(item.id, attempts).attemptCount === 0);
  });

  const activeSetStarted = activeSet
    ? activeSet.items.filter((item) => summarisePronlabItem(item.id, attempts).attemptCount > 0).length
    : 0;
  const activeSetMastered = activeSet
    ? activeSet.items.filter((item) => summarisePronlabItem(item.id, attempts).mastered).length
    : 0;


  const ContinueIcon = activeHomework ? RotateCcw : activeSet ? Target : libraryOk && LIBRARY[0] ? BookOpen : Mic2;

  return (
    <Page className="kosez-feature-page">
      <header className="relative overflow-hidden rounded-[28px] bg-surface p-6 shadow-[var(--shadow-border)] sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-20 size-64 rounded-full border border-primary/10" />
        <div className="pointer-events-none absolute -bottom-28 right-16 size-72 rounded-full bg-primary/5 blur-3xl" />

        <div className="relative max-w-3xl">
          <Eyebrow>LEARN · votre atelier</Eyebrow>
          <h1 className="mt-3 max-w-3xl font-display text-[clamp(2.35rem,5vw,4.4rem)] leading-[0.96] tracking-[-0.04em]">
            Apprendre ce qui sert <span className="text-primary">cette semaine.</span>
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-muted sm:text-base">
            Pas un catalogue. Un espace pour reprendre le bon exercice, consolider
            un son, garder quelques mots et transformer le cours en expérience réelle.
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-primary/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">
              {journey.stage.label}
            </span>
            <span className="rounded-full bg-surface-2 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
              {journey.points} points
            </span>
            <span className="rounded-full bg-surface-2 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
              {vocab.length} mot{vocab.length === 1 ? "" : "s"} gardé{vocab.length === 1 ? "" : "s"}
            </span>
          </div>
        </div>
      </header>

      <section className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(18rem,0.75fr)]">
        <article className="rounded-2xl bg-fg p-5 text-primary-foreground shadow-[var(--shadow-border)] sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Eyebrow className="text-primary-foreground/55">{activeHomework ? "À faire avec Léa" : activeSet ? "À reprendre" : libraryOk && LIBRARY[0] ? "Prochaine lecture" : "Prochaine expérience"}</Eyebrow>
              <h2 className="mt-2 max-w-xl font-display text-3xl tracking-tight sm:text-4xl">
                {activeHomework ? activeHomework.title : activeSet ? activeSet.title : libraryOk && LIBRARY[0] ? LIBRARY[0].title : "Une salle de parole vous attend"}
              </h2>
            </div>
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary-foreground/10">
              <ContinueIcon className="size-5" strokeWidth={1.7} />
            </span>
          </div>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-primary-foreground/70">
            {intelligence.next.body}
          </p>
          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            {intelligence.next.reasons.slice(0, 2).map((reason) => (
              <div key={reason} className="rounded-xl bg-primary-foreground/7 px-3.5 py-3 text-xs leading-5 text-primary-foreground/65">
                {reason}
              </div>
            ))}
          </div>
          {activeHomework ? (
            <Button
              size="lg"
              className="mt-6 bg-primary-foreground text-fg hover:bg-primary-foreground/90"
              onClick={() => {
                completeHomework(activeHomework.id);
                toast("Travail noté dans votre parcours.");
              }}
            >
              <Check className="size-4" />
              Marquer comme fait
            </Button>
          ) : activeSet ? (
            <Button
              asChild
              size="lg"
              className="mt-6 bg-primary-foreground text-fg hover:bg-primary-foreground/90"
            >
              <Link to="/pronlab/$setId" params={{ setId: activeSet.id }}>
                Reprendre
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          ) : libraryOk && LIBRARY[0] ? (
            <Button
              asChild
              size="lg"
              className="mt-6 bg-primary-foreground text-fg hover:bg-primary-foreground/90"
            >
              <Link to="/library/$id" params={{ id: LIBRARY[0].id }}>
                Lire
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          ) : (
            <Button
              asChild
              size="lg"
              className="mt-6 bg-primary-foreground text-fg hover:bg-primary-foreground/90"
            >
              <Link to="/osez">
                Osez parler
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          )}
        </article>

        <article className="rounded-2xl bg-surface p-5 shadow-[var(--shadow-border)] sm:p-6">
          <Eyebrow>Pron'Lab · état</Eyebrow>
          <div className="mt-3 flex items-end justify-between gap-4">
            <div>
              <p className="font-display text-3xl leading-none tabular-nums">
                {activeSet ? activeSetMastered : journey.pronlab.current}
              </p>
              <p className="mt-1 text-xs text-muted">
                {activeSet ? "maîtrisés dans le set actif" : "séances du parcours"}
              </p>
            </div>
            <Target className="size-5 text-primary" strokeWidth={1.7} />
          </div>
          <Progress
            className="mt-5 h-2"
            value={
              activeSet
                ? (activeSetMastered / Math.max(activeSet.items.length, 1)) * 100
                : (journey.pronlab.current / Math.max(journey.pronlab.required, 1)) * 100
            }
          />
          <p className="mt-3 text-xs leading-5 text-muted">
            {activeSet
              ? activeSetStarted + " sur " + activeSet.items.length + " items déjà ouverts."
              : "Votre prochaine série se débloquera dans le laboratoire."}
          </p>
          <Link
            to="/pronlab"
            className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-primary"
          >
            Ouvrir Pron'Lab
            <ArrowRight className="size-3.5" />
          </Link>
        </article>
      </section>


      <section className="mt-8 grid gap-4 lg:grid-cols-3">
        <article className="rounded-2xl bg-surface p-5 shadow-[var(--shadow-border)] sm:p-6">
          <Eyebrow>Momentum · 14 jours</Eyebrow>
          <div className="mt-3 flex items-end justify-between gap-4">
            <p className="font-display text-4xl tabular-nums">{intelligence.momentum}%</p>
            <span className="text-xs text-muted">{intelligence.activeDays14} jours actifs</span>
          </div>
          <Progress className="mt-4 h-1.5" value={intelligence.momentum} />
          <p className="mt-3 text-xs leading-5 text-muted">Mesure de régularité, pas de niveau.</p>
        </article>
        <article className="rounded-2xl bg-surface p-5 shadow-[var(--shadow-border)] sm:p-6">
          <Eyebrow>Breadth · couverture</Eyebrow>
          <div className="mt-3 flex items-end justify-between gap-4">
            <p className="font-display text-4xl tabular-nums">{intelligence.breadth}%</p>
            <span className="text-xs text-muted">{skillProfile.filter((item) => item.evidenceCount > 0).length}/{skillProfile.length} domaines</span>
          </div>
          <Progress className="mt-4 h-1.5" value={intelligence.breadth} />
          <p className="mt-3 text-xs leading-5 text-muted">Largeur des traces observées dans le parcours.</p>
        </article>
        <article className="rounded-2xl border border-primary/15 bg-primary/5 p-5 shadow-[var(--shadow-border)] sm:p-6">
          <Eyebrow>Mémoire · maintenant</Eyebrow>
          <p className="mt-3 font-display text-4xl tabular-nums text-primary">{intelligence.dueNow}</p>
          <p className="mt-1 text-xs text-muted">rappel{intelligence.dueNow === 1 ? "" : "s"} dû{intelligence.dueNow === 1 ? "" : "s"} aujourd'hui</p>
          <Link to="/learn/review" search={{ focus: undefined }} className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-primary">
            Ouvrir la mémoire <ArrowRight className="size-3.5" />
          </Link>
        </article>
      </section>

      <section className="mt-8 rounded-2xl bg-surface p-5 shadow-[var(--shadow-border)] sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl">
            <Eyebrow>Cette semaine · lecture du parcours</Eyebrow>
            <h2 className="mt-2 font-display text-2xl tracking-tight sm:text-3xl">{weeklyBrief.headline}</h2>
            <p className="mt-3 text-sm leading-6 text-muted">
              Cette vue rassemble les traces datées de la semaine pour éviter de confondre activité ponctuelle, régularité et compétence réellement observée.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            <div className="rounded-xl bg-surface-2/55 px-3.5 py-3">
              <p className="text-[10px] uppercase tracking-[0.16em] text-subtle">Jours actifs</p>
              <p className="mt-1 font-display text-2xl tabular-nums">{weeklyBrief.activeDays}</p>
            </div>
            <div className="rounded-xl bg-surface-2/55 px-3.5 py-3">
              <p className="text-[10px] uppercase tracking-[0.16em] text-subtle">Preuves</p>
              <p className="mt-1 font-display text-2xl tabular-nums">{weeklyBrief.evidenceCount}</p>
            </div>
            <div className="rounded-xl bg-primary/8 px-3.5 py-3">
              <p className="text-[10px] uppercase tracking-[0.16em] text-subtle">Rappel</p>
              <p className="mt-1 font-display text-2xl tabular-nums text-primary">{weeklyBrief.reviewAccuracy === null ? "—" : `${weeklyBrief.reviewAccuracy}%`}</p>
            </div>
          </div>
        </div>
        <div className="mt-5 grid gap-3 lg:grid-cols-3">
          {weeklyBrief.highlights.map((highlight) => (
            <div key={highlight} className="rounded-xl border border-border bg-surface-2/35 p-4 text-sm leading-6 text-muted">
              {highlight}
            </div>
          ))}
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <Link to="/learn/history" className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-primary">
            Inspecter les traces <ArrowRight className="size-3.5" />
          </Link>
          <span className="text-subtle">·</span>
          <Link to="/learn/progress" className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-primary">
            Voir les compétences <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </section>

      <section className="mt-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <Eyebrow>Votre méthode</Eyebrow>
            <h2 className="mt-2 font-display text-2xl tracking-tight sm:text-3xl">
              Quatre façons de faire bouger la langue.
            </h2>
          </div>
          <p className="hidden text-right text-xs text-subtle sm:block">
            Chaque espace a un rôle.
          </p>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {PILLARS.map((pillar) => {
            const Icon = pillar.icon;
            const locked = pillar.key === "library" && !libraryOk;
            return (
              <Link
                key={pillar.key}
                to={locked ? "/learn" : pillar.to}
                className={cn(
                  "group min-h-48 rounded-2xl p-5 shadow-[var(--shadow-border)] transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-border-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
                  pillar.tone,
                  locked && "cursor-default opacity-80",
                )}
                aria-label={locked ? "Bibliothèque verrouillée" : pillar.title}
              >
                <div className="flex items-start justify-between gap-3">
                  <span
                    className={cn(
                      "flex size-10 items-center justify-center rounded-xl",
                      pillar.key === "speak" || pillar.key === "immersion"
                        ? "bg-primary-foreground/10"
                        : "bg-primary/10 text-primary",
                    )}
                  >
                    {locked ? (
                      <Lock className="size-4" />
                    ) : (
                      <Icon className="size-4" strokeWidth={1.7} />
                    )}
                  </span>
                  <ChevronRight className="size-4 opacity-45 transition-transform group-hover:translate-x-0.5" />
                </div>
                <p className="mt-7 text-[10px] font-semibold uppercase tracking-[0.18em] opacity-65">
                  {pillar.label}
                </p>
                <h3 className="mt-2 font-display text-2xl tracking-tight">{pillar.title}</h3>
                <p className="mt-1 text-sm leading-5 opacity-70">
                  {locked ? "Accessible avec Premium ou le centre." : pillar.detail}
                </p>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="mt-8 grid gap-4 lg:grid-cols-[1fr_0.86fr]">
        <article className="rounded-2xl bg-surface p-5 shadow-[var(--shadow-border)] sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Eyebrow>Parcours actuel</Eyebrow>
              <h2 className="mt-2 font-display text-2xl tracking-tight">
                Ce que vous avez choisi de suivre.
              </h2>
            </div>
            <span className="rounded-full bg-surface-2 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
              {enrolled.length} demande{enrolled.length > 1 ? "s" : ""}
            </span>
          </div>

          {enrolled.length === 0 ? (
            <div className="mt-6 rounded-xl bg-surface-2/60 p-5">
              <p className="font-display text-xl">Aucun parcours actif.</p>
              <p className="mt-2 text-sm leading-6 text-muted">
                Demandez une inscription pour donner un cadre stable à votre semaine.
              </p>
            </div>
          ) : (
            <div className="mt-5 space-y-3">
              {enrolled.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-4 rounded-xl border border-border bg-surface-2/45 p-3.5"
                >
                  <img
                    src={item.image}
                    alt=""
                    className="size-16 shrink-0 rounded-lg object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-lg leading-tight">{item.title}</p>
                    <p className="mt-1 text-xs text-muted">
                      {item.level} · {item.format} · {item.schedule}
                    </p>
                  </div>
                  <Badge>
                    {bookingStatuses[item.id] === "confirmed"
                      ? "Confirmé"
                      : "Demande envoyée"}
                  </Badge>
                </div>
              ))}
            </div>
          )}

          <div className="mt-5 border-t border-border pt-4">
            <p className="text-xs text-muted">
              {CATALOGUE.length} formats structurent actuellement le catalogue, en complément des pratiques libres.
            </p>
          </div>
        </article>

        <article className="rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-border)] sm:p-6">
          <Eyebrow>Vocabulaire vivant</Eyebrow>
          <div className="mt-3 flex items-end justify-between gap-4">
            <div>
              <p className="font-display text-4xl leading-none tabular-nums">{vocab.length}</p>
              <p className="mt-1 text-xs text-muted">mots gardés pour revenir plus tard</p>
            </div>
            <BookOpen className="size-5 text-primary" strokeWidth={1.7} />
          </div>

          {vocab.length === 0 ? (
            <p className="mt-6 rounded-xl bg-surface-2/60 p-4 text-sm leading-6 text-muted">
              Touchez un mot dans la bibliothèque. Il devient un repère, pas une
              ligne de plus dans une liste.
            </p>
          ) : (
            <div className="mt-6 flex flex-wrap gap-2">
              {vocab.slice(-8).map((word) => (
                <span
                  key={word.word}
                  className="rounded-full bg-surface-2 px-3 py-1.5 text-xs font-medium"
                  title={word.gloss}
                >
                  {word.word}
                </span>
              ))}
            </div>
          )}

          <Link
            to={libraryOk ? "/library" : "/learn"}
            className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-primary"
          >
            {libraryOk ? "Entrer dans la bibliothèque" : "Voir l'accès"}
            <ArrowRight className="size-3.5" />
          </Link>
        </article>
      </section>

      <section className="mt-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <Eyebrow>Collections Pron'Lab</Eyebrow>
            <h2 className="mt-2 font-display text-2xl tracking-tight">
              Votre laboratoire, sans parcours imposé.
            </h2>
          </div>
          <Link
            to="/pronlab"
            className="hidden items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-primary sm:inline-flex"
          >
            Tout voir
            <ArrowRight className="size-3.5" />
          </Link>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {sets.slice(0, 3).map((set) => {
            const unlocked = isSetUnlocked(set.id, attempts, assigned);
            const summaries = set.items.map((item) =>
              summarisePronlabItem(item.id, attempts),
            );
            const mastered = summaries.filter((item) => item.mastered).length;
            const started = summaries.filter((item) => item.attemptCount > 0).length;

            return (
              <Link
                key={set.id}
                to={unlocked ? "/pronlab/$setId" : "/pronlab"}
                params={unlocked ? { setId: set.id } : undefined}
                className="group rounded-2xl bg-surface p-5 shadow-[var(--shadow-border)] transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-border-hover)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
                    {set.kind}
                  </span>
                  {unlocked ? (
                    <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-semibold tabular-nums text-primary">
                      {mastered}/{set.items.length}
                    </span>
                  ) : (
                    <Lock className="size-4 text-subtle" />
                  )}
                </div>
                <h3 className="mt-4 font-display text-2xl tracking-tight">{set.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted">{set.blurb}</p>
                <Progress className="mt-5" value={(mastered / Math.max(set.items.length, 1)) * 100} />
                <p className="mt-2 text-[11px] text-subtle">
                  {started} commencé{started > 1 ? "s" : ""} · {mastered} maîtrisé{mastered > 1 ? "s" : ""}
                </p>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="mt-10 grid gap-4 lg:grid-cols-[1.15fr_.85fr]">
        <NextActionLink
          action={nextAction}
          className="group relative overflow-hidden rounded-2xl bg-fg p-6 text-primary-foreground shadow-[var(--shadow-border)] sm:p-7"
        >
          <div className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full border border-primary-foreground/10" />
          <div className="relative">
            <Eyebrow className="text-primary-foreground/55">PROCHAINE ACTION · mémoire</Eyebrow>
            <h2 className="mt-3 max-w-2xl font-display text-3xl tracking-tight sm:text-4xl">
              {nextAction.title}
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-primary-foreground/65">
              {nextAction.body}
            </p>
            <span className="mt-6 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
              Réviser maintenant <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
            </span>
          </div>
        </NextActionLink>

        <Surface>
          <Eyebrow>Profil vivant</Eyebrow>
          <div className="mt-4 grid grid-cols-2 gap-x-5 gap-y-4">
            {skillProfile.slice(0, 6).map((entry) => (
              <div key={entry.domain.id}>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-muted">{entry.domain.shortLabel}</span>
                  <span className="text-xs tabular-nums text-primary">{entry.coverage}%</span>
                </div>
                <Progress className="mt-2 h-1.5" value={entry.coverage} />
              </div>
            ))}
          </div>
          <Link to="/learn/progress" className="mt-6 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-primary">
            Voir les 9 domaines <ChartNoAxesCombined className="size-3.5" />
          </Link>
        </Surface>
      </section>

      <section className="mt-10">
        <div className="flex items-end justify-between gap-4">
          <div>
            <Eyebrow>Architecture du parcours</Eyebrow>
            <h2 className="mt-2 font-display text-2xl tracking-tight sm:text-3xl">Les modules sont désormais reliés entre eux.</h2>
          </div>
          <Link to="/learn/curriculum" className="hidden text-xs font-semibold uppercase tracking-[0.14em] text-primary sm:inline-flex">
            Ouvrir le parcours <ArrowRight className="ml-1 size-3.5" />
          </Link>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Link to="/learn/curriculum" className="group rounded-xl border border-border bg-surface p-4 transition hover:border-primary/20 hover:bg-surface-2/60">
            <GraduationCap className="size-4 text-primary" />
            <p className="mt-5 font-display text-xl tracking-tight">Parcours</p>
            <p className="mt-1 text-xs text-muted">
              {CURRICULUM_UNITS.length} unités ·{" "}
              {CURRICULUM_UNITS.reduce((total, unit) => total + unit.lessons.length, 0)} pratiques · A1 → B1
            </p>
          </Link>
          <Link to="/learn/review" search={{ focus: undefined }} className="group rounded-xl border border-border bg-surface p-4 transition hover:border-primary/20 hover:bg-surface-2/60">
            <RotateCcw className="size-4 text-primary" />
            <p className="mt-5 font-display text-xl tracking-tight">Révision</p>
            <p className="mt-1 text-xs text-muted">Mémoire en circulation</p>
          </Link>
          <Link to="/learn/progress" className="group rounded-xl border border-border bg-surface p-4 transition hover:border-primary/20 hover:bg-surface-2/60">
            <ChartNoAxesCombined className="size-4 text-primary" />
            <p className="mt-5 font-display text-xl tracking-tight">Compétences</p>
            <p className="mt-1 text-xs text-muted">
              {skillProfile.filter((item) => item.evidenceCount > 0).length}/{skillProfile.length} avec preuve
            </p>
          </Link>
          <Link to="/learn/history" className="group rounded-xl border border-border bg-surface p-4 transition hover:border-primary/20 hover:bg-surface-2/60">
            <History className="size-4 text-primary" />
            <p className="mt-5 font-display text-xl tracking-tight">Historique</p>
            <p className="mt-1 text-xs text-muted">Actions + preuves</p>
          </Link>
          <Link to="/learn/labs" search={{ lab: undefined, task: undefined }} className="group rounded-xl border border-border bg-surface p-4 transition hover:border-primary/20 hover:bg-surface-2/60">
            <FlaskConical className="size-4 text-primary" />
            <p className="mt-5 font-display text-xl tracking-tight">Labs</p>
            <p className="mt-1 text-xs text-muted">Grammaire · écoute · écrit</p>
          </Link>
        </div>
      </section>

      <p className="mx-auto mt-10 max-w-2xl text-center text-xs leading-5 text-subtle">
        Votre apprentissage n'est pas une file d'attente de contenu. Il suit
        ce que vous faites, ce que vous évitez et ce que vous êtes prêt à dire.
      </p>
    </Page>
  );
}
