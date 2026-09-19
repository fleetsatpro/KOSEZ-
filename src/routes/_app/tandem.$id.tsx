import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import { Eyebrow, Surface } from "@/components/app/primitives";
import { Button } from "@/components/ui/button";
import { TANDEM_DEBRIEF, TANDEM_PARTNERS, TANDEM_PROMPTS } from "@/lib/blossom/data";
import { useBlossom } from "@/lib/blossom/store";

export const Route = createFileRoute("/_app/tandem/$id")({
  component: TandemSession,
});

const HALF = 90;

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

  useEffect(() => {
    if (!running || done) return;
    const t = window.setInterval(() => {
      setLeft((s) => {
        if (s <= 1) {
          if (half === "english") {
            setHalf("french");
            setPromptIndex(0);
            return HALF;
          }
          setDone(true);
          setRunning(false);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => window.clearInterval(t);
  }, [running, done, half]);

  if (!partner) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-bg px-6">
        <p className="font-display text-2xl">Partenaire introuvable</p>
      </div>
    );
  }

  const prompts = TANDEM_PROMPTS[half];
  const prompt = prompts[promptIndex % prompts.length]!;
  const debrief = TANDEM_DEBRIEF[partner.id] ?? TANDEM_DEBRIEF.noah!;

  function finish() {
    complete("TANDEM_COMPLETED", `tandem-${id}`);
    toast("Session close. Vous progressez.");
    navigate({ to: "/tandem" });
  }

  if (done) {
    return (
      <div className="min-h-dvh bg-bg px-5 py-10 text-fg">
        <div className="mx-auto max-w-lg">
          <Eyebrow>Débrief privé</Eyebrow>
          <h1 className="mt-2 font-display text-3xl">Avec {partner.name.split(" ")[0]}</h1>
          <p className="mt-2 text-sm text-muted">
            Pour vous seul. Rien n'est comparé, rien n'est publié.
          </p>
          <div className="mt-6 space-y-3">
            <Surface>
              <Eyebrow>Force</Eyebrow>
              <p className="mt-2 text-sm leading-relaxed">{debrief.strength}</p>
            </Surface>
            <Surface>
              <Eyebrow>À ajuster</Eyebrow>
              <p className="mt-2 text-sm leading-relaxed">{debrief.improvement}</p>
            </Surface>
          </div>
          <Button className="mt-6 w-full" onClick={finish}>
            Clore
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col bg-primary text-primary-foreground">
      <header className="flex items-center justify-between px-5 py-4">
        <p className="text-sm tabular-nums text-primary-foreground/70">
          {Math.floor(left / 60)}:{String(left % 60).padStart(2, "0")}
        </p>
        <p className="font-display text-lg">
          {half === "english" ? "English" : "Français"} · {partner.name.split(" ")[0]}
        </p>
        <button
          type="button"
          aria-label="Quitter"
          className="p-2"
          onClick={() => {
            setDone(true);
            setRunning(false);
          }}
        >
          <X className="size-5" />
        </button>
      </header>

      <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <p className="text-[11px] uppercase tracking-[0.2em] text-primary-foreground/60">
          {half === "english" ? "Votre cible" : `La langue de ${partner.name.split(" ")[0]}`}
        </p>
        <p className="mt-6 max-w-md font-display text-3xl leading-snug">
          {prompt}
        </p>
        <p className="mt-6 text-sm text-primary-foreground/70">
          Session courte de démonstration — 90 s + 90 s. En vrai : 30 + 30.
        </p>
      </div>

      <div className="flex flex-col gap-2 px-6 pb-10">
        <Button
          className="w-full bg-primary-foreground text-fg hover:bg-primary-foreground/92"
          onClick={() => setPromptIndex((n) => n + 1)}
        >
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
