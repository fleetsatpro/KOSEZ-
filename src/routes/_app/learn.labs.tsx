import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import { ArrowLeft, ArrowRight, Check, GraduationCap, Headphones, PenLine, RotateCcw, Sparkles, Target } from "lucide-react";
import { useMemo, useState } from "react";
import { Eyebrow, Page, Surface } from "@/components/app/primitives";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GRAMMAR_TASKS, LISTENING_TASKS, WRITING_PROMPTS, speakSyntheticEnglish, type LabLevel } from "@/lib/blossom/lab-content";
import { DIAGNOSTIC_QUESTIONS, diagnosticLevel, diagnosticScore, diagnosticSummary } from "@/lib/blossom/learning-labs";
import { useBlossom } from "@/lib/blossom/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/learn/labs")({
  validateSearch: (search: Record<string, unknown>) => ({
    lab:
      search.lab === "grammar" ||
      search.lab === "listening" ||
      search.lab === "writing" ||
      search.lab === "diagnostic"
        ? search.lab
        : undefined,
    task:
      typeof search.task === "string" && search.task.trim()
        ? search.task.trim()
        : undefined,
  }),
  component: LearningLabs,
});

type Lab = "grammar" | "listening" | "writing" | "diagnostic";
const LABS: Array<{ id: Lab; label: string; detail: string }> = [
  { id: "grammar", label: "Grammaire", detail: "Construire la phrase qui sert." },
  { id: "listening", label: "Écoute", detail: "Attraper l'information utile." },
  { id: "writing", label: "Écrit", detail: "Laisser une trace claire." },
  { id: "diagnostic", label: "Repère", detail: "Choisir le bon point de départ." },
];

function dailyLabSource(kind: string, taskId: string) {
  return "lab:" + kind + ":" + taskId + ":" + new Date().toISOString().slice(0, 10);
}

function LearningLabs() {
  const learnerLevel = useBlossom((s) => s.learner.level);
  const activeLevel: LabLevel = learnerLevel === "B1" ? "B1" : "A2";
  const search = Route.useSearch();
  const [lab, setLab] = useState<Lab>(search.lab ?? "grammar");
  return <Page className="kosez-feature-page">
    <Link to="/learn" className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted hover:text-primary"><ArrowLeft className="size-3.5" /> Atelier</Link>
    <header className="mt-6 overflow-hidden rounded-[28px] bg-fg p-6 text-primary-foreground shadow-[var(--shadow-border)] sm:p-8">
      <Eyebrow className="text-primary-foreground/55">ATELIER · LABS</Eyebrow>
      <h1 className="mt-3 max-w-4xl font-display text-[clamp(2.7rem,6vw,5rem)] leading-[0.9] tracking-[-0.05em]">Construire, entendre, <span className="text-primary">écrire.</span></h1>
      <p className="mt-5 max-w-2xl text-sm leading-7 text-primary-foreground/65 sm:text-base">Trois laboratoires courts complètent OSEZ, Pron&apos;Lab, la bibliothèque et les missions ; un repère diagnostique aide à choisir le point de départ. Ils créent des traces de pratique sans prétendre remplacer une évaluation linguistique complète.</p>
    </header>
    <div className="mt-6 grid gap-2 sm:grid-cols-3">{LABS.map((item) => <button key={item.id} type="button" onClick={() => setLab(item.id)} className={`rounded-2xl border p-4 text-left transition ${lab === item.id ? "border-primary/30 bg-primary/8 text-fg" : "border-border bg-surface text-muted hover:bg-surface-2/60 hover:text-fg"}`}>
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em]">{item.label}</p><p className="mt-2 font-display text-xl tracking-tight">{item.detail}</p>
    </button>)}</div>
    {lab === "grammar" ? <GrammarLab level={activeLevel} taskId={search.task} /> : null}{lab === "listening" ? <ListeningLab level={activeLevel} taskId={search.task} /> : null}{lab === "writing" ? <WritingLab level={activeLevel} taskId={search.task} /> : null}{lab === "diagnostic" ? <DiagnosticLab /> : null}
  </Page>;
}

