import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Eyebrow, Page } from "@/components/app/primitives";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LIBRARY, planAllows } from "@/lib/blossom/data";
import { useBlossom } from "@/lib/blossom/store";

export const Route = createFileRoute("/_app/library")({
  component: LibraryPage,
});

function LibraryPage() {
  const vocab = useBlossom((s) => s.vocabulary);
  const plan = useBlossom((s) => s.plan);
  const libraryOk = planAllows(plan, "library");

  if (!libraryOk) {
    return (
      <Page>
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link to="/learn">
            <ArrowLeft className="size-4" />
            LEARN
          </Link>
        </Button>
        <Eyebrow className="mt-6">Bibliothèque</Eyebrow>
        <h1 className="mt-2 font-display text-3xl tracking-tight">
          Premium, ou le centre
        </h1>
        <p className="mt-3 max-w-lg text-sm leading-relaxed text-muted">
          Digital tient Missions, Speak et Pron'Lab. Les textes de la
          ludothèque s'ouvrent avec Premium — le hub physique reste
          Saint-Pierre.
        </p>
      </Page>
    );
  }

  return (
    <Page>
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link to="/learn">
          <ArrowLeft className="size-4" />
          LEARN
        </Link>
      </Button>
      <Eyebrow className="mt-6">Bibliothèque</Eyebrow>
      <h1 className="mt-2 font-display text-4xl tracking-tight">
        La ludothèque, ici
      </h1>
      <p className="mt-3 max-w-lg text-sm leading-relaxed text-muted">
        Touchez un mot, gardez-le. Il nourrira les missions plus tard. Pas
        un dictionnaire infini — trois textes, assez pour cette semaine.
      </p>

      {vocab.length > 0 && (
        <p className="mt-6 text-sm text-muted">
          Vocabulaire : {vocab.map((v) => v.word).join(" · ")}
        </p>
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {LIBRARY.map((doc) => (
          <Link
            key={doc.id}
            to="/library/$id"
            params={{ id: doc.id }}
            className="overflow-hidden rounded-xl bg-surface shadow-[var(--shadow-border)]"
          >
            <img
              src={doc.image}
              alt=""
              className="aspect-video w-full object-cover"
            />
            <div className="p-4">
              <div className="flex items-start justify-between gap-2">
                <h2 className="font-display text-2xl">{doc.title}</h2>
                <Badge variant="outline">{doc.level}</Badge>
              </div>
              <p className="mt-2 text-sm text-muted">{doc.blurb}</p>
              <p className="mt-2 text-xs text-subtle">{doc.minutes} min</p>
            </div>
          </Link>
        ))}
      </div>
    </Page>
  );
}
