import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { RecordControl } from "@/components/app/record-control";
import { Eyebrow, Page, Surface } from "@/components/app/primitives";
import { Button } from "@/components/ui/button";
import { MISSION_FEEDBACK, TODAY_MISSION, LEARNER_MEMORY, planAllows } from "@/lib/blossom/data";
import { hasSource, personaliseMission, resolveMemory } from "@/lib/blossom/engine";
import { useBlossom } from "@/lib/blossom/store";
import { track } from "@/lib/analytics";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/mission")({
  component: MissionPage,
});

type Step = "brief" | "record" | "feedback";

function MissionPage() {
  const navigate = useNavigate();
  const log = useBlossom((s) => s.activityLog);
  const complete = useBlossom((s) => s.completeActivity);
  const attempts = useBlossom((s) => s.pronlabAttempts);
  const plan = useBlossom((s) => s.plan);
  const already = hasSource(log, TODAY_MISSION.id);
  const [step, setStep] = useState<Step>(already ? "feedback" : "brief");
  const memoryOn = planAllows(plan, "memory");
  const mission = personaliseMission(
    TODAY_MISSION,
    resolveMemory(attempts, LEARNER_MEMORY),
    memoryOn,
  );

  function closeMission() {
    const result = complete("MISSION_COMPLETED", TODAY_MISSION.id);
    if (result.ok) {
      toast("Mission enregistrée. Vous progressez.");
    }
    navigate({ to: "/" });
  }

  return (
    <Page className="max-w-xl">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link to="/">
          <ArrowLeft className="size-4" />
          BLOSSOM
        </Link>
      </Button>

      <Eyebrow className="mt-6">Mission du jour</Eyebrow>
      <h1 className="mt-2 font-display text-4xl tracking-tight">
        {mission.title}
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        {mission.prompt}
      </p>
      <p className="mt-2 text-xs text-subtle">
        {TODAY_MISSION.durationMin} min · {TODAY_MISSION.level} ·{" "}
        {TODAY_MISSION.place}
      </p>
      <p className="mt-4 text-sm leading-relaxed text-muted">
        Léo — {LEARNER_MEMORY.leoNote}
      </p>

      {step === "brief" && (
        <Surface className="mt-8">
          <p className="text-sm leading-relaxed text-muted">
            {mission.context}
          </p>
          {mission.leo ? (
            <p className="mt-4 text-sm text-muted">Léo — {mission.leo}</p>
          ) : null}
          <Button
            className="mt-6 w-full"
            onClick={() => {
              track("mission_started");
              setStep("record");
            }}
          >
            À vous de jouer
          </Button>
        </Surface>
      )}

      {step === "record" && (
        <Surface className="mt-8 py-10">
          <p className="mb-8 text-center text-sm text-muted">
            Parlez comme vous le feriez en face de quelqu'un. Pas de
            script.
          </p>
          <RecordControl onFinished={() => setStep("feedback")} />
        </Surface>
      )}

      {step === "feedback" && (
        <div className="mt-8 space-y-3">
          <Surface>
            <Eyebrow>Force</Eyebrow>
            <p className="mt-2 text-sm leading-relaxed">
              {MISSION_FEEDBACK.strength}
            </p>
          </Surface>
          <Surface>
            <Eyebrow>À ajuster</Eyebrow>
            <p className="mt-2 text-sm leading-relaxed">
              {MISSION_FEEDBACK.improvement}
            </p>
          </Surface>
          <Surface>
            <Eyebrow>Phrase modèle</Eyebrow>
            <p className="mt-2 font-display text-xl">
              {MISSION_FEEDBACK.model}
            </p>
            <p className="mt-2 text-sm text-muted">{MISSION_FEEDBACK.note}</p>
          </Surface>
          <Button className="mt-4 w-full" onClick={closeMission}>
            {already ? "Revenir au voyage" : "Clore la mission"}
          </Button>
        </div>
      )}
    </Page>
  );
}
