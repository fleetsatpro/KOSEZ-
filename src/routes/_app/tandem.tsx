import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { toast } from "sonner";
import {
  ArrowRight,
  Clock,
  Heart,
  MapPin,
  Pause,
  Users,
} from "lucide-react";
import { Initials, Eyebrow, Page, Surface } from "@/components/app/primitives";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LEARNER, TANDEM_PARTNERS } from "@/lib/blossom/data";
import { tandemMatchScore } from "@/lib/blossom/engine";
import { useBlossom } from "@/lib/blossom/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/tandem")({
  component: TandemPage,
});

/**
 * Tandem is not a chat list.
 * A constellation of presences — affinity scores, timed exchange, private debrief.
 */
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
  const accepted = ranked.filter((r) => r.status === "accepted");
  const pending = ranked.filter((r) => r.status === "pending");
  const suggested = ranked.filter((r) => r.status === "suggested");

  return (
    <Page className="kosez-feature-page max-w-3xl">
      <header className="max-w-2xl">
        <Eyebrow>CONNECT · Tandem</Eyebrow>
        <h1 className="mt-2 font-display text-4xl tracking-tight sm:text-5xl">
          Trente et trente
        </h1>
        <p className="mt-3 text-sm leading-7 text-muted sm:text-base">
          Pas un chat. Un échange cadré : vos langues, un timer, des amorces.
          Les deux côtés acceptent. Léo débriefe chacun à part — rien n'est
          comparé, rien n'est publié.
        </p>
      </header>

      {/* Protocol strip */}
      <section className="mt-8 grid gap-3 sm:grid-cols-3">
        {[
          {
            icon: Clock,
            title: "30 + 30",
            body: "Votre cible, puis la langue de l'autre. Timer visible, pas de score.",
          },
          {
            icon: Heart,
            title: "Affinité",
            body: "Intérêts, créneau, niveaux. Le score n'est pas un classement.",
          },
          {
            icon: Users,
            title: "Débrief privé",
            body: "Léo parle à chacun séparément. Aucune comparaison publique.",
          },
        ].map((item) => (
          <div
            key={item.title}
            className="rounded-2xl border border-border/70 bg-surface/80 p-4"
          >
            <span className="flex size-9 items-center justify-center rounded-lg bg-primary/12 text-primary">
              <item.icon className="size-4" strokeWidth={1.7} />
            </span>
            <p className="mt-3 font-display text-lg">{item.title}</p>
            <p className="mt-1 text-xs leading-5 text-muted">{item.body}</p>
          </div>
        ))}
      </section>

      {/* Your demand */}
      <Surface className="mt-8 !p-5 sm:!p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Eyebrow>Votre demande</Eyebrow>
            <p className="mt-3 text-sm leading-6">
              Je parle {LEARNER.nativeLanguage} · je veux {LEARNER.targetLanguage}{" "}
              {LEARNER.level}
            </p>
            <p className="mt-1 text-sm text-muted">
              {LEARNER.interests.join(" · ")} · {LEARNER.practiceWindow}
            </p>
            <p className="mt-3 text-sm leading-6 text-muted">{LEARNER.goal}</p>
          </div>
          <Button
            size="sm"
            variant={tandemOpen ? "secondary" : "default"}
            onClick={() => {
              setTandemOpen(!tandemOpen);
              toast(
                tandemOpen
                  ? "Demande en pause. Personne de nouveau n'est proposé."
                  : "Demande rouverte.",
              );
            }}
          >
            {tandemOpen ? (
              <>
                <Pause className="size-3.5" />
                Pause
              </>
            ) : (
              "Rouvrir"
            )}
          </Button>
        </div>
        {!tandemOpen && (
          <p className="mt-4 rounded-lg bg-surface-2 px-3 py-2.5 text-sm text-muted">
            En pause — les sessions déjà acceptées restent. Rien de nouveau
            n'arrive.
          </p>
        )}
      </Surface>

      {/* Accepted first */}
      {accepted.length > 0 && (
        <section className="mt-10">
          <div className="flex items-end justify-between gap-3">
            <h2 className="font-display text-2xl tracking-tight">Sessions</h2>
            <p className="text-xs tabular-nums text-subtle">
              {accepted.length} ouverte{accepted.length > 1 ? "s" : ""}
            </p>
          </div>
          <ul className="mt-4 space-y-4">
            {accepted.map(({ partner, score }) => (
              <PartnerCard
                key={partner.id}
                partner={partner}
                score={score}
                status="accepted"
                onStatus={setStatus}
              />
            ))}
          </ul>
        </section>
      )}

      {/* Pending */}
      {pending.length > 0 && tandemOpen && (
        <section className="mt-10">
          <h2 className="font-display text-2xl tracking-tight">En attente</h2>
          <ul className="mt-4 space-y-4">
            {pending.map(({ partner, score }) => (
              <PartnerCard
                key={partner.id}
                partner={partner}
                score={score}
                status="pending"
                onStatus={setStatus}
              />
            ))}
          </ul>
        </section>
      )}

      {/* Suggested constellation */}
      {tandemOpen && suggested.length > 0 && (
        <section className="mt-10">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h2 className="font-display text-2xl tracking-tight">
                Constellation
              </h2>
              <p className="mt-1 text-sm text-muted">
                Proposés selon affinité — pas un feed.
              </p>
            </div>
            <p className="text-xs tabular-nums text-subtle">
              {suggested.length}
            </p>
          </div>
          <ul className="mt-4 space-y-4">
            {suggested.map(({ partner, score }) => (
              <PartnerCard
                key={partner.id}
                partner={partner}
                score={score}
                status="suggested"
                onStatus={setStatus}
              />
            ))}
          </ul>
        </section>
      )}

      {!tandemOpen && accepted.length === 0 && (
        <Surface className="mt-10 text-center !py-12">
          <p className="font-display text-xl">Demande en pause</p>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted">
            Rouvrez pour recevoir de nouvelles propositions. Les sessions déjà
            acceptées restent accessibles.
          </p>
        </Surface>
      )}
    </Page>
  );
}

