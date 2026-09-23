import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Volume2, BookMarked } from "lucide-react";
import { toast } from "sonner";
import { Eyebrow, Page, Surface } from "@/components/app/primitives";
import { Button } from "@/components/ui/button";
import { LIBRARY, LIBRARY_GLOSS } from "@/lib/blossom/data";
import { useBlossom } from "@/lib/blossom/store";
import { takeCurriculumLessonContext } from "@/lib/blossom/curriculum-context";
import { CURRICULUM_UNITS } from "@/lib/blossom/learning-os";
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
  const saveWord = useBlossom((s) => s.saveWord);
  const completeActivity = useBlossom((s) => s.completeActivity);
  const [curriculumLessonId] = useState<string | null>(() => takeCurriculumLessonContext());
  const readingEndRef = useRef<HTMLDivElement | null>(null);
  const [readingCompleted, setReadingCompleted] = useState(false);
  const vocab = useBlossom((s) => s.vocabulary);
  const [picked, setPicked] = useState<string | null>(null);

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
  useEffect(() => {
    const end = readingEndRef.current;
    if (!end || readingCompleted) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry?.isIntersecting) return;
      const sourceId = `library:${doc.id}:${new Date().toISOString().slice(0, 10)}`;
      completeActivity("LIBRARY_COMPLETED", sourceId, `Lecture · ${doc.id}`);
      if (curriculumLessonId) {
        const lesson = CURRICULUM_UNITS.flatMap((unit) => unit.lessons).find((item) => item.id === curriculumLessonId);
        if (lesson?.kind === "library" && lesson.taskId === doc.id) {
          completeActivity(
            "CURRICULUM_EVIDENCE_RECORDED",
            curriculumLessonId,
            `Preuve curriculum · lecture · ${doc.id}`,
            { supportId: sourceId },
          );
        }
      }
      setReadingCompleted(true);
      observer.disconnect();
    }, { threshold: 0.95 });
    observer.observe(end);
    return () => observer.disconnect();
  }, [completeActivity, curriculumLessonId, doc.id, readingCompleted]);



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
          <p className="mt-2 text-sm text-muted">{doc.minutes} min de lecture · {readingCompleted ? "lecture enregistrée" : "lisez jusqu’au bout pour enregistrer la lecture"}</p>
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
      <div ref={readingEndRef} aria-hidden className="h-1" />

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
