import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Flag, RefreshCw, X } from "lucide-react";
import { toast } from "sonner";
import { Eyebrow, Surface } from "@/components/app/primitives";
import { Button } from "@/components/ui/button";
import {
  LANGUAGE_MODULES,
  TANDEM_PROMPTS,
} from "@/lib/blossom/data";
import {
  endTandemSessionOnServer,
  getTandemSessionOnServer,
  logTandemPromptOnServer,
  startTandemSessionOnServer,
} from "@/lib/blossom/domain.api";
import { useBlossom } from "@/lib/blossom/store";

export const Route = createFileRoute("/_app/tandem/$id")({
  component: TandemSession,
});

const HALF_SECONDS = 30 * 60;

type Candidate = NonNullable<
  Awaited<ReturnType<typeof getTandemSessionOnServer>>
>;

function languageLabel(id: string) {
  return LANGUAGE_MODULES.find((language) => language.id === id)?.name ?? id;
}

function TandemSession() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const complete = useBlossom((s) => s.completeActivity);
  const reportTandem = useBlossom((s) => s.reportTandem);
  const [partner, setPartner] = useState<Candidate | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const lastLoggedPrompt = useRef("");
  const [half, setHalf] = useState<"target" | "partner">("target");
  const [left, setLeft] = useState(HALF_SECONDS);
  const [promptIndex, setPromptIndex] = useState(0);
  const [phase, setPhase] = useState<"live" | "transition" | "complete">("live");
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    let disposed = false;
    setLoading(true);
    void getTandemSessionOnServer({ data: { partnerUserId: id } })
      .then(async (candidate) => {
        if (disposed || !candidate) return;
        const durableSessionId = await startTandemSessionOnServer({
          data: { partnerUserId: id },
        });
        if (!disposed) {
          setPartner(candidate);
          setSessionId(durableSessionId);
        }
      })
      .catch(() => {
        if (!disposed) {
          setPartner(null);
          setAuthError("Cette session n’est plus ouverte pour votre compte.");
        }
      })
      .finally(() => {
        if (!disposed) setLoading(false);
      });

    return () => {
      disposed = true;
    };
  }, [id]);

  useEffect(() => {
    if (phase !== "live") return;
    const timer = window.setInterval(() => {
      setLeft((value) => {
        if (value <= 1) {
          if (half === "target") {
            setHalf("partner");
            setPromptIndex(0);
            setPhase("transition");
            return 0;
          }
          setPhase("complete");
          return 0;
        }
        return value - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [half, phase]);

  const prompts = useMemo(
    () =>
      half === "target"
        ? TANDEM_PROMPTS.english
        : TANDEM_PROMPTS.french,
    [half],
  );

  const prompt = prompts[promptIndex % prompts.length]!;

  useEffect(() => {
    if (!sessionId || phase !== "live" || !partner) return;
    const language = half === "target" ? partner.wants : partner.speaks;
    const promptKey = `${half}:${promptIndex}:${prompt}`;
    if (lastLoggedPrompt.current === promptKey) return;
    lastLoggedPrompt.current = promptKey;
    void logTandemPromptOnServer({
      data: { sessionId, language, prompt },
    }).catch(() => {
      lastLoggedPrompt.current = "";
    });
  }, [half, partner, phase, prompt, promptIndex, sessionId]);

  async function leaveSession() {
    if (closing) return;
    setClosing(true);
    try {
      if (sessionId) {
        await endTandemSessionOnServer({
          data: { sessionId, status: "cancelled" },
        });
      }
      navigate({ to: "/tandem" });
    } catch {
      setClosing(false);
      toast("La sortie locale n’est pas confirmée tant que la fermeture serveur n’a pas été enregistrée.");
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-bg px-6">
        <div className="text-center">
          <span className="mx-auto block size-2 animate-pulse rounded-full bg-primary" />
          <p className="mt-4 text-sm text-muted">Vérification de la session…</p>
        </div>
      </div>
    );
  }

  if (!partner || authError) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-bg px-6">
        <div className="w-full max-w-md text-center">
          <Eyebrow>Tandem</Eyebrow>
          <h1 className="mt-3 font-display text-3xl tracking-tight">
            Session non disponible
          </h1>
          <p className="mt-3 text-sm leading-6 text-muted">
            {authError ?? "Ce partenaire n’est plus disponible."}
          </p>
          <Button asChild className="mt-6">
            <Link to="/tandem">Retour au tandem</Link>
          </Button>
        </div>
      </div>
    );
  }

  const progress = ((HALF_SECONDS - left) / HALF_SECONDS) * 100;

  async function finish() {
    const activePartner = partner;
    if (!activePartner || !sessionId || closing) return;
    setClosing(true);
    let closure;
    try {
      closure = await endTandemSessionOnServer({
        data: { sessionId, status: "completed" },
      });
    } catch {
      setClosing(false);
      toast("La session n’a pas pu être clôturée côté serveur.");
      return;
    }
    const durationMinutes = Math.min(
      60,
      Math.max(0, Math.round(closure.durationSeconds / 60)),
    );
    complete(
      "TANDEM_COMPLETED",
      `tandem-session-${sessionId}`,
      undefined,
      { minutes: durationMinutes, durationSeconds: closure.durationSeconds, sessionId },
    );
    toast("Session terminée. Votre participation est enregistrée.");
    navigate({ to: "/tandem" });
  }

  if (phase === "transition") {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-bg px-6 text-center text-fg">
        <Eyebrow>Premier tour terminé</Eyebrow>
        <h1 className="mt-4 font-display text-3xl tracking-tight sm:text-4xl">
          Maintenant : {partner.speaks}
        </h1>
        <p className="mt-3 max-w-sm text-sm leading-6 text-muted">
          Les rôles s’inversent. Prenez votre temps, puis laissez l’autre personne parler.
        </p>
        <Button
          className="mt-8"
          size="lg"
          onClick={() => {
            setLeft(HALF_SECONDS);
            setPhase("live");
          }}
        >
          Commencer le second tour
          <ArrowRight className="size-4" />
        </Button>
      </div>
    );
  }

  if (phase === "complete") {
    return (
      <div className="min-h-dvh bg-bg px-5 py-10 text-fg">
        <div className="mx-auto max-w-lg">
          <Eyebrow>Session terminée</Eyebrow>
          <h1 className="mt-2 font-display text-3xl tracking-tight sm:text-4xl">
            Avec {partner.name}
          </h1>

          <Surface className="mt-8">
            <Eyebrow>Ce qui est réellement enregistré</Eyebrow>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <Metric label="Cadre" value="30 + 30 min" />
              <Metric
                label="Votre moitié"
                value={`${languageLabel(partner.wants)} · cible`}
              />
              <Metric
                label="Sa moitié"
                value={`${partner.speaks} · partenaire`}
              />
              <Metric label="Score" value="Aucun" />
            </div>
          </Surface>

          <Surface className="mt-4">
            <Eyebrow>Débrief</Eyebrow>
            <p className="mt-3 text-sm leading-7 text-muted">
              K’Osez n’invente pas un débrief vocal lorsqu’aucune transcription
              ou analyse audio fiable n’a été produite. Cette session compte
              comme participation au tandem ; son contenu n’est ni noté ni publié.
            </p>
          </Surface>

          <Button className="mt-8 w-full" size="lg" disabled={closing} onClick={() => void finish()}>
            Clore la session
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col bg-primary text-primary-foreground">
      <div className="h-1 w-full bg-primary-foreground/10">
        <div
          className="h-full bg-primary-foreground/75 transition-[width] duration-1000 linear"
          style={{ width: `${progress}%` }}
        />
      </div>

      <header className="flex items-center justify-between gap-4 px-5 py-4">
        <p className="text-sm tabular-nums text-primary-foreground/70">
          {Math.floor(left / 60)}:{String(left % 60).padStart(2, "0")}
        </p>
        <div className="text-center">
          <p className="font-display text-lg">
            {half === "target" ? languageLabel(partner.wants) : partner.speaks}
          </p>
          <p className="text-[10px] uppercase tracking-[0.16em] text-primary-foreground/50">
            Avec {partner.name}
          </p>
        </div>
        <button
          type="button"
          aria-label="Quitter"
          className="rounded-lg p-2 transition-colors hover:bg-primary-foreground/10"
          onClick={() => void leaveSession()}
        >
          <X className="size-5" />
        </button>
      </header>

      <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <p className="text-[11px] uppercase tracking-[0.2em] text-primary-foreground/55">
          {half === "target" ? "À vous" : `À ${partner.name.split(" ")[0]}`}
        </p>
        <p className="mt-6 max-w-2xl font-display text-3xl leading-snug tracking-tight sm:text-4xl">
          {prompt}
        </p>
        <p className="mt-8 max-w-md text-sm leading-6 text-primary-foreground/55">
          Parlez réellement avec votre partenaire. Les amorces sont là pour
          relancer, pas pour devenir un script.
        </p>
      </div>

      <div className="flex flex-col gap-2 px-6 pb-10">
        <Button
          variant="secondary"
          className="w-full"
          onClick={() => setPromptIndex((index) => index + 1)}
        >
          <RefreshCw className="size-4" />
          Autre amorce
        </Button>
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
            onClick={async () => {
              if (closing) return;
              reportTandem(id);
              setClosing(true);
              try {
                if (sessionId) {
                  await endTandemSessionOnServer({
                    data: { sessionId, status: "cancelled" },
                  });
                }
                toast(
                  "Signalement transmis au circuit de sécurité. Le profil est masqué pour vous.",
                );
                navigate({ to: "/tandem" });
              } catch {
                setClosing(false);
                toast("Le signalement local est conservé, mais la fermeture serveur n’est pas confirmée.");
              }
            }}
          >
            <Flag className="size-3.5" />
            Signaler
          </Button>
          <Button
            variant="outline"
            className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
            onClick={() => void leaveSession()}
          >
            Partir
          </Button>
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface-2/50 p-4 text-left">
      <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-subtle">
        {label}
      </p>
      <p className="mt-2 font-display text-lg">{value}</p>
    </div>
  );
}
