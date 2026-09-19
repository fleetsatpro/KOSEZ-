import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Lock } from "lucide-react";
import { Eyebrow, Page, Surface } from "@/components/app/primitives";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { setsForLanguage } from "@/lib/blossom/data";
import { summarisePronlabItem } from "@/lib/blossom/engine";
import { isSetUnlocked, useBlossom } from "@/lib/blossom/store";

export const Route = createFileRoute("/_app/pronlab")({
  component: PronlabHub,
});

function PronlabHub() {
  const attempts = useBlossom((s) => s.pronlabAttempts);
  const assigned = useBlossom((s) => s.assignedSetIds);
  const languageId = useBlossom((s) => s.languageId);
  const homework = useBlossom((s) => s.homework).filter(
    (h) => h.status === "sent" && h.studentId === "camille",
  );
  const sets = setsForLanguage(languageId);

  return (
    <Page>
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link to="/learn">
          <ArrowLeft className="size-4" />
          LEARN
        </Link>
      </Button>

      <Eyebrow className="mt-6">Pron'Lab</Eyebrow>
      <h1 className="mt-2 font-display text-4xl tracking-tight">
        Sons, mots, phrases
      </h1>
      <p className="mt-3 max-w-lg text-sm leading-relaxed text-muted">
        Le même item, plusieurs fois. L'historique reste. La maîtrise se
        voit. Léo commente un point, pas une liste.
      </p>

      {homework.length > 0 && (
        <Surface className="mt-6">
          <Eyebrow>De Léa</Eyebrow>
          {homework.map((h) => (
            <div key={h.id} className="mt-3">
              <p className="font-display text-xl">{h.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-muted">{h.body}</p>
            </div>
          ))}
        </Surface>
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {sets.length === 0 && (
          <Surface className="sm:col-span-2">
            <p className="font-display text-xl">Même moteur, autre langue</p>
            <p className="mt-2 text-sm text-muted">
              English, Español et LSF ont des sets. Les autres modules
              du centre s'ouvrent ici, sans changer de plante.
            </p>
          </Surface>
        )}
        {sets.map((set) => {
          const unlocked = isSetUnlocked(set.id, attempts, assigned);
          const summaries = set.items.map((item) =>
            summarisePronlabItem(item.id, attempts),
          );
          const mastered = summaries.filter((s) => s.mastered).length;
          const started = summaries.filter((s) => s.attemptCount > 0).length;
          const assignedHere = assigned.includes(set.id);
          return (
            <article
              key={set.id}
              className="flex flex-col rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Eyebrow>{set.kind}</Eyebrow>
                  <h2 className="mt-2 font-display text-2xl">{set.title}</h2>
                </div>
                {assignedHere ? (
                  <Badge variant="clay">Léa</Badge>
                ) : unlocked ? (
                  <Badge variant="outline">
                    {mastered}/{set.items.length}
                  </Badge>
                ) : (
                  <Lock className="size-4 text-subtle" />
                )}
              </div>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">
                {set.blurb}
              </p>
              <Progress
                className="mt-4"
                value={(mastered / set.items.length) * 100}
              />
              <p className="mt-2 text-xs tabular-nums text-subtle">
                {started} commencés · {mastered} maîtrisés
              </p>
              {unlocked ? (
                <Button asChild className="mt-5">
                  <Link to="/pronlab/$setId" params={{ setId: set.id }}>
                    Entrer
                  </Link>
                </Button>
              ) : (
                <p className="mt-5 text-xs text-subtle">
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