function GrammarLab({ level, taskId }: { level: LabLevel; taskId?: string }) {
  const completeActivity = useBlossom((s) => s.completeActivity);
  const saveLearningSubmission = useBlossom((s) => s.saveLearningSubmission);
  const tasks = useMemo(() => GRAMMAR_TASKS.filter((item) => item.level === level), [level]);
  const initialIndex = Math.max(0, tasks.findIndex((item) => item.id === taskId));
  const [index, setIndex] = useState(initialIndex === -1 ? 0 : initialIndex), [choice, setChoice] = useState<string | null>(null), [correct, setCorrect] = useState(0), [finished, setFinished] = useState(false);
  const task = tasks[index]!, answered = choice !== null;
  function choose(value: string) { if (choice) return; setChoice(value); if (value === task.answer) setCorrect((v) => v + 1); }
  function next() {
    if (!answered) return;
    if (index >= tasks.length - 1) { saveLearningSubmission({ taskId: task.id, kind: "grammar", content: choice ?? "", checks: [choice === task.answer ? "correct" : "incorrect"], result: { correct: choice === task.answer, target: task.target } }); completeActivity("GRAMMAR_COMPLETED", dailyLabSource("grammar", task.id), `Grammaire · ${correct + (choice === task.answer ? 1 : 0)}/${tasks.length}`); setFinished(true); return; }
    setIndex((v) => v + 1); setChoice(null);
  }
  if (finished) return <LabComplete title="Grammaire terminée" detail={`${correct} bonnes réponses sur ${tasks.length}. Cette trace mesure une séance de pratique, pas un niveau CEFR.`} />;
  return <Surface className="mt-6 overflow-hidden p-0">
    <div className="flex items-center justify-between border-b border-border px-5 py-4"><div><Eyebrow>Grammaire · {index + 1}/{tasks.length}</Eyebrow><p className="mt-1 text-xs text-muted">{task.target}</p></div><Badge variant="outline">{task.level}</Badge></div>
    <div className="p-5 sm:p-7"><h2 className="max-w-3xl font-display text-3xl tracking-tight sm:text-4xl">{task.prompt}</h2>
      <div className="mt-7 grid gap-2">{task.choices.map((item) => <button key={item} type="button" onClick={() => choose(item)} className={`rounded-xl border px-4 py-3 text-left text-sm transition ${choice === item ? item === task.answer ? "border-primary/35 bg-primary/10" : "border-destructive/25 bg-destructive/5" : "border-border bg-surface-2/35 hover:bg-surface-2"}`}>{item}</button>)}</div>
      {answered ? <div className="mt-6 rounded-xl border border-border bg-surface-2/50 p-4"><p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em]">{choice === task.answer ? <Check className="size-4 text-primary" /> : <RotateCcw className="size-4 text-muted" />}{choice === task.answer ? "Juste" : "À reprendre"}</p><p className="mt-3 text-sm leading-6 text-muted">{task.explanation}</p></div> : null}
      <Button className="mt-6 w-full sm:w-auto" disabled={!answered} onClick={next}>{index === tasks.length - 1 ? "Terminer le laboratoire" : "Continuer"} <Sparkles className="size-4" /></Button>
    </div>
  </Surface>;
}

function ListeningLab({ level, taskId }: { level: LabLevel; taskId?: string }) {
  const completeActivity = useBlossom((s) => s.completeActivity);
  const saveLearningSubmission = useBlossom((s) => s.saveLearningSubmission);
  const tasks = useMemo(() => LISTENING_TASKS.filter((item) => item.level === level), [level]);
  const initialIndex = Math.max(0, tasks.findIndex((item) => item.id === taskId));
  const [index, setIndex] = useState(initialIndex === -1 ? 0 : initialIndex), [choice, setChoice] = useState<string | null>(null), [correct, setCorrect] = useState(0), [finished, setFinished] = useState(false);
  const task = tasks[index]!, answered = choice !== null;
  function choose(value: string) { if (choice) return; setChoice(value); if (value === task.answer) setCorrect((v) => v + 1); }
  function next() {
    if (!answered) return;
    if (index >= tasks.length - 1) { saveLearningSubmission({ taskId: task.id, kind: "listening", content: choice ?? "", checks: [choice === task.answer ? "correct" : "incorrect"], result: { correct: choice === task.answer, level: task.level } }); completeActivity("LISTENING_COMPLETED", dailyLabSource("listening", task.id), `Écoute · ${correct + (choice === task.answer ? 1 : 0)}/${tasks.length}`); setFinished(true); return; }
    setIndex((v) => v + 1); setChoice(null);
  }
  if (finished) return <LabComplete title="Écoute terminée" detail={`${correct} bonnes réponses sur ${tasks.length}. Vous avez travaillé des détails concrets : heure, lieu, prix et option.`} />;
  return <Surface className="mt-6 p-5 sm:p-7">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><Eyebrow>Écoute · {index + 1}/{tasks.length}</Eyebrow><h2 className="mt-2 font-display text-3xl tracking-tight">{task.question}</h2></div><Badge variant="outline">{task.level} · voix synthétique</Badge></div>
    <div className="mt-6 rounded-2xl border border-border bg-fg p-5 text-primary-foreground"><p className="text-xs text-primary-foreground/50">Deux écoutes maximum avant de répondre.</p><Button variant="secondary" className="mt-4 bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => speakSyntheticEnglish(task.audioText)}><Headphones className="size-4" /> Écouter</Button><p className="mt-4 font-display text-lg text-primary-foreground/80">{task.audioText}</p><p className="mt-1 text-[11px] text-primary-foreground/45">La voix est générée par votre appareil. Les enregistrements humains seront ajoutés dans le pack audio éditorial.</p></div>
    <div className="mt-5 grid gap-2">{task.choices.map((item) => <button key={item} type="button" onClick={() => choose(item)} className={`rounded-xl border px-4 py-3 text-left text-sm transition ${choice === item ? item === task.answer ? "border-primary/35 bg-primary/10" : "border-destructive/25 bg-destructive/5" : "border-border bg-surface-2/35 hover:bg-surface-2"}`}>{item}</button>)}</div>
    {answered ? <p className="mt-5 rounded-xl bg-surface-2/50 p-4 text-sm leading-6 text-muted">{task.detail}</p> : null}
    <Button className="mt-6 w-full sm:w-auto" disabled={!answered} onClick={next}>{index === tasks.length - 1 ? "Terminer le laboratoire" : "Continuer"} <Sparkles className="size-4" /></Button>
  </Surface>;
}

