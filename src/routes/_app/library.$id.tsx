import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Volume2, BookMarked, Check, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { Eyebrow, Page, Surface } from "@/components/app/primitives";
import { Button } from "@/components/ui/button";
import { LIBRARY, LIBRARY_GLOSS } from "@/lib/blossom/data";
import { useBlossom } from "@/lib/blossom/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/library/$id")({
  component: LibraryDocPage,
});

/**
 * Reading room — touch a word, keep it, hear the text.
 * Gloss from Léo · vocabulary feeds missions later.
 */
function LibraryDocPage() {
  const { id } = Route.useParams();
  const doc = LIBRARY.find((d) => d.id === id);

  if (!doc) {
    return (
      <Page>
        <p className="font-display text-2xl">Texte introuvable</p>
        <Button asChild className="mt-4">
          <Link to="/library">Retour</Link>
        </Button>
      </Page>
    );
  }

  return <LibraryReader doc={doc} />;
}

function LibraryReader({ doc }: { doc: (typeof LIBRARY)[number] }) {
  const saveWord = useBlossom((s) => s.saveWord);
  const vocab = useBlossom((s) => s.vocabulary);
  const activityLog = useBlossom((s) => s.activityLog);
  const completeActivity = useBlossom((s) => s.completeActivity);
  const [picked, setPicked] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [completed, setCompleted] = useState(false);
  const text = doc.body;

  function onWord(raw: string) {
    const word = raw.replace(/[.,!?]/g, "").toLowerCase();
    if (word.length < 3) return;
    const gloss = LIBRARY_GLOSS[word] ?? "sens à préciser avec Léo";
    saveWord(word, gloss);
    setPicked(word);
    toast(`${word} — ${gloss}`);
  }

  function speak() {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "en-GB";
    utter.rate = 0.92;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
  }

  const tokens = text.split(/(\s+)/);
  const pickedGloss = picked
    ? (LIBRARY_GLOSS[picked] ?? "sens à préciser avec Léo")
    : null;
  const comprehension = doc.comprehension ?? [];
  const score = comprehension.reduce(
    (total, item, index) => total + (answers[index] === item.answer ? 1 : 0),
    0,
  );
  const alreadyCompleted = activityLog.some(
    (event) =>
      event.type === "LIBRARY_COMPLETED" &&
      event.sourceId === "library:" + doc.id,
  );
  const readyToComplete =
    comprehension.length === 0 ||
    (Object.keys(answers).length === comprehension.length &&
      score >= Math.max(2, Math.ceil(comprehension.length * 0.66)));

  function completeReading() {
    if (!readyToComplete || alreadyCompleted || completed) return;
    const result = completeActivity(
      "LIBRARY_COMPLETED",
      "library:" + doc.id,
      "Lecture comprise · " + score + "/" + comprehension.length,
    );
    if (result.ok || result.reason === "already") setCompleted(true);
  }

  return (
    <Page className="kosez-feature-page max-w-2xl">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link to="/library">
          <ArrowLeft className="size-4" />
          Bibliothèque
        </Link>
      </Button>

      <div className="mt-6 overflow-hidden rounded-2xl border border-border/50">
        <img
          src={doc.image}
          alt=""
          className="aspect-[16/9] w-full object-cover"
        />
      </div>

      <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <Eyebrow>
            {doc.language} · {doc.level}
          </Eyebrow>
          <h1 className="mt-2 font-display text-3xl tracking-tight sm:text-4xl">
            {doc.title}
          </h1>
          <p className="mt-2 text-sm text-muted">{doc.minutes} min de lecture</p>
        </div>
        <Button variant="secondary" onClick={speak}>
          <Volume2 className="size-4" />
          Écouter
        </Button>
      </div>

      <p className="mt-2 text-xs text-subtle">
        Touchez un mot pour le garder. Il pourra entrer dans une mission.
      </p>

      <article className="mt-8 rounded-2xl border border-border/40 bg-surface/50 p-5 sm:p-8">
        <p className="text-lg leading-8 sm:text-xl sm:leading-9">
          {tokens.map((token, i) => {
            if (/^\s+$/.test(token)) return <span key={i}>{token}</span>;
            const clean = token.replace(/[.,!?]/g, "").toLowerCase();
            const saved = vocab.some((v) => v.word === clean);
            const isPicked = picked === clean;
            return (
              <button
                key={`${token}-${i}`}
                type="button"
                onClick={() => onWord(token)}
                className={cn(
                  "rounded-sm transition-colors",
                  saved &&
                    "text-primary underline decoration-primary/40 underline-offset-4",
                  isPicked && "bg-primary/15",
                  !saved && "hover:text-primary",
                )}
              >
                {token}
              </button>
            );
          })}
        </p>
      </article>

      {picked && pickedGloss && (
        <Surface className="mt-6 !p-5 border border-primary/20 bg-primary/5">
          <Eyebrow className="text-primary/80">Léo · ce mot</Eyebrow>
          <p className="mt-3 font-display text-2xl tracking-tight">{picked}</p>
          <p className="mt-2 text-sm leading-6 text-muted">{pickedGloss}</p>
          <p className="mt-4 text-sm leading-6">
            Dans ce texte, gardez-le. Il pourra revenir dans une mission ou un
            Speak — pas dans une liste infinie.
          </p>
        </Surface>
      )}

      {comprehension.length > 0 ? (
        <section className="mt-8">
          <div className="max-w-2xl">
            <Eyebrow>Comprendre avant de passer</Eyebrow>
            <h2 className="mt-2 font-display text-3xl tracking-tight">
              Qu'avez-vous réellement retenu ?
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              Trois décisions simples vérifient la compréhension, pas votre capacité à réciter le texte.
            </p>
          </div>

          <div className="mt-5 space-y-3">
            {comprehension.map((item, index) => {
              const selected = answers[index];
              const answered = Boolean(selected);
              const correct = selected === item.answer;
              return (
                <div key={item.prompt} className="rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-border)]">
                  <div className="flex items-start gap-3">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-semibold text-primary">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-display text-xl leading-tight">{item.prompt}</p>
                      <div className="mt-4 grid gap-2 sm:grid-cols-3">
                        {item.choices.map((choice) => {
                          const isSelected = selected === choice;
                          return (
                            <button
                              key={choice}
                              type="button"
                              onClick={() =>
                                setAnswers((current) => ({
                                  ...current,
                                  [index]: choice,
                                }))
                              }
                              className={cn(
                                "min-h-12 rounded-xl border px-3.5 py-3 text-left text-sm transition",
                                isSelected
                                  ? correct
                                    ? "border-primary/30 bg-primary/8"
                                    : "border-destructive/25 bg-destructive/5"
                                  : "border-border bg-surface-2/35 hover:bg-surface-2",
                              )}
                            >
                              {choice}
                            </button>
                          );
                        })}
                      </div>
                      {answered ? (
                        <div className="mt-4 rounded-xl bg-surface-2/50 p-3.5">
                          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em]">
                            {correct ? <Check className="size-3.5 text-primary" /> : null}
                            {correct ? "Compris" : "À relire"}
                          </p>
                          <p className="mt-2 text-xs leading-5 text-muted">{item.explanation}</p>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {doc.transferPrompt ? (
            <Surface className="mt-4 border border-primary/15 bg-primary/5 !p-5">
              <Eyebrow>Transfert</Eyebrow>
              <p className="mt-2 text-sm leading-6">{doc.transferPrompt}</p>
            </Surface>
          ) : null}

          <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-primary/15 bg-primary/5 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium">
                {alreadyCompleted || completed ? "Lecture ancrée" : "Ancrer cette lecture"}
              </p>
              <p className="mt-1 text-xs leading-5 text-muted">
                {readyToComplete
                  ? "La compréhension minimale est établie. Enregistrez la trace."
                  : "Répondez aux " + comprehension.length + " questions · " + score + "/" + comprehension.length + " correctes."}
              </p>
            </div>
            <Button
              disabled={!readyToComplete || alreadyCompleted || completed}
              onClick={completeReading}
              className="shrink-0"
            >
              {alreadyCompleted || completed ? "Enregistrée" : "Marquer comme comprise"}
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </section>
      ) : null}

      <Surface className="mt-4 !p-5">
        <div className="flex items-center gap-2">
          <BookMarked className="size-4 text-primary" strokeWidth={1.7} />
          <Eyebrow>Vocabulaire</Eyebrow>
        </div>
        {vocab.length === 0 ? (
          <p className="mt-3 text-sm leading-6 text-muted">
            Touchez un mot pour le garder. Il pourra entrer dans une mission.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-border/50">
            {vocab.map((v) => (
              <li
                key={v.word}
                className="flex justify-between gap-4 py-2.5 text-sm"
              >
                <span className="font-medium">{v.word}</span>
                <span className="text-right text-muted">{v.gloss}</span>
              </li>
            ))}
          </ul>
        )}
      </Surface>
    </Page>
  );
}
