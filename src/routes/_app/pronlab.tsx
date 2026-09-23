import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Lock, Target } from "lucide-react";
import { Eyebrow, Page, Surface } from "@/components/app/primitives";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { PRONLAB_SETS, setsForLanguage } from "@/lib/blossom/data";
import { summarisePronlabItem } from "@/lib/blossom/engine";
import { strugglingFocus } from "@/lib/blossom/organism";
import { isSetUnlocked, useBlossom } from "@/lib/blossom/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/pronlab")({
  component: PronlabHub,
});

function PronlabHub() {
  const attempts = useBlossom((s) => s.pronlabAttempts);
  const assigned = useBlossom((s) => s.assignedSetIds);
  const syncOwnerUserId = useBlossom((s) => s.syncOwnerUserId);
  const languageId = useBlossom((s) => s.languageId);
  const homework = useBlossom((s) => s.homework).filter(
    (h) => h.status === "sent" && h.studentId === syncOwnerUserId,
  );
  const sets = setsForLanguage(languageId);
  const allItems = PRONLAB_SETS.flatMap((s) => s.items);
  const struggle = strugglingFocus(attempts, allItems);

  const totalMastered = allItems.filter(
    (item) => summarisePronlabItem(item.id, attempts).mastered,
  ).length;
  const totalAttempted = allItems.filter(
    (item) => summarisePronlabItem(item.id, attempts).attemptCount > 0,
  ).length;

  return (
    <Page className="kosez-feature-page max-w-4xl">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link to="/learn">
          <ArrowLeft className="size-4" />
          Atelier
        </Link>
      </Button>

      <header className="mt-5 max-w-2xl">
        <Eyebrow>Pron'Lab</Eyebrow>
        <h1 className="mt-2 font-display text-4xl tracking-tight sm:text-5xl">
          Sons, mots, phrases
        </h1>
        <p className="mt-3 text-sm leading-7 text-muted sm:text-base">
          Le même item, plusieurs fois. L'historique reste. La maîtrise se
          voit. Léo commente un point — pas une liste de fautes.
        </p>
      </header>

      {/* At-a-glance mastery */}
      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        <Surface className="!p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-subtle">
            Maîtrisés
          </p>
          <p className="mt-1 font-display text-3xl tabular-nums text-primary">
            {totalMastered}
          </p>
          <p className="mt-1 text-xs text-muted">feuilles de son ouvertes</p>
        </Surface>
        <Surface className="!p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-subtle">
            Touchés
          </p>
          <p className="mt-1 font-display text-3xl tabular-nums">
            {totalAttempted}
          </p>
          <p className="mt-1 text-xs text-muted">items déjà essayés</p>
        </Surface>
        <Surface className="!p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-subtle">
            Sets
          </p>
          <p className="mt-1 font-display text-3xl tabular-nums">{sets.length}</p>
          <p className="mt-1 text-xs text-muted">pour cette langue</p>
        </Surface>
      </div>

      {struggle ? (
        <Surface className="mt-4 border-primary/20 bg-primary/5">
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <Target className="size-4" strokeWidth={1.7} />
            </span>
            <div className="min-w-0 flex-1">
              <Eyebrow>Son qui résiste</Eyebrow>
              <p className="mt-1 font-display text-xl">
                {struggle.focus || struggle.phrase}
              </p>
              <p className="mt-1 text-sm leading-6 text-muted">
                {struggle.phrase} — un retour ici vaut mieux qu'un long
                exercice neuf.
              </p>
              <Button asChild size="sm" className="mt-3" variant="secondary">
                <Link
                  to="/pronlab/$setId"
                  params={{
                    setId:
                      PRONLAB_SETS.find((s) =>
                        s.items.some((i) => i.id === struggle.id),
                      )?.id ?? sets[0]?.id ?? "th",
                  }}
                >
                  Reprendre ce son
                  <ArrowRight className="size-3.5" />
                </Link>
              </Button>
            </div>
          </div>
        </Surface>
      ) : null}

      {homework.length > 0 && (
        <Surface className="mt-4">
          <Eyebrow>De Léa</Eyebrow>
          {homework.map((h) => (
            <div key={h.id} className="mt-3">
              <p className="font-display text-xl">{h.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-muted">{h.body}</p>
            </div>
          ))}
        </Surface>
      )}

      <Surface className="mt-10 border border-primary/15 bg-primary/5 !p-5 sm:!p-6">
        <Eyebrow>Progression Pron'Lab</Eyebrow>
        <h2 className="mt-2 font-display text-2xl tracking-tight">
          Du son isolé à la parole spontanée.
        </h2>
        <div className="mt-5 grid gap-2 sm:grid-cols-4">
          {[
            ["01", "Contrastes", "Stabiliser le son"],
            ["02", "Mots", "Le son dans le vocabulaire"],
            ["03", "Chaînes", "Relier les mots"],
            ["04", "Spontané", "Parler sans modèle"],
          ].map(([number, title, detail]) => (
            <div key={number} className="rounded-xl bg-surface/70 p-3">
              <p className="text-[10px] font-semibold tracking-[0.16em] text-primary">{number}</p>
              <p className="mt-2 font-display text-lg">{title}</p>
              <p className="mt-1 text-xs leading-5 text-muted">{detail}</p>
            </div>
          ))}
        </div>
      </Surface>

      <h2 className="mt-10 font-display text-2xl tracking-tight">Sets</h2>
      <p className="mt-1 text-sm text-muted">
        Chaîne progressive. Un set s'ouvre après le précédent — ou sur
        consigne de Léa.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {sets.length === 0 && (
          <Surface className="sm:col-span-2">
            <p className="font-display text-xl">Ce module n'a pas encore de set actif.</p>
            <p className="mt-2 text-sm text-muted">
              K’Osez n'affiche pas de faux contenu. Les sets disponibles pour
              cette langue apparaissent dès qu'un parcours réel est publié.
            </p>
          </Surface>
        )}
        {sets.map((set, index) => {
          const unlocked = isSetUnlocked(set.id, attempts, assigned);
          const summaries = set.items.map((item) =>
            summarisePronlabItem(item.id, attempts),
          );
          const mastered = summaries.filter((s) => s.mastered).length;
          const started = summaries.filter((s) => s.attemptCount > 0).length;
          const assignedHere = assigned.includes(set.id);
          const pct = (mastered / Math.max(1, set.items.length)) * 100;
          return (
            <article
              key={set.id}
              className={cn(
                "flex flex-col rounded-2xl border border-border/60 bg-surface p-5 shadow-[var(--shadow-border)] sm:p-6",
                !unlocked && "opacity-80",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Eyebrow>{set.kind}</Eyebrow>
                    <span className="text-[10px] tabular-nums text-subtle">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <h2 className="mt-2 font-display text-2xl tracking-tight">
                    {set.title}
                  </h2>
                </div>
                {assignedHere ? (
                  <Badge variant="clay">Léa</Badge>
                ) : unlocked ? (
                  <Badge variant="outline">
                    {mastered}/{set.items.length}
                  </Badge>
                ) : (
                  <Lock className="size-4 text-subtle" aria-label="Verrouillé" />
                )}
              </div>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">
                {set.blurb}
              </p>
              <Progress className="mt-5 h-1.5" value={pct} />
              <p className="mt-2 text-xs tabular-nums text-subtle">
                {started} commencés · {mastered} maîtrisés · {set.items.length}{" "}
                items
              </p>
              {unlocked ? (
                <Button asChild className="mt-5">
                  <Link to="/pronlab/$setId" params={{ setId: set.id }} search={{ lessonId: undefined }}>
                    Entrer dans le set
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
              ) : (
                <p className="mt-5 text-xs leading-5 text-subtle">
                  S'ouvre après un passage dans le set précédent — ou une
                  consigne de Léa.
                </p>
              )}
            </article>
          );
        })}
      </div>
    </Page>
  );
}