function WritingLab({ level, taskId }: { level: LabLevel; taskId?: string }) {
  const completeActivity = useBlossom((s) => s.completeActivity);
  const saveLearningSubmission = useBlossom((s) => s.saveLearningSubmission);
  const prompts = useMemo(() => WRITING_PROMPTS.filter((item) => item.level === level), [level]);
  const initialPromptIndex = Math.max(0, prompts.findIndex((item) => item.id === taskId));
  const [promptIndex, setPromptIndex] = useState(initialPromptIndex === -1 ? 0 : initialPromptIndex), [draft, setDraft] = useState(""), [checks, setChecks] = useState<string[]>([]), [submitted, setSubmitted] = useState(false);
  const prompt = useMemo(() => prompts[promptIndex % prompts.length]!, [promptIndex, prompts]);
  function submit() { if (!draft.trim()) return; saveLearningSubmission({ taskId: prompt.id, kind: "writing", content: draft.trim(), checks, result: { checkCount: checks.length, checkTotal: prompt.checks.length } }); completeActivity("WRITING_COMPLETED", dailyLabSource("writing", prompt.id), `Écrit · ${prompt.id} · ${checks.length}/${prompt.checks.length} auto-vérifications`); setSubmitted(true); }
  function next() { setPromptIndex((v) => (v + 1) % WRITING_PROMPTS.length); setDraft(""); setChecks([]); setSubmitted(false); }
  return <Surface className="mt-6 p-5 sm:p-7">
    <div className="flex items-start justify-between gap-3"><div><Eyebrow>Écrit · pratique guidée</Eyebrow><h2 className="mt-2 font-display text-3xl tracking-tight">{prompt.title}</h2></div><PenLine className="size-5 text-primary" /></div>
    <p className="mt-3 text-sm leading-6 text-muted">{prompt.situation}</p><div className="mt-5 rounded-xl bg-surface-2/50 p-4"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-subtle">Consigne</p><p className="mt-2 text-sm leading-6">{prompt.task}</p></div>
    <textarea value={draft} onChange={(event) => setDraft(event.target.value)} disabled={submitted} placeholder="Écrivez votre propre version…" className="mt-5 min-h-36 w-full rounded-2xl border border-border bg-bg p-4 text-sm leading-7 outline-none transition focus:border-primary/30 focus:ring-2 focus:ring-primary/10" />
    <div className="mt-4 space-y-2">{prompt.checks.map((check) => { const checked = checks.includes(check.id); return <button key={check.id} type="button" disabled={submitted} onClick={() => setChecks((value) => checked ? value.filter((id) => id !== check.id) : [...value, check.id])} className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition ${checked ? "border-primary/25 bg-primary/8" : "border-border bg-surface-2/30 hover:bg-surface-2"}`}><span className={`flex size-5 items-center justify-center rounded-md border ${checked ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}>{checked ? <Check className="size-3.5" /> : null}</span>{check.label}</button>; })}</div>
    {submitted ? <div className="mt-6 rounded-2xl border border-primary/15 bg-primary/5 p-5"><Eyebrow>Modèle · à observer, pas à copier</Eyebrow><p className="mt-3 font-display text-2xl leading-snug">{prompt.model}</p><p className="mt-2 text-sm leading-6 text-muted">K&apos;Osez ne prétend pas corriger automatiquement votre texte ici : vous avez créé une vraie trace de production.</p><Button variant="secondary" className="mt-5" onClick={next}>Un autre sujet <span aria-hidden>→</span></Button></div> : <Button className="mt-6" disabled={!draft.trim()} onClick={submit}>Enregistrer ma trace <Sparkles className="size-4" /></Button>}
  </Surface>;
}

