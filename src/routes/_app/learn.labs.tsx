import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Check, Headphones, PenLine, RotateCcw, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { Eyebrow, Page, Surface } from "@/components/app/primitives";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GRAMMAR_TASKS, LISTENING_TASKS, WRITING_PROMPTS, speakSyntheticEnglish } from "@/lib/blossom/lab-content";
import { useBlossom } from "@/lib/blossom/store";

export const Route = createFileRoute("/_app/learn/labs")({ component: LearningLabs });

type Lab = "grammar" | "listening" | "writing";
const LABS: Array<{ id: Lab; label: string; detail: string }> = [
  { id: "grammar", label: "Grammaire", detail: "Construire la phrase qui sert." },
  { id: "listening", label: "Écoute", detail: "Attraper l'information utile." },
  { id: "writing", label: "Écrit", detail: "Laisser une trace claire." },
];

function LearningLabs() {
  const [lab, setLab] = useState<Lab>("grammar");
  return <Page className="kosez-feature-page">
    <Link to="/learn" className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted hover:text-primary"><ArrowLeft className="size-3.5" /> Atelier</Link>
    <header className="mt-6 overflow-hidden rounded-[28px] bg-fg p-6 text-primary-foreground shadow-[var(--shadow-border)] sm:p-8">
      <Eyebrow className="text-primary-foreground/55">ATELIER · LABS</Eyebrow>
      <h1 className="mt-3 max-w-4xl font-display text-[clamp(2.7rem,6vw,5rem)] leading-[0.9] tracking-[-0.05em]">Construire, entendre, <span className="text-primary">écrire.</span></h1>
      <p className="mt-5 max-w-2xl text-sm leading-7 text-primary-foreground/65 sm:text-base">Trois laboratoires courts complètent OSEZ, Pron&apos;Lab, la bibliothèque et les missions. Ils créent des traces de pratique sans prétendre remplacer une évaluation linguistique complète.</p>
    </header>
    <div className="mt-6 grid gap-2 sm:grid-cols-3">{LABS.map((item) => <button key={item.id} type="button" onClick={() => setLab(item.id)} className={`rounded-2xl border p-4 text-left transition ${lab === item.id ? "border-primary/30 bg-primary/8 text-fg" : "border-border bg-surface text-muted hover:bg-surface-2/60 hover:text-fg"}`}>
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em]">{item.label}</p><p className="mt-2 font-display text-xl tracking-tight">{item.detail}</p>
    </button>)}</div>
    {lab === "grammar" ? <GrammarLab /> : null}{lab === "listening" ? <ListeningLab /> : null}{lab === "writing" ? <WritingLab /> : null}
  </Page>;
}

