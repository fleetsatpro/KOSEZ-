import { useMemo, useState } from "react";
import { useMessages } from "@/lib/i18n";
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
import { todayMissionForLevel } from "@/lib/blossom/mission-today";
import { useBlossom } from "@/lib/blossom/store";
import { Wordmark } from "./primitives";

type StepId = "identity" | "level" | "goal" | "rhythm";

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
  const m = useMessages();
  const enter = useBlossom((s) => s.enter);
  const learner = useBlossom((s) => s.learner);
  const languageId = useBlossom((s) => s.languageId);
  const updateLearner = useBlossom((s) => s.updateLearner);

  const [stepIndex, setStepIndex] = useState(0);
  const [firstName, setFirstName] = useState(learner.firstName);
  const [level, setLevel] = useState(learner.level);
  const [goal, setGoal] = useState(learner.goal);
  const [interests, setInterests] = useState<string[]>(learner.interests);
  const [practiceWindow, setPracticeWindow] = useState(learner.practiceWindow);
  const [coachVoice, setCoachVoice] = useState(learner.coachVoice);

  const steps = [
    { id: "identity" as const, ...m.welcome.steps.identity },
    { id: "level" as const, ...m.welcome.steps.level },
    { id: "goal" as const, ...m.welcome.steps.goal },
    { id: "rhythm" as const, ...m.welcome.steps.rhythm },
  ];
  const levels = [
    { id: "A1", ...m.welcome.levels.A1 },
    { id: "A2", ...m.welcome.levels.A2 },
    { id: "B1", ...m.welcome.levels.B1 },
  ] as const;
  const goals = m.welcome.goals;
  const interestsCatalog = m.welcome.interests;
  const rhythms = [
    { id: "07:00 – 08:00", ...m.welcome.rhythms.morning },
    { id: "12:00 – 13:00", ...m.welcome.rhythms.noon },
    { id: "18:00 – 19:00", ...m.welcome.rhythms.evening },
  ] as const;
  const coaches = [
    { id: "Posé", ...m.welcome.coaches.calm },
    { id: "Direct", ...m.welcome.coaches.direct },
    { id: "Chaleureux", ...m.welcome.coaches.warm },
  ];
  const step = steps[stepIndex]!;
  const isLast = stepIndex === steps.length - 1;
  const todayMission = languageId === "en" ? todayMissionForLevel(level || learner.level) : null;

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
            {m.welcome.location}
          </div>
        </header>

        <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center py-10 lg:py-12">
          <div className="grid gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:items-center">
            <section className="max-w-md">
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-primary-foreground/50">
                {m.welcome.yourBlossom}
              </p>
              <h1 className="mt-4 font-display text-5xl leading-[0.93] tracking-[-0.04em] sm:text-6xl">
                {step.title}
              </h1>
              <p className="mt-5 text-sm leading-7 text-primary-foreground/68 sm:text-base">
                {step.detail}
              </p>

              <div className="mt-8 grid gap-2" aria-label="Progression de configuration">
                {steps.map((item, index) => {
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
                    {m.welcome.configTitle}
                  </p>
                </div>
                <span className="rounded-full border border-primary-foreground/10 bg-primary-foreground/5 px-3 py-1 text-[10px] tabular-nums text-primary-foreground/45">
                  {stepIndex + 1} / {steps.length}
                </span>
              </div>

              {step.id === "identity" ? (
                <div className="mt-8 space-y-6">
                  <label className="block">
                    <span className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-foreground/48">
                      {m.welcome.firstName}
                    </span>
                    <input
                      autoFocus
                      value={firstName}
                      onChange={(event) => setFirstName(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") next();
                      }}
                      placeholder={m.welcome.firstNamePlaceholder}
                      maxLength={40}
                      className="mt-3 h-12 w-full rounded-xl border border-primary-foreground/12 bg-primary-foreground/5 px-4 text-sm text-primary-foreground outline-none placeholder:text-primary-foreground/30 focus:border-primary/40 focus:ring-2 focus:ring-primary/15"
                    />
                  </label>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-foreground/48">
                      {m.welcome.todayMission}
                    </p>
                    <div className="mt-3 rounded-2xl border border-primary-foreground/10 bg-primary-foreground/5 p-4">
                      <div className="flex items-center gap-2 text-xs text-primary-foreground/42">
                        <Sparkles className="size-3.5 text-primary" />
                        {todayMission.durationMin} min · {todayMission.level}
                      </div>
                      <p className="mt-3 font-display text-xl">{todayMission.title}</p>
                      <p className="mt-2 text-sm leading-6 text-primary-foreground/52">
                        {todayMission.prompt}
                      </p>
                    </div>
                  </div>
                </div>
              ) : null}

              {step.id === "level" ? (
                <div className="mt-8 grid gap-3">
                  {levels.map((item) => {
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
                    {goals.map((item) => {
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
                      {m.welcome.orFormulate}
                    </span>
                    <input
                      value={goal}
                      onChange={(event) => setGoal(event.target.value)}
                      maxLength={140}
                      className="mt-3 h-12 w-full rounded-xl border border-primary-foreground/12 bg-primary-foreground/5 px-4 text-sm text-primary-foreground outline-none placeholder:text-primary-foreground/30 focus:border-primary/40 focus:ring-2 focus:ring-primary/15"
                      placeholder="{m.welcome.goalPlaceholder}"
                    />
                  </label>

                  <div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-foreground/48">
                        {m.welcome.whatInterests}
                      </span>
                      <span className="text-[10px] tabular-nums text-primary-foreground/32">
                        {interests.length} / 4
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {interestsCatalog.map((interest) => {
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
                      {m.welcome.practiceWindow}
                    </p>
                    <div className="mt-3 grid gap-2">
                      {rhythms.map((item) => {
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
                              <span className="mt-0.5 block text-xs text-primary-foreground/42">
                                {item.detail}
                              </span>
                            </span>
                            <span className="text-[10px] tabular-nums text-primary-foreground/40">
                              {item.id}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-foreground/48">
                      {m.welcome.coachTitle}
                    </p>
                    <div className="mt-3 grid gap-2 sm:grid-cols-3">
                      {coaches.map((item) => {
                        const selected = coachVoice === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            aria-pressed={selected}
                            onClick={() => setCoachVoice(item.id)}
                            className={[
                              "min-h-20 rounded-xl border px-3 py-3 text-left transition-colors",
                              selected
                                ? "border-primary/30 bg-primary/10"
                                : "border-primary-foreground/10 bg-primary-foreground/4 hover:bg-primary-foreground/7",
                            ].join(" ")}
                          >
                            <span className="block text-sm font-medium text-primary-foreground/88">
                              {item.id}
                            </span>
                            <span className="mt-1 block text-[11px] leading-4 text-primary-foreground/42">
                              {item.detail}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="mt-8 flex items-center justify-between gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={back}
                  disabled={stepIndex === 0}
                  className="text-primary-foreground/55 hover:text-primary-foreground"
                >
                  <ArrowLeft className="size-4" />
                  {m.common.back}
                </Button>
                <Button
                  type="button"
                  size="lg"
                  onClick={next}
                  disabled={!canContinue}
                  className="min-h-12 rounded-xl bg-primary px-6 text-primary-foreground hover:bg-primary/90"
                >
                  {isLast ? m.welcome.enter : m.common.continue}
                  <ArrowRight className="size-4" />
                </Button>
              </div>
            </section>
          </div>
        </div>

        <footer className="mt-auto flex items-center justify-between gap-4 pt-6 text-[10px] uppercase tracking-[0.16em] text-primary-foreground/30">
          <span>Configuration · 4 étapes</span>
          <span>K’Osez · Saint-Pierre</span>
        </footer>
      </div>
    </main>
  );
}
