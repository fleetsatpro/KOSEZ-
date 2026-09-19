import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Eyebrow, Page, Surface } from "@/components/app/primitives";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  attendanceProof,
  CPF_NARRATIVE,
  EVENTS,
  LANGUAGE_MODULES,
  LEARNER_MEMORY,
  NEXT_CLASS,
  planAllows,
  PLANS,
} from "@/lib/blossom/data";
import { countByType, resolveMemory } from "@/lib/blossom/engine";
import { useBlossom, useJourney } from "@/lib/blossom/store";
import { formatShortDate } from "@/lib/utils";

export const Route = createFileRoute("/_app/moi")({
  component: MoiPage,
});

function MoiPage() {
  const learner = useBlossom((s) => s.learner);
  const joined = useBlossom((s) => s.joinedEventIds);
  const enrolled = useBlossom((s) => s.enrolledIds);
  const log = useBlossom((s) => s.activityLog);
  const setParentMode = useBlossom((s) => s.setParentMode);
  const setTeacherMode = useBlossom((s) => s.setTeacherMode);
  const setOrgMode = useBlossom((s) => s.setOrgMode);
  const setChildMode = useBlossom((s) => s.setChildMode);
  const resetJourney = useBlossom((s) => s.resetJourney);
  const vocab = useBlossom((s) => s.vocabulary);
  const plan = useBlossom((s) => s.plan);
  const setPlan = useBlossom((s) => s.setPlan);
  const languageId = useBlossom((s) => s.languageId);
  const setLanguage = useBlossom((s) => s.setLanguage);
  const proofClaimed = useBlossom((s) => s.proofClaimed);
  const claimProof = useBlossom((s) => s.claimProof);
  const attempts = useBlossom((s) => s.pronlabAttempts);
  const memoryOn = planAllows(plan, "memory");
  const memory = resolveMemory(attempts, LEARNER_MEMORY);
  const completeHomework = useBlossom((s) => s.completeHomework);
  const homework = useBlossom((s) => s.homework).filter(
    (h) => h.studentId === "camille" && (h.status === "sent" || h.status === "done"),
  );
  const journey = useJourney();
  const proof = attendanceProof({
    missions: journey.missions.current,
    speak: journey.speak.current,
    pronlab: journey.pronlab.current,
    tandem: countByType(log, "TANDEM_COMPLETED"),
  });
  const calendar = [
    {
      id: NEXT_CLASS.id,
      title: NEXT_CLASS.title,
      when: `${formatShortDate(NEXT_CLASS.date)} · ${NEXT_CLASS.time}`,
    },
    ...EVENTS.filter((e) => joined.includes(e.id)).map((e) => ({
      id: e.id,
      title: e.title,
      when: `${formatShortDate(e.date)} · ${e.time}`,
    })),
  ];

  return (
    <Page className="max-w-2xl">
      <div className="flex items-end gap-5">
        <img
          src={learner.avatar}
          alt=""
          className="size-24 rounded-xl object-cover"
        />
        <div>
          <Eyebrow>MOI</Eyebrow>
          <h1 className="mt-1 font-display text-3xl tracking-tight">
            {learner.firstName} {learner.lastName}
          </h1>
          <p className="text-sm text-muted">{learner.city}</p>
        </div>
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        <Surface>
          <p className="text-xs uppercase tracking-[0.16em] text-muted">Langue</p>
          <p className="mt-2 font-display text-2xl">
            {learner.targetLanguage} · {learner.level}
          </p>
          <p className="mt-1 text-sm text-muted">
            {learner.nativeLanguage} · {learner.creole}
          </p>
        </Surface>
        <Surface>
          <p className="text-xs uppercase tracking-[0.16em] text-muted">BLOSSOM</p>
          <p className="mt-2 font-display text-2xl">{journey.stage.label}</p>
          <p className="mt-1 text-sm tabular-nums text-muted">
            {journey.points} points
          </p>
        </Surface>
      </div>

      {memoryOn ? (
      <Surface className="mt-4">
        <Eyebrow>Ce que Léo retient</Eyebrow>
        <p className="mt-3 text-sm leading-relaxed">{memory.leoNote}</p>
        <Separator className="my-4" />
        <p className="text-xs uppercase tracking-[0.16em] text-muted">Hésitation</p>
        <p className="mt-2 text-sm">{memory.hesitation}</p>
        <p className="mt-4 text-xs uppercase tracking-[0.16em] text-muted">
          Structure évitée
        </p>
        <p className="mt-2 text-sm">{memory.avoided}</p>
        <p className="mt-4 text-xs uppercase tracking-[0.16em] text-muted">
          Là où ça tient
        </p>
        <p className="mt-2 text-sm">{memory.confidence}</p>
      </Surface>
      ) : (
      <Surface className="mt-4">
        <Eyebrow>Mémoire Léo</Eyebrow>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Sur Digital, Léo reste dans la séance. La mémoire longue
          — hésitations, structures évitées — s'ouvre avec Premium
          ou le centre.
        </p>
      </Surface>
      )}

      <Surface className="mt-4">
        <Eyebrow>Objectif</Eyebrow>
        <p className="mt-3 text-sm leading-relaxed">{learner.goal}</p>
        <Separator className="my-4" />
        <p className="text-xs uppercase tracking-[0.16em] text-muted">
          Intérêts
        </p>
        <p className="mt-2 text-sm">{learner.interests.join(" · ")}</p>
        <p className="mt-4 text-xs uppercase tracking-[0.16em] text-muted">
          Créneau
        </p>
        <p className="mt-2 text-sm">{learner.practiceWindow}</p>
        <p className="mt-4 text-xs uppercase tracking-[0.16em] text-muted">
          Coach
        </p>
        <p className="mt-2 text-sm">
          {learner.coach} — {learner.coachVoice}
        </p>
      </Surface>

      <Surface className="mt-4">
        <Eyebrow>Formule</Eyebrow>
        <p className="mt-3 text-sm text-muted">
          Le centre reste le hub. Digital et Premium ouvrent le voyage à
          distance — sans en faire une appli générique.
        </p>
        <ul className="mt-4 space-y-3">
          {PLANS.map((item) => {
            const active = plan === item.id;
            return (
              <li
                key={item.id}
                className="rounded-md bg-surface-2 px-4 py-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-xs text-subtle">{item.price}</p>
                  </div>
                  {active ? (
                    <Badge>Actuelle</Badge>
                  ) : (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        setPlan(item.id);
                        toast(
                          item.id === "centre"
                            ? "Formule centre. Le parcours en salle reste le cœur."
                            : "Demande enregistrée. Un conseiller confirme l'abonnement.",
                        );
                      }}
                    >
                      Choisir
                    </Button>
                  )}
                </div>
                <p className="mt-2 text-sm text-muted">{item.blurb}</p>
              </li>
            );
          })}
        </ul>
      </Surface>

      {homework.length > 0 && (
        <Surface className="mt-4">
          <Eyebrow>Devoir reçu</Eyebrow>
          {homework.map((h) => (
            <div key={h.id} className="mt-3">
              <p className="font-medium">{h.title}</p>
              <p className="mt-1 text-sm text-muted">{h.body}</p>
              {h.status === "done" ? (
                <p className="mt-3 text-sm text-primary">Fait. Vous progressez.</p>
              ) : (
                <Button
                  size="sm"
                  className="mt-3"
                  onClick={() => {
                    completeHomework(h.id);
                    toast("Devoir noté. Léa reste l'autorité ; vous avez agi.");
                  }}
                >
                  J'ai fait
                </Button>
              )}
            </div>
          ))}
        </Surface>
      )}

      <Surface className="mt-4">
        <Eyebrow>Calendrier</Eyebrow>
        {calendar.length === 0 ? (
          <p className="mt-3 text-sm text-muted">Rien de noté pour l'instant.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {calendar.map((item) => (
              <li key={item.id} className="flex justify-between gap-3 text-sm">
                <span>{item.title}</span>
                <span className="text-muted">{item.when}</span>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-4 text-xs text-subtle">
          {enrolled.length} parcours · {vocab.length} mots gardés
        </p>
      </Surface>

      <Surface className="mt-4">
        <Eyebrow>Preuves</Eyebrow>
        <p className="mt-3 font-display text-xl">{proof.title}</p>
        <p className="mt-2 text-sm text-muted">{proof.note}</p>
        <ul className="mt-3 space-y-1 text-sm tabular-nums">
          {proof.lines.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
        {proofClaimed ? (
          <p className="mt-4 text-sm text-primary">Preuve versée dans MOI.</p>
        ) : (
          <Button
            className="mt-4 w-full"
            disabled={!proof.ready}
            onClick={() => {
              claimProof();
              toast("Attestation de régularité — pas un diplôme.");
            }}
          >
            {proof.ready ? "Émettre l'attestation" : "Cycle encore ouvert"}
          </Button>
        )}
        {proofClaimed && (
          <p className="mt-3 text-sm leading-relaxed text-muted">
            {CPF_NARRATIVE.body}
          </p>
        )}
      </Surface>

      <Surface className="mt-4">
        <Eyebrow>Langues du centre</Eyebrow>
        <ul className="mt-3 space-y-2">
          {LANGUAGE_MODULES.map((lang) => {
            const active = languageId === lang.id;
            return (
              <li key={lang.id}>
                <button
                  type="button"
                  onClick={() => setLanguage(lang.id)}
                  className="flex w-full items-center justify-between gap-3 rounded-md px-1 py-2 text-left text-sm hover:bg-surface-2"
                >
                  <span>{lang.name}</span>
                  <span className="text-muted">
                    {active ? "En cours" : lang.status}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </Surface>

      <div className="mt-6 flex flex-col gap-2">
        <Button variant="secondary" onClick={() => setTeacherMode(true)}>
          Ouvrir le studio enseignant
        </Button>
        <Button variant="secondary" onClick={() => setOrgMode(true)}>
          Ouvrir l'espace entreprise
        </Button>
        <Button variant="secondary" onClick={() => setParentMode(true)}>
          Ouvrir l'espace parent
        </Button>
        <Button variant="secondary" onClick={() => setChildMode(true)}>
          Ouvrir le parcours enfant
        </Button>
        <Button
          variant="ghost"
          onClick={() => {
            if (window.confirm("Revenir à l'état initial du voyage ?")) {
              resetJourney();
            }
          }}
        >
          Réinitialiser le voyage
        </Button>
      </div>
    </Page>
  );
}
