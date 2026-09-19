import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Volume2 } from "lucide-react";
import { toast } from "sonner";
import { Eyebrow, Page, Surface } from "@/components/app/primitives";
import { Button } from "@/components/ui/button";
import { LIBRARY, LIBRARY_GLOSS } from "@/lib/blossom/data";
import { useBlossom } from "@/lib/blossom/store";

export const Route = createFileRoute("/_app/library/$id")({
  component: LibraryDocPage,
});

function LibraryDocPage() {
  const { id } = Route.useParams();
  const doc = LIBRARY.find((d) => d.id === id);
  const saveWord = useBlossom((s) => s.saveWord);
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

  return (
    <Page className="max-w-2xl">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link to="/library">
          <ArrowLeft className="size-4" />
          Bibliothèque
        </Link>
      </Button>
      <div className="mt-6 overflow-hidden rounded-xl">
        <img src={doc.image} alt="" className="aspect-video w-full object-cover" />
      </div>
      <Eyebrow className="mt-6">
        {doc.language} · {doc.level}
      </Eyebrow>
      <h1 className="mt-2 font-display text-3xl tracking-tight">{doc.title}</h1>
      <Button variant="secondary" className="mt-4" onClick={speak}>
        <Volume2 className="size-4" />
        Écouter
      </Button>
      <p className="mt-6 text-lg leading-relaxed">
        {tokens.map((token, i) => {
          if (/^\s+$/.test(token)) return <span key={i}>{token}</span>;
          const clean = token.replace(/[.,!?]/g, "").toLowerCase();
          const saved = vocab.some((v) => v.word === clean);
          return (
            <button
              key={`${token}-${i}`}
              type="button"
              onClick={() => onWord(token)}
              className={
                saved
                  ? "text-primary underline decoration-primary/40 underline-offset-4"
                  : "hover:text-primary"
              }
            >
              {token}
            </button>
          );
        })}
      </p>
      {picked && pickedGloss && (
        <Surface className="mt-6">
          <Eyebrow>Léo · ce mot</Eyebrow>
          <p className="mt-3 font-display text-2xl">{picked}</p>
          <p className="mt-2 text-sm text-muted">{pickedGloss}</p>
          <p className="mt-3 text-sm leading-relaxed">
            Dans ce texte, gardez-le. Il pourra revenir dans une mission
            ou un Speak — pas dans une liste infinie.
          </p>
        </Surface>
      )}
      <Surface className="mt-4">
        <Eyebrow>Vocabulaire</Eyebrow>
        {vocab.length === 0 ? (
          <p className="mt-3 text-sm text-muted">
            Touchez un mot pour le garder. Il pourra entrer dans une mission.
          </p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm">
            {vocab.map((v) => (
              <li key={v.word} className="flex justify-between gap-4">
                <span className="font-medium">{v.word}</span>
                <span className="text-muted">{v.gloss}</span>
              </li>
            ))}
          </ul>
        )}
      </Surface>
    </Page>
  );
}