function DiagnosticLab() {
  const learner = useBlossom((s) => s.learner);
  const updateLearner = useBlossom((s) => s.updateLearner);
  const completeActivity = useBlossom((s) => s.completeActivity);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);

  const score = diagnosticScore(answers);
  const ready = Object.keys(answers).length === DIAGNOSTIC_QUESTIONS.length;
  const level = diagnosticLevel(score);

  if (saved) {
    return (
      <Surface className="mt-6 border border-primary/20 bg-primary/5 p-6 sm:p-8">
        <GraduationCap className="size-6 text-primary" />
        <Eyebrow className="mt-5">REPÈRE ENREGISTRÉ</Eyebrow>
        <h2 className="mt-2 font-display text-3xl tracking-tight">{level} · {score}/10</h2>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-muted">{diagnosticSummary(score)}</p>
        <div className="mt-6 flex flex-wrap gap-2">
          <Button asChild><Link to="/learn/curriculum">Ouvrir le parcours <ArrowRight className="size-4" /></Link></Button>
          <Button variant="secondary" onClick={() => setSaved(false)}>Refaire</Button>
        </div>
      </Surface>
    );
  }

  return (
    <Surface className="mt-6 p-5 sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl">
          <Eyebrow>REPÈRE · INDICATIF</Eyebrow>
          <h2 className="mt-2 font-display text-3xl tracking-tight">Choisir le bon point de départ.</h2>
          <p className="mt-3 text-sm leading-6 text-muted">
            Cinq situations courtes. Le résultat aide à choisir le prochain terrain de pratique ; il ne remplace ni une certification ni une évaluation enseignant.
          </p>
        </div>
        <Badge variant="outline">Actuel · {learner.level}</Badge>
      </div>

      <div className="mt-7 space-y-3">
        {DIAGNOSTIC_QUESTIONS.map((question, index) => (
          <div key={question.id} className="rounded-2xl border border-border bg-surface-2/35 p-4 sm:p-5">
            <div className="flex gap-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-semibold text-primary">{index + 1}</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm leading-6">{question.prompt}</p>
                <div className="mt-4 grid gap-2">
                  {question.options.map((option) => {
                    const selected = answers[question.id] === option.label;
                    return (
                      <button
                        key={option.label}
                        type="button"
                        onClick={() => setAnswers((current) => ({ ...current, [question.id]: option.label }))}
                        className={cn(
                          "rounded-xl border px-4 py-3 text-left text-sm transition",
                          selected ? "border-primary/25 bg-primary/8" : "border-border bg-surface hover:border-primary/15",
                        )}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-2xl border border-primary/15 bg-primary/5 p-5">
        <div className="flex items-start gap-3">
          <Target className="mt-0.5 size-4 text-primary" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-subtle">
              {ready ? `Repère proposé · ${level}` : "Repère en cours"}
            </p>
            <p className="mt-2 text-sm leading-6 text-muted">
              {ready ? diagnosticSummary(score) : `${Object.keys(answers).length}/${DIAGNOSTIC_QUESTIONS.length} situations complétées.`}
            </p>
          </div>
          <span className="font-display text-2xl tabular-nums text-primary">{score}/10</span>
        </div>
      </div>

      <Button
        className="mt-5 w-full sm:w-auto"
        disabled={!ready}
        onClick={() => {
          updateLearner({ level });
          completeActivity("DIAGNOSTIC_COMPLETED", dailyLabSource("diagnostic", "placement"), `Repère indicatif · ${score}/10 · ${level}`);
          setSaved(true);
        }}
      >
        Adopter ce repère <Check className="size-4" />
      </Button>
    </Surface>
  );
}

function LabComplete({ title, detail }: { title: string; detail: string }) {
  return <Surface className="mt-6 border border-primary/20 bg-primary/5 p-6 sm:p-8"><Check className="size-6 text-primary" /><Eyebrow className="mt-5">TRACE CRÉÉE</Eyebrow><h2 className="mt-2 font-display text-3xl tracking-tight">{title}</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-muted">{detail}</p><div className="mt-6 flex flex-wrap gap-2"><Button asChild><Link to="/learn">Retour à Atelier</Link></Button><Button variant="secondary" asChild><Link to="/learn/review">Réviser</Link></Button></div></Surface>;
}
