import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, BookMarked } from "lucide-react";
import { Eyebrow, Page, Surface } from "@/components/app/primitives";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LIBRARY as LIBRARY_CORE, planAllows } from "@/lib/blossom/data";
import { EXTRA_LIBRARY } from "@/lib/blossom/library-extra";

const LIBRARY = [...LIBRARY_CORE, ...EXTRA_LIBRARY];
import { useBlossom } from "@/lib/blossom/store";

export const Route = createFileRoute("/_app/library")({
  component: LibraryPage,
});

function LibraryPage() {
  const plan = useBlossom((s) => s.plan);
  const vocab = useBlossom((s) => s.vocabulary);
  const libraryOk = planAllows(plan, "library");

  if (!libraryOk) {
    return (
      <Page className="kosez-feature-page max-w-2xl">
        <Eyebrow>Bibliothèque</Eyebrow>
        <h1 className="mt-2 font-display text-3xl tracking-tight">
          Disponible avec Premium ou Centre
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted">
          La ludothèque nourrit les missions. Elle s&apos;ouvre avec un plan qui
          inclut la lecture guidée.
        </p>
        <Button asChild className="mt-6">
          <Link to="/moi">Voir les plans</Link>
        </Button>
      </Page>
    );
  }

  return (
    <Page className="kosez-feature-page max-w-3xl">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link to="/learn">
          <ArrowLeft className="size-4" />
          LEARN
        </Link>
      </Button>

      <header className="mt-6 max-w-2xl">
        <Eyebrow>Bibliothèque</Eyebrow>
        <h1 className="mt-2 font-display text-4xl tracking-tight sm:text-5xl">
          La ludothèque, ici
        </h1>
        <p className="mt-3 text-sm leading-7 text-muted sm:text-base">
          Touchez un mot, gardez-le. Il nourrira les missions plus tard. Pas un
          dictionnaire infini — des textes courts à lire à voix haute, ancrés
          ici. Touchez un mot, gardez-le.
        </p>
      </header>

      {vocab.length > 0 && (
        <Surface className="mt-8 !p-4 sm:!p-5">
          <div className="flex items-center gap-2">
            <BookMarked className="size-4 text-primary" strokeWidth={1.7} />
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-subtle">
              Vocabulaire gardé
            </p>
          </div>
          <p className="mt-3 text-sm leading-6 text-fg">
            {vocab.map((v) => v.word).join(" · ")}
          </p>
          <p className="mt-2 text-xs text-subtle">
            {vocab.length} mot{vocab.length > 1 ? "s" : ""} — prêts pour une
            mission ou un Speak.
          </p>
        </Surface>
      )}

      <div className="mt-8 grid gap-5 sm:grid-cols-2">
        {LIBRARY.map((doc) => (
          <Link
            key={doc.id}
            to="/library/$id"
            params={{ id: doc.id }}
            className="group overflow-hidden rounded-2xl border border-border/50 bg-surface shadow-[var(--shadow-border)] transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-border-hover)]"
          >
            <div className="relative aspect-[16/10] overflow-hidden">
              <img
                src={doc.image}
                alt=""
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
              />
              <div
                className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"
                aria-hidden
              />
              <Badge
                variant="outline"
                className="absolute right-3 top-3 border-white/30 bg-black/40 text-white"
              >
                {doc.level}
              </Badge>
              <p className="absolute bottom-3 left-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/80">
                {doc.minutes} min
              </p>
            </div>
            <div className="p-4">
              <p className="font-display text-xl tracking-tight">{doc.title}</p>
              <p className="mt-2 text-sm leading-6 text-muted">{doc.blurb}</p>
            </div>
          </Link>
        ))}
      </div>
    </Page>
  );
}
