import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, BookMarked, Check, Clock, Search } from "lucide-react";
import { Eyebrow, Page, Surface } from "@/components/app/primitives";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LIBRARY, planAllows } from "@/lib/blossom/data";
import { useBlossom } from "@/lib/blossom/store";

export const Route = createFileRoute("/_app/library")({
  component: LibraryPage,
});

/**
 * Library is a reading room — not a content dump.
 * Read, test comprehension, transfer one idea, then return to the world.
 */
function LibraryPage() {
  const vocab = useBlossom((s) => s.vocabulary);
  const activityLog = useBlossom((s) => s.activityLog);
  const plan = useBlossom((s) => s.plan);
  const libraryOk = planAllows(plan, "library");
  const [query, setQuery] = useState("");
  const [level, setLevel] = useState<"all" | "A2" | "B1">("all");
  const [status, setStatus] = useState<"all" | "unread" | "read">("all");
  const navigate = useNavigate();

  const completedIds = useMemo(
    () =>
      new Set(
        activityLog
          .filter((event) => event.type === "LIBRARY_COMPLETED")
          .map((event) => event.sourceId?.replace("library:", ""))
          .filter((id): id is string => Boolean(id)),
      ),
    [activityLog],
  );

  const visibleLibrary = useMemo(() => {
    const q = query.trim().toLowerCase();
    return LIBRARY.filter((doc) => {
      const matchesQuery =
        !q ||
        doc.title.toLowerCase().includes(q) ||
        doc.blurb.toLowerCase().includes(q) ||
        doc.body.toLowerCase().includes(q);
      const matchesLevel = level === "all" || doc.level.includes(level);
      const isRead = completedIds.has(doc.id);
      const matchesStatus =
        status === "all" || (status === "read" ? isRead : !isRead);
      return matchesQuery && matchesLevel && matchesStatus;
    });
  }, [completedIds, level, query, status]);

  if (!libraryOk) {
    return (
      <Page className="kosez-feature-page max-w-2xl">
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link to="/learn">
            <ArrowLeft className="size-4" />
            LEARN
          </Link>
        </Button>
        <div className="mt-10 max-w-lg">
          <Eyebrow>Bibliothèque</Eyebrow>
          <h1 className="mt-2 font-display text-4xl tracking-tight">
            Premium, ou le centre
          </h1>
          <p className="mt-4 text-sm leading-7 text-muted">
            Digital tient Missions, Speak et Pron'Lab. Les textes de la
            ludothèque s'ouvrent avec Premium — le hub physique reste
            Saint-Pierre.
          </p>
          <Surface className="mt-8 !p-5">
            <p className="text-sm leading-6 text-muted">
              {LIBRARY.length} textes vivants, pas un dictionnaire infini. Assez
              pour cette semaine — et pour nourrir les missions qui suivent.
            </p>
          </Surface>
        </div>
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
          Touchez un mot, gardez-le. Il nourrira les missions plus tard. Pas
          un dictionnaire infini — {LIBRARY.length} textes, assez pour nourrir
          plusieurs situations cette semaine.
        </p>
      </header>

      <Surface className="mt-7 !p-4 sm:!p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <label className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-border bg-bg px-3.5">
            <Search className="size-4 shrink-0 text-subtle" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Rechercher un texte, un sujet…"
              className="min-h-11 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-subtle"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            {([
              ["all", "Tous niveaux"],
              ["A2", "A2"],
              ["B1", "B1"],
            ] as const).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setLevel(id)}
                className={[
                  "rounded-full border px-3 py-2 text-xs font-semibold transition",
                  level === id
                    ? "border-primary/30 bg-primary/10 text-primary"
                    : "border-border bg-surface-2/40 text-muted hover:text-fg",
                ].join(" ")}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {([
              ["all", "Tout"],
              ["unread", "À lire"],
              ["read", "Compris"],
            ] as const).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setStatus(id)}
                className={[
                  "rounded-full border px-3 py-2 text-xs font-semibold transition",
                  status === id
                    ? "border-primary/30 bg-primary/10 text-primary"
                    : "border-border bg-surface-2/40 text-muted hover:text-fg",
                ].join(" ")}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <p className="mt-3 text-xs text-subtle">
          {completedIds.size} lecture{completedIds.size > 1 ? "s" : ""} comprise{completedIds.size > 1 ? "s" : ""} · {visibleLibrary.length} résultat{visibleLibrary.length > 1 ? "s" : ""}
        </p>
      </Surface>

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
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-subtle">
              {vocab.length} mot{vocab.length > 1 ? "s" : ""} — prêts pour une
              mission ou un Speak.
            </p>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                try {
                  sessionStorage.setItem(
                    "kosez-speak-topic",
                    ("Réutiliser : " + vocab.slice(0, 5).map((item) => item.word).join(", ")).slice(0, 120),
                  );
                } catch {
                  /* session storage can be unavailable in privacy modes */
                }
                navigate({ to: "/osez/$id", params: { id: "topic" } });
              }}
            >
              Les faire vivre à l'oral
              <ArrowRight className="size-3.5" />
            </Button>
          </div>
        </Surface>
      )}

      <div className="mt-8 grid gap-5 sm:grid-cols-2">
        {visibleLibrary.map((doc) => (
          <Link
            key={doc.id}
            to="/library/$id"
            params={{ id: doc.id }} search={{ lessonId: undefined }}
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
              <div className="absolute right-3 top-3 flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="border-white/30 bg-black/40 text-white"
                >
                  {doc.level}
                </Badge>
                {completedIds.has(doc.id) ? (
                  <Badge className="border-primary/30 bg-primary text-primary-foreground">
                    <Check className="mr-1 size-3" /> Compris
                  </Badge>
                ) : null}
              </div>
            </div>
            <div className="p-5">
              <h2 className="font-display text-2xl tracking-tight">
                {doc.title}
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted">{doc.blurb}</p>
              <div className="mt-4 flex items-center justify-between gap-2 border-t border-border/50 pt-4">
                <span className="inline-flex items-center gap-1.5 text-xs text-subtle">
                  <Clock className="size-3.5" />
                  {doc.minutes} min
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
                  Lire
                  <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {visibleLibrary.length === 0 ? (
        <Surface className="mt-6 text-center !p-8">
          <p className="font-display text-2xl">Aucun texte ne correspond.</p>
          <p className="mt-2 text-sm leading-6 text-muted">
            Essayez un autre mot, niveau ou filtre de lecture.
          </p>
        </Surface>
      ) : null}

      <p className="mt-10 text-center text-xs leading-5 text-subtle">
        Les mots gardés ne vivent pas dans une liste infinie — ils reviennent
        dans les missions et les Speak rooms.
      </p>
    </Page>
  );
}
