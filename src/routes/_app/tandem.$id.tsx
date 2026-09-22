import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { X, RefreshCw, Flag, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { Eyebrow, Surface } from "@/components/app/primitives";
import { Button } from "@/components/ui/button";
import {
  TANDEM_DEBRIEF,
  TANDEM_PARTNERS,
  TANDEM_PROMPTS,
} from "@/lib/blossom/data";
import { useBlossom } from "@/lib/blossom/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/tandem/$id")({
  component: TandemSession,
});

const HALF = 90;

/**
 * Full-bleed timed exchange.
 * Two halves · private debrief · no public score.
 */
function TandemSession() {
  const { id } = Route.useParams();
  const partner = TANDEM_PARTNERS.find((p) => p.id === id);
  const navigate = useNavigate();
  const complete = useBlossom((s) => s.completeActivity);
  const reportTandem = useBlossom((s) => s.reportTandem);
  const [half, setHalf] = useState<"english" | "french">("english");
  const [left, setLeft] = useState(HALF);
  const [promptIndex, setPromptIndex] = useState(0);
  const [done, setDone] = useState(false);
  const [running, setRunning] = useState(true);
  const [phase, setPhase] = useState<"live" | "transition" | "debrief">("live");

  useEffect(() => {
    if (!running || done || phase !== "live") return;
    const t = window.setInterval(() => {
      setLeft((s) => {
        if (s <= 1) {
          if (half === "english") {
            setPhase("transition");
            setRunning(false);
            return 0;
          }
          setDone(true);
          setPhase("debrief");
          setRunning(false);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => window.clearInterval(t);
  }, [running, done, half, phase]);

  if (!partner) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-bg px-6">
        <div className="text-center">
          <p className="font-display text-2xl">Partenaire introuvable</p>
          <Button asChild className="mt-4">
            <Link to="/tandem">Retour</Link>
          </Button>
        </div>
      </div>
    );
  }

  const prompts = TANDEM_PROMPTS[half];
  const prompt = prompts[promptIndex % prompts.length]!;
  const debrief = TANDEM_DEBRIEF[partner.id] ?? TANDEM_DEBRIEF.noah!;
  const firstName = partner.name.split(" ")[0]!;
  const progress = ((HALF - left) / HALF) * 100;

  function startSecondHalf() {
    setHalf("french");
    setPromptIndex(0);
    setLeft(HALF);
    setPhase("live");
    setRunning(true);
  }

  function finish() {
    complete("TANDEM_COMPLETED", `tandem-${id}`);
    toast("Session close. Vous progressez.");
    navigate({ to: "/tandem" });
  }

  if (phase === "debrief" || done) {
    return (
      <div className="min-h-dvh bg-bg px-5 py-10 text-fg">
        <div className="mx-auto max-w-lg">
          <Eyebrow>Débrief privé</Eyebrow>
          <h1 className="mt-2 font-display text-3xl tracking-tight sm:text-4xl">
            Avec {firstName}
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted">
            Pour vous seul. Rien n'est comparé, rien n'est publié. Léo a
            écouté des deux côtés.
          </p>

          <div className="mt-8 space-y-4">
            <Surface className="!p-5 border border-primary/20 bg-primary/5">
              <Eyebrow className="text-primary/80">Force</Eyebrow>
              <p className="mt-3 text-sm leading-7">{debrief.strength}</p>
            </Surface>
            <Surface className="!p-5">
              <Eyebrow>À ajuster</Eyebrow>
              <p className="mt-3 text-sm leading-7">{debrief.improvement}</p>
            </Surface>
          </div>

          <p className="mt-6 text-xs leading-5 text-subtle">
            Ce débrief n'entre pas dans un classement. Il nourrit la mémoire
            de Léo pour les prochaines missions.
          </p>

          <Button className="mt-8 w-full" size="lg" onClick={finish}>
            Clore la session
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </div>
    );
  }

  if (phase === "transition") {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-bg px-6 text-center text-fg">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-subtle">
          Mi-temps
        </p>
        <h1 className="mt-4 font-display text-3xl tracking-tight sm:text-4xl">
          Maintenant : français
        </h1>
        <p className="mt-3 max-w-sm text-sm leading-6 text-muted">
          C'est le tour de {firstName}. Vous écoutez, vous aidez, vous
          parlez dans sa langue.
        </p>
        <Button className="mt-8" size="lg" onClick={startSecondHalf}>
          Continuer
          <ArrowRight className="size-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col bg-primary text-primary-foreground">
      {/* Progress rail */}
      <div className="h-1 w-full bg-primary-foreground/10">
        <div
          className="h-full bg-primary-foreground/70 transition-[width] duration-1000 linear"
          style={{ width: `${progress}%` }}
        />
      </div>

      <header className="flex items-center justify-between px-5 py-4">
        <p className="text-sm tabular-nums text-primary-foreground/70">
          {Math.floor(left / 60)}:{String(left % 60).padStart(2, "0")}
        </p>
        <div className="text-center">
          <p className="font-display text-lg">
            {half === "english" ? "English" : "Français"}
          </p>
          <p className="text-[10px] uppercase tracking-[0.16em] text-primary-foreground/50">
            avec {firstName}
          </p>
        </div>
        <button
          type="button"
          aria-label="Quitter"
          className="rounded-lg p-2 transition-colors hover:bg-primary-foreground/10"
          onClick={() => {
            setDone(true);
            setPhase("debrief");
            setRunning(false);
          }}
        >
          <X className="size-5" />
        </button>
      </header>

      <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <p className="text-[11px] uppercase tracking-[0.2em] text-primary-foreground/55">
          {half === "english"
            ? "Votre cible"
            : `La langue de ${firstName}`}
        </p>
        <p className="mt-6 max-w-md font-display text-3xl leading-snug tracking-tight sm:text-4xl">
          {prompt}
        </p>
        <p className="mt-8 max-w-xs text-sm leading-6 text-primary-foreground/60">
          Session courte de démonstration — 90 s + 90 s. En vrai : 30 + 30.
        </p>
      </div>

      <div className="flex flex-col gap-2 px-6 pb-10">
        <Button
          className="w-full bg-primary-foreground text-fg hover:bg-primary-foreground/92"
          onClick={() => setPromptIndex((n) => n + 1)}
        >
          <RefreshCw className="size-4" />
          Autre amorce
        </Button>
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
            onClick={() => {
              const result = reportTandem(id);
              toast(
                result.escalated
                  ? "Signalement répété. Un coordinateur reprend le dossier."
                  : "Signalement reçu. Un coordinateur relit.",
              );
              navigate({ to: "/tandem" });
            }}
          >
            <Flag className="size-3.5" />
            Signaler
          </Button>
          <Button
            variant="outline"
            className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
            asChild
          >
            <Link to="/tandem">Partir</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