function GrammarLab() {
  const completeActivity = useBlossom((s) => s.completeActivity);
  const [index, setIndex] = useState(0), [choice, setChoice] = useState<string | null>(null), [correct, setCorrect] = useState(0), [finished, setFinished] = useState(false);
  const task = GRAMMAR_TASKS[index]!, answered = choice !== null;
  function choose(value: string) { if (choice) return; setChoice(value); if (value === task.answer) setCorrect((v) => v + 1); }
  function next() {
    if (!answered) return;
    if (index >= GRAMMAR_TASKS.length - 1) { completeActivity("GRAMMAR_COMPLETED", `grammar-${new Date().toISOString()}`, `Grammaire · ${correct + (choice === task.answer ? 1 : 0)}/${GRAMMAR_TASKS.length}`); setFinished(true); return; }
    setIndex((v) => v + 1); setChoice(null);
  }
  if (finished) return <LabComplete title="Grammaire terminée" detail={`${correct} bonnes réponses sur ${GRAMMAR_TASKS.length}. Cette trace mesure une séance de pratique, pas un niveau CEFR.`} />;
  return <Surface className="mt-6 overflow-hidden p-0">
    <div className="flex items-center justify-between border-b border-border px-5 py-4"><div><Eyebrow>Grammaire · {index + 1}/{GRAMMAR_TASKS.length}</Eyebrow><p className="mt-1 text-xs text-muted">{task.target}</p></div><Badge variant="outline">A2</Badge></div>
    <div className="p-5 sm:p-7"><h2 className="max-w-3xl font-display text-3xl tracking-tight sm:text-4xl">{task.prompt}</h2>
      <div className="mt-7 grid gap-2">{task.choices.map((item) => <button key={item} type="button" onClick={() => choose(item)} className={`rounded-xl border px-4 py-3 text-left text-sm transition ${choice === item ? item === task.answer ? "border-primary/35 bg-primary/10" : "border-destructive/25 bg-destructive/5" : "border-border bg-surface-2/35 hover:bg-surface-2"}`}>{item}</button>)}</div>
      {answered ? <div className="mt-6 rounded-xl border border-border bg-surface-2/50 p-4"><p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em]">{choice === task.answer ? <Check className="size-4 text-primary" /> : <RotateCcw className="size-4 text-muted" />}{choice === task.answer ? "Juste" : "À reprendre"}</p><p className="mt-3 text-sm leading-6 text-muted">{task.explanation}</p></div> : null}
      <Button className="mt-6 w-full sm:w-auto" disabled={!answered} onClick={next}>{index === GRAMMAR_TASKS.length - 1 ? "Terminer le laboratoire" : "Continuer"} <Sparkles className="size-4" /></Button>
    </div>
  </Surface>;
}

function ListeningLab() {
  const completeActivity = useBlossom((s) => s.completeActivity);
  const [index, setIndex] = useState(0), [choice, setChoice] = useState<string | null>(null), [correct, setCorrect] = useState(0), [finished, setFinished] = useState(false);
  const task = LISTENING_TASKS[index]!, answered = choice !== null;
  function choose(value: string) { if (choice) return; setChoice(value); if (value === task.answer) setCorrect((v) => v + 1); }
  function next() {
    if (!answered) return;
    if (index >= LISTENING_TASKS.length - 1) { completeActivity("LISTENING_COMPLETED", `listening-${new Date().toISOString()}`, `Écoute · ${correct + (choice === task.answer ? 1 : 0)}/${LISTENING_TASKS.length}`); setFinished(true); return; }
    setIndex((v) => v + 1); setChoice(null);
  }
  if (finished) return <LabComplete title="Écoute terminée" detail={`${correct} bonnes réponses sur ${LISTENING_TASKS.length}. Vous avez travaillé des détails concrets : heure, lieu, prix et option.`} />;
  return <Surface className="mt-6 p-5 sm:p-7">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><Eyebrow>Écoute · {index + 1}/{LISTENING_TASKS.length}</Eyebrow><h2 className="mt-2 font-display text-3xl tracking-tight">{task.question}</h2></div><Badge variant="outline">A2 · voix synthétique</Badge></div>
    <div className="mt-6 rounded-2xl border border-border bg-fg p-5 text-primary-foreground"><p className="text-xs text-primary-foreground/50">Deux écoutes maximum avant de répondre.</p><Button variant="secondary" className="mt-4 bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => speakSyntheticEnglish(task.audioText)}><Headphones className="size-4" /> Écouter</Button><p className="mt-4 font-display text-lg text-primary-foreground/80">{task.audioText}</p><p className="mt-1 text-[11px] text-primary-foreground/45">La voix est générée par votre appareil. Les enregistrements humains seront ajoutés dans le pack audio éditorial.</p></div>
    <div className="mt-5 grid gap-2">{task.choices.map((item) => <button key={item} type="button" onClick={() => choose(item)} className={`rounded-xl border px-4 py-3 text-left text-sm transition ${choice === item ? item === task.answer ? "border-primary/35 bg-primary/10" : "border-destructive/25 bg-destructive/5" : "border-border bg-surface-2/35 hover:bg-surface-2"}`}>{item}</button>)}</div>
    {answered ? <p className="mt-5 rounded-xl bg-surface-2/50 p-4 text-sm leading-6 text-muted">{task.detail}</p> : null}
    <Button className="mt-6 w-full sm:w-auto" disabled={!answered} onClick={next}>{index === LISTENING_TASKS.length - 1 ? "Terminer le laboratoire" : "Continuer"} <Sparkles className="size-4" /></Button>
  </Surface>;
}