function PartnerCard({
  partner,
  score,
  status,
  onStatus,
}: {
  partner: (typeof TANDEM_PARTNERS)[number];
  score: number;
  status: string;
  onStatus: (id: string, status: "suggested" | "pending" | "accepted" | "paused" | "blocked") => void;
}) {
  return (
    <li className="overflow-hidden rounded-2xl border border-border/60 bg-surface shadow-[var(--shadow-border)]">
      <div className="flex items-start gap-4 p-5 sm:p-6">
        {partner.avatar ? (
          <img
            src={partner.avatar}
            alt=""
            className="size-14 shrink-0 rounded-2xl object-cover ring-1 ring-border/50"
          />
        ) : (
          <Initials letters={partner.initials} className="size-14 rounded-2xl" />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="font-display text-xl tracking-tight">{partner.name}</p>
              <p className="mt-0.5 flex items-center gap-1 text-xs text-subtle">
                <MapPin className="size-3" />
                {partner.city}
              </p>
            </div>
            <Badge
              variant={status === "accepted" ? "default" : "outline"}
              className={cn(
                status === "accepted" && "bg-primary text-primary-foreground",
              )}
            >
              {status === "accepted"
                ? "Accepté"
                : status === "pending"
                  ? "En attente"
                  : status === "paused"
                    ? "Pause"
                    : `${score} · affinité`}
            </Badge>
          </div>

          <p className="mt-3 text-sm text-muted">
            Parle {partner.speaks} {partner.speaksLevel} · veut {partner.wants}{" "}
            {partner.wantsLevel}
          </p>
          <p className="mt-1 text-xs text-subtle">
            {partner.interests.join(" · ")} · {partner.window}
          </p>
          <p className="mt-3 text-sm leading-6">{partner.goal}</p>

          {/* Affinity bar */}
          {status === "suggested" && (
            <div className="mt-4">
              <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.14em] text-subtle">
                <span>Affinité</span>
                <span className="tabular-nums">{score}</span>
              </div>
              <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-surface-2">
                <div
                  className="h-full rounded-full bg-primary/80"
                  style={{ width: `${Math.min(100, score)}%` }}
                />
              </div>
            </div>
          )}

          <div className="mt-5 flex flex-wrap gap-2">
            {status === "suggested" && (
              <Button
                size="sm"
                onClick={() => {
                  onStatus(partner.id, "pending");
                  toast("Demande envoyée. Les deux côtés doivent accepter.");
                  window.setTimeout(() => {
                    onStatus(partner.id, "accepted");
                    toast(`${partner.name.split(" ")[0]} a accepté.`);
                  }, 1200);
                }}
              >
                Proposer
                <ArrowRight className="size-3.5" />
              </Button>
            )}
            {status === "pending" && (
              <p className="self-center text-sm text-muted">
                En attente de l'autre côté…
              </p>
            )}
            {status === "accepted" && (
              <Button size="sm" asChild>
                <Link to="/tandem/$id" params={{ id: partner.id }}>
                  Ouvrir la session
                  <ArrowRight className="size-3.5" />
                </Link>
              </Button>
            )}
            {status !== "paused" && status !== "accepted" && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  onStatus(partner.id, "paused");
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
                onClick={() => onStatus(partner.id, "suggested")}
              >
                Reprendre
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              className="text-muted"
              onClick={() => {
                onStatus(partner.id, "blocked");
                toast("Cette personne ne sera plus proposée.");
              }}
            >
              Bloquer
            </Button>
          </div>
        </div>
      </div>
    </li>
  );
}
