import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Check, MapPin, Backpack, Users, BookOpen, Volume2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Eyebrow, Page, Surface } from "@/components/app/primitives";
import { Button } from "@/components/ui/button";
import { IMMERSION, type CatalogueItem } from "@/lib/blossom/data";
import { getPublishedContentOnServer } from "@/lib/blossom/content.api";
import { useBlossom } from "@/lib/blossom/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/immersion")({
  component: ImmersionPage,
});

const PHASES = [
  { id: "pre" as const, label: "Avant", hint: "Préparer le terrain" },
  { id: "during" as const, label: "Pendant", hint: "Gestes dehors" },
  { id: "post" as const, label: "Après", hint: "Votre histoire" },
] as const;

/**
 * Immersion is a weekend companion — not a checklist app.
 * Three phases · real place · story that enters BLOSSOM.
 */
function ImmersionPage() {
  const [published, setPublished] = useState<CatalogueItem | null>(null);
  const [registryStatus, setRegistryStatus] = useState<"loading" | "available" | "unavailable" | "error">("loading");
  const phase = useBlossom((s) => s.immersionPhase);
  const setPhase = useBlossom((s) => s.setImmersionPhase);
  const done = useBlossom((s) => s.immersionDone);
  const completeChallenge = useBlossom((s) => s.completeChallenge);
  const complete = useBlossom((s) => s.completeActivity);
  const doneCount = done.length;
  const [reflection, setReflection] = useState("");
  const [reflectionSaved, setReflectionSaved] = useState(false);
  const total = IMMERSION.challenges.length;

  useEffect(() => {
    let disposed = false;
    void getPublishedContentOnServer()
      .then((content) => {
        if (!disposed) {
          const item = content.catalogue.find((entry) => entry.id === IMMERSION.id) ?? null;
          setPublished(item);
          setRegistryStatus(item ? "available" : "unavailable");
        }
      })
      .catch(() => {
        if (!disposed) setRegistryStatus("error");
      });
    return () => {
      disposed = true;
    };
  }, []);


  if (registryStatus === "loading") {
    return (
      <Page className="max-w-2xl">
        <Eyebrow>Companion · Immersion</Eyebrow>
        <p className="mt-4 text-sm text-muted">Vérification de l’expérience publiée…</p>
      </Page>
    );
  }

  if (registryStatus === "unavailable") {
    return (
      <Page className="max-w-2xl">
        <Eyebrow>Companion · Immersion</Eyebrow>
        <Surface className="mt-6">
          <h1 className="font-display text-2xl">Cette expérience n’est plus publiée.</h1>
          <p className="mt-2 text-sm leading-6 text-muted">
            Le contenu a été retiré du registre public. Retournez dans EXPLORE
            pour voir les expériences actuellement disponibles.
          </p>
          <Button asChild className="mt-5" variant="secondary">
            <Link to="/explore">Retour à EXPLORE</Link>
          </Button>
        </Surface>
      </Page>
    );
  }

  return (
    <Page className="kosez-feature-page max-w-2xl">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link to="/learn">
          <ArrowLeft className="size-4" />
          LEARN
        </Link>
      </Button>

      {/* Hero */}
      <div className="mt-6 overflow-hidden rounded-3xl border border-border/50">
        <div className="relative aspect-[16/10] sm:aspect-video">
          <img
            src="/images/reunion-coast.jpg"
            alt=""
            className="h-full w-full object-cover"
          />
          <div
            className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"
            aria-hidden
          />
          <div className="absolute inset-x-0 bottom-0 p-5 sm:p-7 text-white">
            <Eyebrow className="text-white/55">Companion · Immersion</Eyebrow>
            <h1 className="mt-1 font-display text-3xl tracking-tight sm:text-4xl">
              {published?.title ?? IMMERSION.title}
            </h1>
            <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-white/70">
              <span className="inline-flex items-center gap-1">
                <MapPin className="size-3.5" />
                {published?.location ?? IMMERSION.place}
              </span>
              <span aria-hidden>·</span>
              <span>{published?.schedule ?? IMMERSION.dates}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Phase tabs */}
      <div className="mt-6 flex gap-2" role="tablist" aria-label="Phases">
        {PHASES.map((p) => (
          <button
            key={p.id}
            type="button"
            role="tab"
            aria-selected={phase === p.id}
            onClick={() => setPhase(p.id)}
            className={cn(
              "flex-1 rounded-xl px-3 py-3 text-center transition-colors",
              phase === p.id
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-surface text-muted shadow-[var(--shadow-border)] hover:text-fg",
            )}
          >
            <span className="block text-sm font-medium">{p.label}</span>
            <span
              className={cn(
                "mt-0.5 block text-[10px]",
                phase === p.id
                  ? "text-primary-foreground/70"
                  : "text-subtle",
              )}
            >
              {p.hint}
            </span>
          </button>
        ))}
      </div>

      {phase === "pre" && (
        <div className="mt-6 space-y-4">
          <Surface className="!p-5 sm:!p-6">
            <div className="flex items-center gap-2">
              <MapPin className="size-4 text-primary" strokeWidth={1.7} />
              <Eyebrow>Itinéraire</Eyebrow>
            </div>
            <ul className="mt-5 space-y-0">
              {IMMERSION.itinerary.map((row, i) => (
                <li
                  key={row.when}
                  className={cn(
                    "flex justify-between gap-4 py-3 text-sm",
                    i < IMMERSION.itinerary.length - 1 &&
                      "border-b border-border/50",
                  )}
                >
                  <span className="shrink-0 tabular-nums text-muted">
                    {row.when}
                  </span>
                  <span className="text-right leading-6">
                    <span className="block">{row.what}</span>
                    <span className="mt-1 block text-xs text-subtle">{row.goal}</span>
                  </span>
                </li>
              ))}
            </ul>
          </Surface>

          <Surface className="!p-5 sm:!p-6">
            <div className="flex items-center gap-2">
              <Backpack className="size-4 text-primary" strokeWidth={1.7} />
              <Eyebrow>À emporter</Eyebrow>
            </div>
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {IMMERSION.packing.map((item) => (
                <li
                  key={item}
                  className="rounded-lg bg-surface-2 px-3 py-2.5 text-sm leading-5"
                >
                  {item}
                </li>
              ))}
            </ul>
          </Surface>

          <Surface className="!p-5 sm:!p-6">
            <div className="flex items-center gap-2">
              <Users className="size-4 text-primary" strokeWidth={1.7} />
              <Eyebrow>Le groupe</Eyebrow>
            </div>
            <p className="mt-3 text-sm leading-7">
              Le cercle est privé. Les noms et participants confirmés ne sont
              affichés qu’à partir des inscriptions réellement enregistrées.
            </p>
            <p className="mt-3 text-xs leading-5 text-subtle">
              Pas un feed social — un cercle fermé pour le weekend.
            </p>
          </Surface>

          <Surface className="!p-5 sm:!p-6">
            <div className="flex items-center gap-2">
              <Volume2 className="size-4 text-primary" strokeWidth={1.7} />
              <Eyebrow>Kit de terrain</Eyebrow>
            </div>
            <p className="mt-2 text-sm leading-6 text-muted">
              Cinq appuis utiles. Ils sont là pour soutenir l'action, pas pour
              remplacer votre parole.
            </p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {IMMERSION.fieldKit.map((item) => (
                <button
                  key={item.phrase}
                  type="button"
                  onClick={() => {
                    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
                    const utterance = new SpeechSynthesisUtterance(item.phrase);
                    utterance.lang = "en-GB";
                    utterance.rate = 0.9;
                    window.speechSynthesis.cancel();
                    window.speechSynthesis.speak(utterance);
                  }}
                  className="rounded-xl border border-border bg-surface-2/35 p-3 text-left transition hover:-translate-y-0.5 hover:border-primary/20"
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="font-display text-lg">{item.phrase}</span>
                    <Volume2 className="size-3.5 text-subtle" />
                  </span>
                  <span className="mt-1 block text-xs leading-5 text-muted">{item.use}</span>
                </button>
              ))}
            </div>
          </Surface>
        </div>
      )}

      {phase === "during" && (
        <div className="mt-6 space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2">
                <Sparkles className="size-4 text-primary" />
                <Eyebrow>Gestes dehors</Eyebrow>
              </div>
              <p className="mt-2 text-sm leading-6 text-muted">
                Quatre situations, quatre intentions. Faites le geste dans le
                monde réel, puis gardez une trace honnête ici.
              </p>
            </div>
            <p className="text-xs tabular-nums text-subtle">
              {doneCount} / {total}
            </p>
          </div>

          <div className="h-1 overflow-hidden rounded-full bg-surface-2">
            <div
              className="h-full rounded-full bg-primary/90 transition-[width] duration-500"
              style={{
                width: `${total ? (doneCount / total) * 100 : 0}%`,
              }}
            />
          </div>

          {IMMERSION.challenges.map((challenge, i) => {
            const id = challenge.id;
            const ok = done.includes(id);
            return (
              <Surface
                key={id}
                className={cn(
                  "overflow-hidden !p-0",
                  ok && "border border-primary/20 bg-primary/5",
                )}
              >
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-subtle">
                        Geste {i + 1} · {challenge.place}
                      </p>
                      <p className="mt-2 font-display text-2xl tracking-tight">
                        {challenge.title}
                      </p>
                    </div>
                    {ok ? (
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <Check className="size-4" />
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-3 text-sm leading-7">{challenge.action}</p>
                </div>

                <div className="grid gap-px border-t border-border bg-border sm:grid-cols-[1fr_1fr_auto]">
                  <div className="bg-surface p-4">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-subtle">Appui</p>
                    <p className="mt-1 text-sm font-medium">{challenge.languageCue}</p>
                  </div>
                  <div className="bg-surface p-4">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-subtle">Extension</p>
                    <p className="mt-1 text-sm leading-5 text-muted">{challenge.stretch}</p>
                  </div>
                  <div className="bg-surface p-4 sm:flex sm:items-center">
                    <Button
                      size="sm"
                      variant={ok ? "secondary" : "default"}
                      onClick={() => completeChallenge(id)}
                      disabled={ok}
                      className="w-full sm:w-auto"
                    >
                      {ok ? <Check className="size-4" /> : "J’ai fait le geste"}
                    </Button>
                  </div>
                </div>
              </Surface>
            );
          })}
        </div>
      )}

      {phase === "post" && (
        <Surface className="mt-6 !p-5 sm:!p-7">
          <div className="flex items-center gap-2">
            <BookOpen className="size-4 text-primary" strokeWidth={1.7} />
            <Eyebrow>Votre histoire</Eyebrow>
          </div>
          <p className="mt-5 font-display text-2xl leading-snug tracking-tight sm:text-3xl">
            {IMMERSION.story}
          </p>
          <p className="mt-5 text-sm leading-6 text-muted">
            {doneCount} défi{doneCount > 1 ? "s" : ""} tenu
            {doneCount > 1 ? "s" : ""} pendant le weekend.
            {doneCount === 0
              ? " Les gestes restent ouverts tant que vous êtes sur place."
              : " Ils nourrissent le voyage."}
          </p>

          <div className="mt-7 rounded-2xl border border-border bg-surface-2/35 p-4 sm:p-5">
            <Eyebrow>Débrief</Eyebrow>
            <label className="mt-3 block text-sm font-medium" htmlFor="immersion-reflection">
              Quel moment vous a obligé à chercher vos mots ?
            </label>
            <textarea
              id="immersion-reflection"
              value={reflection}
              onChange={(event) => {
                setReflection(event.target.value);
                setReflectionSaved(false);
              }}
              rows={4}
              maxLength={600}
              className="mt-3 w-full resize-y rounded-xl border border-border bg-surface px-3.5 py-3 text-sm leading-6 outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
              placeholder="Une scène, une phrase, une difficulté — pas un résumé scolaire."
            />
            <div className="mt-2 flex items-center justify-between gap-3 text-xs text-subtle">
              <span>{reflection.length}/600</span>
              <span>{reflectionSaved ? "Débrief conservé dans cette session." : "Écrivez ce que vous avez réellement rencontré."}</span>
            </div>
          </div>

          <Button
            className="mt-8 w-full"
            size="lg"
            disabled={doneCount === 0 || reflection.trim().length < 12}
            onClick={() => {
              if (reflection.trim().length < 12) return;
              const result = complete("IMMERSION_ATTENDED", IMMERSION.id);
              if (result.ok || result.reason === "already") {
                setReflectionSaved(true);
                toast(
                  result.ok
                    ? "L'immersion entre dans le voyage."
                    : "Déjà enregistrée.",
                );
              }
            }}
          >
            {reflectionSaved ? "Immersion inscrite" : "Inscrire au BLOSSOM"}
          </Button>
        </Surface>
      )}
    </Page>
  );
}
