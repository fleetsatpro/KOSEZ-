import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { toast } from "sonner";
import { Initials, Eyebrow, Page, Surface } from "@/components/app/primitives";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LEARNER, TANDEM_PARTNERS } from "@/lib/blossom/data";
import { tandemMatchScore } from "@/lib/blossom/engine";
import { useBlossom } from "@/lib/blossom/store";

export const Route = createFileRoute("/_app/tandem")({
  component: TandemPage,
});

function TandemPage() {
  const statusMap = useBlossom((s) => s.tandemStatus);
  const setStatus = useBlossom((s) => s.setTandemStatus);
  const tandemOpen = useBlossom((s) => s.tandemOpen);
  const setTandemOpen = useBlossom((s) => s.setTandemOpen);
  const me = useMemo(
    () => ({
      speaks: LEARNER.nativeLanguage,
      wants: LEARNER.targetLanguage,
      level: LEARNER.level,
      interests: LEARNER.interests,
      window: LEARNER.practiceWindow,
    }),
    [],
  );

  const ranked = useMemo(
    () =>
      TANDEM_PARTNERS.map((p) => ({
        partner: p,
        score: tandemMatchScore(me, p),
        status: statusMap[p.id] ?? "suggested",
      }))
        .filter((row) => row.status !== "blocked")
        .sort((a, b) => b.score - a.score),
    [me, statusMap],
  );

  return (
    <Page>
      <Eyebrow>CONNECT · Tandem</Eyebrow>
      <h1 className="mt-2 font-display text-4xl tracking-tight">
        Trente et trente
      </h1>
      <p className="mt-3 max-w-lg text-sm leading-relaxed text-muted">
        Pas un chat. Un échange cadré : vos langues, un timer, des
        amorces. Les deux côtés acceptent. Léo débriefe chacun à part.
      </p>

      <Surface className="mt-8">
        <Eyebrow>Votre demande</Eyebrow>
        <p className="mt-3 text-sm">
          Je parle {LEARNER.nativeLanguage} · je veux {LEARNER.targetLanguage}{" "}
          {LEARNER.level}
        </p>
        <p className="mt-1 text-sm text-muted">
          {LEARNER.interests.join(" · ")} · {LEARNER.practiceWindow}
        </p>
        <p className="mt-3 text-sm text-muted">{LEARNER.goal}</p>
        <Button
          size="sm"
          variant="secondary"
          className="mt-4"
          onClick={() => {
            setTandemOpen(!tandemOpen);
            toast(
              tandemOpen
                ? "Demande en pause. Personne de nouveau n'est proposé."
                : "Demande rouverte.",
            );
          }}
        >
          {tandemOpen ? "Mettre la demande en pause" : "Rouvrir la demande"}
        </Button>
      </Surface>

      {!tandemOpen ? (
        <Surface className="mt-6">
          <p className="font-display text-xl">En pause</p>
          <p className="mt-2 text-sm text-muted">
            Les sessions déjà acceptées restent. Rien de nouveau n'arrive.
          </p>
        </Surface>
      ) : null}

      <ul className="mt-6 space-y-4">
        {ranked
          .filter((row) => tandemOpen || row.status === "accepted")
          .map(({ partner, score, status }) => (
          <li
            key={partner.id}
            className="rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]"
          >
            <div className="flex items-start gap-3">
              {partner.avatar ? (
                <img
                  src={partner.avatar}
                  alt=""
                  className="size-12 rounded-full object-cover"
                />
              ) : (
                <Initials letters={partner.initials} className="size-12" />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-display text-xl">{partner.name}</p>
                    <p className="text-xs text-subtle">{partner.city}</p>
                  </div>
                  <Badge variant={status === "accepted" ? "default" : "outline"}>
                    {status === "accepted"
                      ? "Accepté"
                      : status === "pending"
                        ? "En attente"
                        : `${score} · affinité`}
                  </Badge>
                </div>
                <p className="mt-2 text-sm text-muted">
                  Parle {partner.speaks} {partner.speaksLevel} · veut{" "}
                  {partner.wants} {partner.wantsLevel}
                </p>
                <p className="mt-1 text-xs text-subtle">
                  {partner.interests.join(" · ")} · {partner.window}
                </p>
                <p className="mt-2 text-sm">{partner.goal}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {status === "suggested" && (
                    <Button
                      size="sm"
                      onClick={() => {
                        setStatus(partner.id, "pending");
                        toast("Demande envoyée. Les deux côtés doivent accepter.");
                        window.setTimeout(() => {
                          setStatus(partner.id, "accepted");
                          toast(`${partner.name.split(" ")[0]} a accepté.`);
                        }, 1200);
                      }}
                    >
                      Proposer
                    </Button>
                  )}
                  {status === "pending" && (
                    <p className="text-sm text-muted">En attente de l'autre côté.</p>
                  )}
                  {status === "accepted" && (
                    <Button size="sm" asChild>
                      <Link to="/tandem/$id" params={{ id: partner.id }}>
                        Ouvrir la session
                      </Link>
                    </Button>
                  )}
                  {status !== "paused" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setStatus(partner.id, "paused");
                        toast("Demande en pause. Rien n'est proposé de ce côté.");
                      }}
                    >
                      Pause
                    </Button>
                  )}
                  {status === "paused" && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setStatus(partner.id, "suggested")}
                    >
                      Reprendre
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setStatus(partner.id, "blocked");
                      toast("Cette personne ne sera plus proposée.");
                    }}
                  >
                    Bloquer
                  </Button>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </Page>
  );
}
