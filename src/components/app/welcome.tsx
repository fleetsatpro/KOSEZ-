import { useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Clock3,
  Compass,
  Sparkles,
  Target,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { TODAY_MISSION } from "@/lib/blossom/data";
import { useBlossom } from "@/lib/blossom/store";
import { Wordmark } from "./primitives";

type StepId = "identity" | "level" | "goal" | "rhythm";

const STEPS: Array<{
  id: StepId;
  eyebrow: string;
  title: string;
  detail: string;
}> = [
  {
    id: "identity",
    eyebrow: "01 · VOUS",
    title: "Commençons par vous.",
    detail:
      "Quelques repères suffisent. K’Osez s’en servira pour choisir le bon niveau de pression, les bonnes situations et le bon rythme.",
  },
  {
    id: "level",
    eyebrow: "02 · REPÈRE",
    title: "Où en êtes-vous aujourd’hui ?",
    detail:
      "Ce n’est pas un examen. Votre réponse détermine simplement le point de départ des premières pratiques.",
  },
  {
    id: "goal",
    eyebrow: "03 · INTENTION",
    title: "Pour quoi voulez-vous parler ?",
    detail:
      "Le but devient un filtre pour les missions, les Speak Rooms et les exemples proposés par Léo.",
  },
  {
    id: "rhythm",
    eyebrow: "04 · RYTHME",
    title: "Installez un rythme que vous pourrez tenir.",
    detail:
      "Pas besoin d’une heure par jour. Une fenêtre réaliste donne au système un meilleur signal qu’une ambition impossible.",
  },
];

const LEVELS = [
  {
    id: "A1",
    title: "Je commence",
    detail:
      "Je peux saluer, me présenter et comprendre des phrases très simples.",
  },
  {
    id: "A2",
    title: "Je me débrouille",
    detail:
      "Je peux gérer des échanges familiers, mais je cherche encore mes mots.",
  },
  {
    id: "B1",
    title: "Je peux tenir l’échange",
    detail:
      "Je peux expliquer, raconter et relancer sur des sujets courants.",
  },
] as const;

const GOALS = [
  "Parler au travail",
  "Voyager avec plus d’aisance",
  "Comprendre les conversations",
  "Passer un cap à l’oral",
  "Me sentir plus spontané",
] as const;

const INTERESTS = [
  "Cuisine",
  "Océan",
  "Musique",
  "Voyage",
  "Travail",
  "Culture",
] as const;

const RHYTHMS = [
  {
    id: "07:00 – 08:00",
    label: "Matin",
    detail: "Avant que la journée commence.",
  },
  {
    id: "12:00 – 13:00",
    label: "Midi",
    detail: "Une respiration au milieu de la journée.",
  },
  {
    id: "18:00 – 19:00",
    label: "Soir",
    detail: "Quand le rythme professionnel retombe.",
  },
] as const;

const COACHES = [
  {
    id: "Posé",
    voice: "Posé, précis, jamais infantilisant.",
    detail: "Calme, précis, jamais infantilisant.",
  },
  {
    id: "Direct",
    voice: "Direct, concis, orienté action.",
    detail: "Plus de pression, peu de détour.",
  },
  {
    id: "Chaleureux",
    voice: "Chaleureux, humain, contextualisé.",
    detail: "Encourageant, humain, très contextualisé.",
  },
] as const;

function StepIcon({ step }: { step: StepId }) {
  const Icon =
    step === "identity"
      ? UserRound
      : step === "level"
        ? Compass
        : step === "goal"
          ? Target
          : Clock3;
  return <Icon className="size-4" strokeWidth={1.7} />;
}

export function Welcome() {
  const enter = useBlossom((s) => s.enter);
  const learner = useBlossom((s) => s.learner);
  const updateLearner = useBlossom((s) => s.updateLearner);

  const [stepIndex, setStepIndex] = useState(0);
  const [firstName, setFirstName] = useState(learner.firstName);
  const [level, setLevel] = useState(learner.level);
  const [goal, setGoal] = useState(learner.goal);
  const [interests, setInterests] = useState<string[]>(learner.interests);
  const [practiceWindow, setPracticeWindow] = useState(learner.practiceWindow);
  const [coachVoice, setCoachVoice] = useState(learner.coachVoice);

  const step = STEPS[stepIndex]!;
  const isLast = stepIndex === STEPS.length - 1;

  const canContinue = useMemo(() => {
    if (step.id === "identity") return firstName.trim().length >= 2;
    if (step.id === "level") return Boolean(level);
    if (step.id === "goal") return goal.trim().length >= 8;
    return Boolean(practiceWindow && coachVoice);
  }, [coachVoice, firstName, goal, level, practiceWindow, step.id]);

  function toggleInterest(interest: string) {
    setInterests((current) =>
      current.includes(interest)
        ? current.filter((item) => item !== interest)
        : current.length >= 4
          ? current
          : [...current, interest],
    );
  }

  function finish() {
    updateLearner({
      firstName: firstName.trim(),
      level,
      goal: goal.trim(),
      interests: interests.length ? interests : learner.interests,
      practiceWindow,
      coachVoice,
    });
    enter();
  }

  function next() {
    if (!canContinue) return;
    if (isLast) {
      finish();
      return;
    }
    setStepIndex((value) => value + 1);
  }

  function back() {
    setStepIndex((value) => Math.max(0, value - 1));
  }

  return (
    <main className="modern-ui kosez-welcome relative min-h-dvh overflow-hidden bg-fg text-primary-foreground">
      <img
        src="/images/botanical.jpg"
        alt=""
        className="absolute inset-0 h-full w-full object-cover opacity-55"
      />
      <div className="absolute inset-0 bg-fg/70" />

      <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-6xl flex-col px-5 py-6 sm:px-8 sm:py-8">
        <header className="flex items-center justify-between">
          <Wordmark inverted />
          <div className="hidden items-center gap-2 text-xs text-primary-foreground/55 sm:flex">
            <span className="size-1.5 rounded-full bg-primary-foreground/45" />
            Saint-Pierre · La Réunion
          </div>
        </header>

        <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center py-10 lg:py-12">
          <div className="grid gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:items-center">
            <section className="max-w-md">
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-primary-foreground/50">
                Votre BLOSSOM
              </p>
              <h1 className="mt-4 font-display text-5xl leading-[0.93] tracking-[-0.04em] sm:text-6xl">
                {step.title}
              </h1>
              <p className="mt-5 text-sm leading-7 text-primary-foreground/68 sm:text-base">
                {step.detail}
              </p>

              <div className="mt-8 grid gap-2" aria-label="Progression de configuration">
                {STEPS.map((item, index) => {
                  const active = index === stepIndex;
                  const complete = index < stepIndex;
                  return (
                    <div key={item.id} className="flex items-center gap-3 text-left">
                      <span
                        className={[
                          "flex size-9 shrink-0 items-center justify-center rounded-xl border transition-colors",
                          active
                            ? "border-primary/35 bg-primary text-primary-foreground"
                            : complete
                              ? "border-primary/20 bg-primary/10 text-primary"
                              : "border-primary-foreground/10 bg-primary-foreground/5 text-primary-foreground/35",
                        ].join(" ")}
                      >
                        {complete ? <Check className="size-4" /> : <StepIcon step={item.id} />}
                      </span>
                      <span className="min-w-0">
                        <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-primary-foreground/40">
                          {item.eyebrow}
                        </span>
                        <span
                          className={[
                            "mt-0.5 block text-sm",
                            active ? "text-primary-foreground" : "text-primary-foreground/45",
                          ].join(" ")}
                        >
                          {item.id === "identity"
                            ? "Identité"
                            : item.id === "level"
                              ? "Repère"
                              : item.id === "goal"
                                ? "Intention"
                                : "Rythme"}
                        </span>
                      </span>
                    </div>
                  );
                })}
              </div>

              <p className="mt-8 text-xs leading-5 text-primary-foreground/35">
                Vos choix restent modifiables dans MOI. L’objectif est de rendre les
                premières pratiques plus justes, pas de vous enfermer dans un profil.
              </p>
            </section>

            <section className="rounded-[28px] border border-primary-foreground/12 bg-fg/72 p-5 shadow-[var(--shadow-border)] backdrop-blur-sm sm:p-7">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary-foreground/45">
                    {step.eyebrow}
                  </p>
                  <p className="mt-2 font-display text-2xl tracking-tight sm:text-3xl">
                    Une configuration, puis vous entrez.
                  </p>
                </div>
                <span className="rounded-full border border-primary-foreground/10 bg-primary-foreground/5 px-3 py-1 text-[10px] tabular-nums text-primary-foreground/45">
                  {stepIndex + 1} / {STEPS.length}
                </span>
              </div>

              {step.id === "identity" ? (
                <div className="mt-8 space-y-6">
                  <label className="block">
                    <span className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-foreground/48">
                      Prénom
                    </span>
                    <input
                      autoFocus
                      value={firstName}
                      onChange={(event) => setFirstName(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") next();
                      }}
                      placeholder="Votre prénom"
                      maxLength={40}
                      className="mt-3 h-12 w-full rounded-xl border border-primary-foreground/12 bg-primary-foreground/5 px-4 text-sm text-primary-foreground outline-none placeholder:text-primary-foreground/30 focus:border-primary/40 focus:ring-2 focus:ring-primary/15"
                    />
                  </label>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-foreground/48">
                      La mission d’aujourd’hui
                    </p>
                    <div className="mt-3 rounded-2xl border border-primary-foreground/10 bg-primary-foreground/5 p-4">
                      <div className="flex items-center gap-2 text-xs text-primary-foreground/42">
                        <Sparkles className="size-3.5 text-primary" />
                        {TODAY_MISSION.durationMin} min · {TODAY_MISSION.level}
                      </div>
                      <p className="mt-3 font-display text-xl">{TODAY_MISSION.title}</p>
                      <p className="mt-2 text-sm leading-6 text-primary-foreground/52">
                        {TODAY_MISSION.prompt}
                      </p>
                    </div>
                  </div>
                </div>
              ) : null}

              {step.id === "level" ? (
                <div className="mt-8 grid gap-3">
                  {LEVELS.map((item) => {
                    const selected = level === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => setLevel(item.id)}
                        className={[
                          "min-h-20 rounded-2xl border px-4 py-4 text-left transition-colors",
                          selected
                            ? "border-primary/30 bg-primary/10 text-primary-foreground"
                            : "border-primary-foreground/10 bg-primary-foreground/4 text-primary-foreground/72 hover:bg-primary-foreground/7",
                        ].join(" ")}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary-foreground/40">
                              {item.id}
                            </span>
                            <p className="mt-1 font-medium">{item.title}</p>
                            <p className="mt-1 text-xs leading-5 text-primary-foreground/42">
                              {item.detail}
                            </p>
                          </div>
                          {selected ? <Check className="mt-1 size-4 shrink-0 text-primary" /> : null}
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : null}

              {step.id === "goal" ? (
                <div className="mt-8 space-y-6">
                  <div className="grid gap-2 sm:grid-cols-2">
                    {GOALS.map((item) => {
                      const selected = goal === item;
                      return (
                        <button
                          key={item}
                          type="button"
                          aria-pressed={selected}
                          onClick={() => setGoal(item)}
                          className={[
                            "min-h-14 rounded-xl border px-4 py-3 text-left text-sm transition-colors",
                            selected
                              ? "border-primary/30 bg-primary/10 text-primary-foreground"
                              : "border-primary-foreground/10 bg-primary-foreground/4 text-primary-foreground/68 hover:bg-primary-foreground/7",
                          ].join(" ")}
                        >
                          <span className="flex items-center justify-between gap-3">
                            {item}
                            {selected ? <Check className="size-4 text-primary" /> : null}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <label className="block">
                    <span className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-foreground/48">
                      Ou formulez-le à votre manière
                    </span>
                    <input
                      value={goal}
                      onChange={(event) => setGoal(event.target.value)}
                      maxLength={140}
                      className="mt-3 h-12 w-full rounded-xl border border-primary-foreground/12 bg-primary-foreground/5 px-4 text-sm text-primary-foreground outline-none placeholder:text-primary-foreground/30 focus:border-primary/40 focus:ring-2 focus:ring-primary/15"
                      placeholder="Ex. : prendre la parole avec mes clients"
                    />
                  </label>

                  <div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-foreground/48">
                        Ce qui vous intéresse
                      </span>
                      <span className="text-[10px] tabular-nums text-primary-foreground/32">
                        {interests.length} / 4
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {INTERESTS.map((interest) => {
                        const selected = interests.includes(interest);
                        return (
                          <button
                            key={interest}
                            type="button"
                            aria-pressed={selected}
                            onClick={() => toggleInterest(interest)}
                            className={[
                              "min-h-11 rounded-full border px-3.5 text-xs font-medium transition-colors",
                              selected
                                ? "border-primary/25 bg-primary/10 text-primary"
                                : "border-primary-foreground/10 bg-primary-foreground/4 text-primary-foreground/58 hover:bg-primary-foreground/7",
                            ].join(" ")}
                          >
                            {interest}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : null}

              {step.id === "rhythm" ? (
                <div className="mt-8 space-y-7">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-foreground/48">
                      Votre fenêtre de pratique
                    </p>
                    <div className="mt-3 grid gap-2">
                      {RHYTHMS.map((item) => {
                        const selected = practiceWindow === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            aria-pressed={selected}
                            onClick={() => setPracticeWindow(item.id)}
                            className={[
                              "flex min-h-16 items-center justify-between gap-4 rounded-xl border px-4 py-3 text-left transition-colors",
                              selected
                                ? "border-primary/30 bg-primary/10"
                                : "border-primary-foreground/10 bg-primary-foreground/4 hover:bg-primary-foreground/7",
                            ].join(" ")}
                          >
                            <span>
                              <span className="block text-sm font-medium text-primary-foreground/88">
                                {item.label}
                              </span>
                              <span className="mt-0.5 block text-xs text-primary-foreground/40">
                                {item.detail}
                              </span>
                            </span>
                            <span className="text-xs tabular-nums text-primary-foreground/38">{item.id}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-foreground/48">
                      Comment Léo doit vous accompagner
                    </p>
                    <div className="mt-3 grid gap-2 sm:grid-cols-3">
                      {COACHES.map((item) => {
                        const selected = coachVoice === item.voice;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            aria-pressed={selected}
                            onClick={() => setCoachVoice(item.voice)}
                            className={[
                              "min-h-24 rounded-xl border px-3 py-3 text-left transition-colors",
                              selected
                                ? "border-primary/30 bg-primary/10"
                                : "border-primary-foreground/10 bg-primary-foreground/4 hover:bg-primary-foreground/7",
                            ].join(" ")}
                          >
                            <span className="text-sm font-medium text-primary-foreground/88">{item.id}</span>
                            <span className="mt-1.5 block text-xs leading-5 text-primary-foreground/40">
                              {item.detail}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-primary/15 bg-primary/8 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                      Ce que K’Osez va faire avec ces choix
                    </p>
                    <p className="mt-2 text-sm leading-6 text-primary-foreground/56">
                      Adapter vos missions, les Speak Rooms et certaines relances à
                      votre niveau, vos centres d’intérêt et votre manière préférée d’être coaché.
                    </p>
                  </div>
                </div>
              ) : null}

              <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Button
                  type="button"
                  variant="ghost"
                  disabled={stepIndex === 0}
                  onClick={back}
                  className="min-h-11 text-primary-foreground/55 hover:bg-primary-foreground/5 hover:text-primary-foreground"
                >
                  <ArrowLeft className="size-4" />
                  Retour
                </Button>

                <Button
                  type="button"
                  disabled={!canContinue}
                  onClick={next}
                  className="min-h-11 bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {isLast ? "Entrer dans BLOSSOM" : "Continuer"}
                  <ArrowRight className="size-4" />
                </Button>
              </div>
            </section>
          </div>
        </div>

        <footer className="flex items-center justify-between gap-4 border-t border-primary-foreground/10 pt-4 text-[11px] text-primary-foreground/30">
          <span>Une pratique utile vaut mieux qu’une séance parfaite.</span>
          <span className="hidden sm:inline">K’Osez · Saint-Pierre</span>
        </footer>
      </div>
    </main>
  );
}
