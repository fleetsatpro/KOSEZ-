import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  CHILD,
  LEARNER,
  LEARNER_MEMORY,
  NEXT_CLASS,
  WEEK_SPEAKING,
} from "@/lib/blossom/data";
import { useBlossomWorkspaceAccess } from "@/lib/blossom/access";
import { useBlossom, useJourney } from "@/lib/blossom/store";
import { formatLongDate } from "@/lib/utils";
import { Eyebrow, Page, Surface } from "./primitives";

type Who = "camille" | "emile";

export function ParentView() {
  const setParentMode = useBlossom((s) => s.setParentMode);
  const setChildMode = useBlossom((s) => s.setChildMode);
  const journey = useJourney();
  const childDone = useBlossom((s) => s.childMissionDone);
  const childWords = useBlossom((s) => s.childWords);
  const minutes = WEEK_SPEAKING.reduce((sum, d) => sum + d.minutes, 0);
  const [who, setWho] = useState<Who>("emile");
  const { access, pending: accessPending } = useBlossomWorkspaceAccess();

  if (accessPending) {
    return (
      <Page className="max-w-lg">
        <Eyebrow>Espace parent</Eyebrow>
        <p className="mt-3 text-sm text-muted">Vérification des autorisations…</p>
      </Page>
    );
  }

  if (!access.isGuardian) {
    return (
      <Page className="max-w-lg">
        <Eyebrow>Espace parent</Eyebrow>
        <h1 className="mt-2 font-display text-2xl">Accès non disponible</h1>
        <p className="mt-3 text-sm leading-6 text-muted">Aucun lien parent actif n’est associé à ce compte.</p>
        <Button
          variant="secondary"
          className="mt-6"
          onClick={() => setParentMode(false)}
        >
          Revenir au voyage
        </Button>
      </Page>
    );
  }

  return (
    <Page className="max-w-lg">
      <Eyebrow>Espace parent</Eyebrow>
      <h1 className="mt-2 font-display text-3xl tracking-tight">
        La semaine, pas le travail
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        Vous voyez où ils en sont. Vous ne parlez pas à leur place.
      </p>

      <div className="mt-6 flex gap-2">
        {(["emile", "camille"] as const).map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => setWho(id)}
            className={`h-11 rounded-md px-4 text-sm ${
              who === id
                ? "bg-primary text-primary-foreground"
                : "bg-surface text-muted shadow-[var(--shadow-border)]"
            }`}
          >
            {id === "emile" ? "Émile" : "Camille"}
          </button>
        ))}
      </div>

      {who === "emile" ? (
        <>
          <Surface className="mt-8">
            <p className="font-display text-2xl">{CHILD.firstName}</p>
            <p className="mt-1 text-sm text-muted">
              {CHILD.age} ans · {CHILD.targetLanguage} {CHILD.level} ·{" "}
              {CHILD.relation}
            </p>
            <ul className="mt-4 space-y-3 text-sm">
              <li className="flex justify-between gap-4">
                <span className="text-muted">Activités</span>
                <span className="tabular-nums">
                  {CHILD.activitiesDone + (childDone ? 1 : 0)} cette semaine
                </span>
              </li>
              <li className="flex justify-between gap-4">
                <span className="text-muted">Parole</span>
                <span className="tabular-nums">{CHILD.speakingMinutes} min</span>
              </li>
              <li className="flex justify-between gap-4">
                <span className="text-muted">Mots écoutés</span>
                <span className="tabular-nums">
                  {childWords.length} / {CHILD.words.length}
                </span>
              </li>
              <li className="flex justify-between gap-4">
                <span className="text-muted">BLOSSOM</span>
                <span>{CHILD.stageLabel}</span>
              </li>
            </ul>
          </Surface>
          <Surface className="mt-4">
            <p className="text-xs uppercase tracking-[0.16em] text-muted">
              Prochain atelier
            </p>
            <p className="mt-3 font-display text-xl">{CHILD.nextWorkshop}</p>
            <p className="mt-2 text-sm text-muted">
              Pas de bouton « faire la mission ». L'espace enfant est à lui.
            </p>
          </Surface>
          {childDone && (
            <Surface className="mt-4">
              <Eyebrow>Aujourd'hui</Eyebrow>
              <p className="mt-3 text-sm leading-relaxed">
                Émile a parlé. Vous voyez le jalon — pas l'enregistrement.
              </p>
            </Surface>
          )}
          <Button
            className="mt-6 w-full"
            variant="secondary"
            onClick={() => setChildMode(true)}
          >
            Ouvrir l'espace enfant
          </Button>
        </>
      ) : (
        <>
          <Surface className="mt-8">
            <p className="font-display text-2xl">{LEARNER.firstName}</p>
            <p className="mt-1 text-sm text-muted">
              {LEARNER.targetLanguage} {LEARNER.level} · parcours adulte
            </p>
            <ul className="mt-4 space-y-3 text-sm">
              <li className="flex justify-between gap-4">
                <span className="text-muted">Activités</span>
                <span className="tabular-nums">
                  {journey.missions.current} missions
                </span>
              </li>
              <li className="flex justify-between gap-4">
                <span className="text-muted">Parole</span>
                <span className="tabular-nums">{minutes} min</span>
              </li>
              <li className="flex justify-between gap-4">
                <span className="text-muted">Présence</span>
                <span>Prochain cours noté</span>
              </li>
              <li className="flex justify-between gap-4">
                <span className="text-muted">BLOSSOM</span>
                <span>{journey.stage.label}</span>
              </li>
            </ul>
          </Surface>
          <Surface className="mt-4">
            <p className="text-xs uppercase tracking-[0.16em] text-muted">
              Prochain cours
            </p>
            <p className="mt-3 font-display text-xl">{NEXT_CLASS.title}</p>
            <p className="mt-1 text-sm text-muted">
              {formatLongDate(NEXT_CLASS.date)} · {NEXT_CLASS.time} ·{" "}
              {NEXT_CLASS.place}
            </p>
          </Surface>
          <Surface className="mt-4">
            <p className="text-xs uppercase tracking-[0.16em] text-muted">
              Ce que Léo retient
            </p>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              {LEARNER_MEMORY.hesitation}. Vous voyez la semaine, pas les
              enregistrements.
            </p>
          </Surface>
        </>
      )}

      <Button
        variant="secondary"
        className="mt-8 w-full"
        onClick={() => setParentMode(false)}
      >
        Revenir au voyage
      </Button>
    </Page>
  );
}