function WritingLab() {
  const completeActivity = useBlossom((s) => s.completeActivity);
  const [promptIndex, setPromptIndex] = useState(0), [draft, setDraft] = useState(""), [checks, setChecks] = useState<string[]>([]), [submitted, setSubmitted] = useState(false);
  const prompt = useMemo(() => WRITING_PROMPTS[promptIndex % WRITING_PROMPTS.length]!, [promptIndex]);
  function submit() { if (!draft.trim()) return; completeActivity("WRITING_COMPLETED", `writing-${new Date().toISOString()}`, `Écrit · ${prompt.id} · ${checks.length}/${prompt.checks.length} auto-vérifications`); setSubmitted(true); }
  function next() { setPromptIndex((v) => (v + 1) % WRITING_PROMPTS.length); setDraft(""); setChecks([]); setSubmitted(false); }
  return <Surface className="mt-6 p-5 sm:p-7">
    <div className="flex items-start justify-between gap-3"><div><Eyebrow>Écrit · pratique guidée</Eyebrow><h2 className="mt-2 font-display text-3xl tracking-tight">{prompt.title}</h2></div><PenLine className="size-5 text-primary" /></div>
    <p className="mt-3 text-sm leading-6 text-muted">{prompt.situation}</p><div className="mt-5 rounded-xl bg-surface-2/50 p-4"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-subtle">Consigne</p><p className="mt-2 text-sm leading-6">{prompt.task}</p></div>
    <textarea value={draft} onChange={(event) => setDraft(event.target.value)} disabled={submitted} placeholder="Écrivez votre propre version…" className="mt-5 min-h-36 w-full rounded-2xl border border-border bg-bg p-4 text-sm leading-7 outline-none transition focus:border-primary/30 focus:ring-2 focus:ring-primary/10" />
    <div className="mt-4 space-y-2">{prompt.checks.map((check) => { const checked = checks.includes(check.id); return <button key={check.id} type="button" disabled={submitted} onClick={() => setChecks((value) => checked ? value.filter((id) => id !== check.id) : [...value, check.id])} className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition ${checked ? "border-primary/25 bg-primary/8" : "border-border bg-surface-2/30 hover:bg-surface-2"}`}><span className={`flex size-5 items-center justify-center rounded-md border ${checked ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}>{checked ? <Check className="size-3.5" /> : null}</span>{check.label}</button>; })}</div>
    {submitted ? <div className="mt-6 rounded-2xl border border-primary/15 bg-primary/5 p-5"><Eyebrow>Modèle · à observer, pas à copier</Eyebrow><p className="mt-3 font-display text-2xl leading-snug">{prompt.model}</p><p className="mt-2 text-sm leading-6 text-muted">K&apos;Osez ne prétend pas corriger automatiquement votre texte ici : vous avez créé une vraie trace de production.</p><Button variant="secondary" className="mt-5" onClick={next}>Un autre sujet <span aria-hidden>→</span></Button></div> : <Button className="mt-6" disabled={!draft.trim()} onClick={submit}>Enregistrer ma trace <Sparkles className="size-4" /></Button>}
  </Surface>;
}

function LabComplete({ title, detail }: { title: string; detail: string }) {
  return <Surface className="mt-6 border border-primary/20 bg-primary/5 p-6 sm:p-8"><Check className="size-6 text-primary" /><Eyebrow className="mt-5">TRACE CRÉÉE</Eyebrow><h2 className="mt-2 font-display text-3xl tracking-tight">{title}</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-muted">{detail}</p><div className="mt-6 flex flex-wrap gap-2"><Button asChild><Link to="/learn">Retour à Atelier</Link></Button><Button variant="secondary" asChild><Link to="/learn/review">Réviser</Link></Button></div></Surface>;
}
