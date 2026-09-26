import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Clock, Heart, MapPin, Pause, RefreshCw, Users, Leaf } from "lucide-react";
import { toast } from "sonner";
import { Eyebrow, Initials, Page, Surface } from "@/components/app/primitives";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  LEARNER_MEMORY,
  PRONLAB_SETS,
  setsForLanguage,
  planAllows,
} from "@/lib/blossom/data";
import { influenceFromState } from "@/lib/blossom/influence";
import { getTandemCandidatesOnServer } from "@/lib/blossom/domain.api";
import { tandemMatchScore } from "@/lib/blossom/engine";
import {
  causalNextGesture,
  computeMinerals,
} from "@/lib/blossom/organism";
import { useBlossom } from "@/lib/blossom/store";
import { cn } from "@/lib/utils";
import { describeLearnLanguage, useUiLocale } from "@/lib/i18n";

export const Route = createFileRoute("/_app/tandem")({
  component: TandemPage,
});

type Candidate = Awaited<ReturnType<typeof getTandemCandidatesOnServer>>[number];

function languageLabel(id: string, uiLocale: string) {
  return describeLearnLanguage(id, uiLocale).label;
}

function TandemPage() {
  const pathname = useRouterState({
    select: (state) => state.location.pathname.replace(/\/+$/, "") || "/",
  });
  return pathname === "/tandem" ? <TandemHub /> : <Outlet />;
}

function TandemHub() {
  const learner = useBlossom((s) => s.learner);
  const uiLocale = useUiLocale();
  const languageId = useBlossom((s) => s.languageId);
  const statusMap = useBlossom((s) => s.tandemStatus);
  const setStatus = useBlossom((s) => s.setTandemStatus);
  const tandemOpen = useBlossom((s) => s.tandemOpen);
  const setTandemOpen = useBlossom((s) => s.setTandemOpen);
  const plan = useBlossom((s) => s.plan);
  const log = useBlossom((s) => s.activityLog);
  const growthEvents = useBlossom((s) => s.growthEvents);
  const attempts = useBlossom((s) => s.pronlabAttempts);
  const phonemeLeaves = useBlossom((s) => s.phonemeLeaves);
  const missionSessions = useBlossom((s) => s.missionSessions);
  const influence = useMemo(
    () =>
      influenceFromState({
        activityLog: log,
        pronlabAttempts: attempts,
        growthEvents,
        phonemeLeaves,
        missionSessions,
        allItems: setsForLanguage(languageId).flatMap((s) => s.items),
        memory: LEARNER_MEMORY,
        memoryOn: planAllows(plan, "memory"),
        languageId,
      }),
    [log, attempts, growthEvents, phonemeLeaves, missionSessions, plan, languageId],
  );
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const minerals = useMemo(() => computeMinerals(log), [log]);
  const nextGesture = causalNextGesture(minerals);
  const socialGrowth = growthEvents
    .filter((g) => g.mineral === "social" || g.kind === "flower")
    .slice(0, 3);

  const me = useMemo(
    () => ({
      speaks: learner.nativeLanguage,
      wants: languageLabel(languageId, uiLocale),
      level: learner.level,
      interests: learner.interests,
      window: learner.practiceWindow,
    }),
    [languageId, learner.interests, learner.level, learner.nativeLanguage, learner.practiceWindow],
  );

  const load = () => {
    setLoading(true);
    setError(null);
    void getTandemCandidatesOnServer()
      .then(setCandidates)
      .catch(() => setError("Impossible de charger les profils compatibles."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const ranked = useMemo(() => {
    const bias = influence.tandem.partnerBias;
    return candidates
      .map((candidate) => {
        let score = tandemMatchScore(me, {
          id: candidate.id,
          name: candidate.name,
          city: candidate.city ?? "La Réunion",
          speaks: candidate.speaks,
          speaksLevel: candidate.speaksLevel,
          wants: languageLabel(candidate.wants),
          wantsLevel: candidate.wantsLevel,
          interests: candidate.interests,
          window: candidate.window,
          goal: candidate.goal,
          initials: candidate.initials,
          avatar: null,
        });
        if (bias === "social-recover") score += 0.04;
        if (bias === "pron-focus" && candidate.goal?.toLowerCase().includes("pron")) score += 0.06;
        return {
          candidate,
          score,
          status: statusMap[candidate.id] ?? candidate.myStatus,
        };
      })
      .filter((row) => row.status !== "blocked")
      .sort((a, b) => b.score - a.score);
  }, [candidates, me, statusMap, influence.tandem.partnerBias]);

  const accepted = ranked.filter((row) => row.status === "accepted");
  const pending = ranked.filter((row) => row.status === "pending");
  const incoming = ranked.filter(
    (row) =>
      row.status !== "accepted" &&
      row.status !== "pending" &&
      row.candidate.incomingStatus === "pending",
  );
  const suggested = ranked.filter(
    (row) => row.status === "suggested" && row.candidate.incomingStatus !== "pending",
  );

  const available = planAllows(plan, "tandem");

  return (
    <Page className="kosez-feature-page max-w-3xl">
      <header className="max-w-2xl">
        <Eyebrow>CONNECT · Tandem</Eyebrow>
        <h1 className="mt-2 font-display text-4xl tracking-tight sm:text-5xl">
          Trente et trente
        </h1>
        <p className="mt-3 text-sm leading-7 text-muted sm:text-base">
          Deux personnes, un cadre clair. Chacun accepte avant l'ouverture
          d'une session. Une session terminée écrit une fleur sur votre BLOSSOM — le minéral social monte.
        </p>
        {socialGrowth.length > 0 ? (
          <ul className="mt-4 flex flex-wrap gap-2" aria-label="Présences récentes">
            {socialGrowth.map((g) => (
              <li
                key={g.id}
                className="rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-[11px] text-primary"
              >
                {g.label}
              </li>
            ))}
          </ul>
        ) : null}
      </header>

      <section
        className="mt-6 rounded-2xl border border-primary/20 bg-primary/5 p-4 magnetic-surface sm:p-5"
        aria-label="Minéral social"
      >
        <div className="flex items-start gap-3">
          <Leaf className="mt-0.5 size-4 shrink-0 text-primary" />
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary/80">
              Minéral social · {minerals.social}/100
            </p>
            <p className="mt-1 text-sm leading-6 text-fg/90">
              {nextGesture.mineral === "social"
                ? nextGesture.line
                : "Une présence partagée (tandem, café, atelier) fait fleurir le sol. Double accord obligatoire."}
            </p>
          </div>
        </div>
      </section>

      {influence.tandem.openPrompt ? (
        <section
          className="mt-4 rounded-2xl border border-primary/25 bg-primary/8 p-4 sm:p-5"
          aria-label="Prompt organismique pour le tandem"
        >
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary/80">
            Ouverture ·{" "}
            {influence.tandem.partnerBias === "pron-focus"
              ? "son qui résiste"
              : influence.tandem.partnerBias === "social-recover"
                ? "minéral social"
                : "libre"}
          </p>
          <p className="mt-2 font-display text-lg leading-snug tracking-tight text-fg sm:text-xl">
            {influence.tandem.openPrompt}
          </p>
          <ul className="mt-3 space-y-1">
            {influence.tandem.reasons
              .filter((r) => r.code !== "balanced")
              .map((r) => (
                <li key={r.code + r.line} className="text-xs leading-5 text-muted">
                  {r.line}
                </li>
              ))}
          </ul>
          <p className="mt-3 text-[11px] text-subtle">
            Proposez cette phrase en ouverture — ce n'est pas un script, c'est un ancrage. Double accord obligatoire.
          </p>
        </section>
      ) : null}

      {!available ? (
        <Surface className="mt-8 magnetic-surface">
          <Eyebrow>Tandem fermé</Eyebrow>
          <h2 className="mt-2 font-display text-2xl">
            Votre formule ne permet pas encore le tandem.
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            Les rencontres et activités de BLOSSOM restent accessibles.
          </p>
          <Button asChild variant="secondary" className="mt-5">
            <Link to="/explore">Voir EXPLORE</Link>
          </Button>
        </Surface>
      ) : (
        <>
          <section className="mt-8 grid gap-3 sm:grid-cols-3">
            {[
              { icon: Clock, title: "30 + 30", body: "Une moitié par langue, avec un timer visible." },
              { icon: Heart, title: "Double accord", body: "Une demande n'ouvre jamais une session seule." },
              { icon: Users, title: "Cadre privé", body: "Pas de fil public. Les débriefs restent personnels." },
            ].map((item) => (
              <Surface key={item.title} className="!p-4 magnetic-surface">
                <item.icon className="size-4 text-primary" strokeWidth={1.7} />
                <p className="mt-3 font-display text-lg">{item.title}</p>
                <p className="mt-1 text-xs leading-5 text-muted">{item.body}</p>
              </Surface>
            ))}
          </section>

          <Surface className="mt-8 !p-5 magnetic-surface sm:!p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <Eyebrow>Votre demande</Eyebrow>
                <p className="mt-3 text-sm leading-6">
                  {learner.nativeLanguage} → {languageLabel(languageId)} · {learner.level}
                </p>
                <p className="mt-1 text-sm text-muted">
                  {learner.interests.length ? learner.interests.join(" · ") : "Centres d'intérêt non renseignés"}
                  {" · "}
                  {learner.practiceWindow || "Créneau non renseigné"}
                </p>
              </div>
              <Button
                size="sm"
                variant={tandemOpen ? "secondary" : "default"}
                onClick={() => {
                  setTandemOpen(!tandemOpen);
                  toast(tandemOpen ? "Votre demande est en pause." : "Votre demande est rouverte.");
                }}
              >
                {tandemOpen ? (
                  <>
                    <Pause className="size-3.5" />
                    Mettre en pause
                  </>
                ) : (
                  "Activer le tandem"
                )}
              </Button>
            </div>
          </Surface>

          {!tandemOpen ? (
            <Surface className="mt-8 text-center !py-12 magnetic-surface">
              <p className="font-display text-xl">Demande en pause.</p>
            </Surface>
          ) : loading ? (
            <Surface className="mt-10">
              <p className="text-sm text-muted">Recherche de profils compatibles…</p>
            </Surface>
          ) : error ? (
            <Surface className="mt-10 magnetic-surface">
              <p className="font-display text-xl">Le réseau n'est pas disponible.</p>
              <p className="mt-2 text-sm text-muted">{error}</p>
              <Button className="mt-5" variant="secondary" onClick={load}>
                <RefreshCw className="size-4" />
                Réessayer
              </Button>
            </Surface>
          ) : candidates.length === 0 ? (
            <Surface className="mt-10 text-center !py-12 magnetic-surface">
              <Users className="mx-auto size-5 text-primary" />
              <p className="mt-4 font-display text-2xl">Pas encore de partenaire disponible.</p>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">
                Le tandem ne fabrique pas de faux profils.
              </p>
              <Button asChild variant="secondary" className="mt-5">
                <Link to="/explore">Voir EXPLORE</Link>
              </Button>
            </Surface>
          ) : (
            <>
              {accepted.length > 0 ? (
                <section className="mt-10">
                  <Eyebrow>Ouvertes</Eyebrow>
                  <h2 className="mt-2 font-display text-2xl tracking-tight">Sessions prêtes</h2>
                  <ul className="mt-4 space-y-4">
                    {accepted.map((row) => (
                      <PartnerCard key={row.candidate.id} row={row} languageLabel={languageLabel} onStatus={setStatus} />
                    ))}
                  </ul>
                </section>
              ) : null}
              {incoming.length > 0 ? (
                <section className="mt-10">
                  <Eyebrow>À vous de répondre</Eyebrow>
                  <h2 className="mt-2 font-display text-2xl tracking-tight">Demandes reçues</h2>
                  <ul className="mt-4 space-y-4">
                    {incoming.map((row) => (
                      <PartnerCard key={row.candidate.id} row={row} incoming languageLabel={languageLabel} onStatus={setStatus} />
                    ))}
                  </ul>
                </section>
              ) : null}
              {pending.length > 0 ? (
                <section className="mt-10">
                  <Eyebrow>En attente</Eyebrow>
                  <h2 className="mt-2 font-display text-2xl tracking-tight">Demandes envoyées</h2>
                  <ul className="mt-4 space-y-4">
                    {pending.map((row) => (
                      <PartnerCard key={row.candidate.id} row={row} languageLabel={languageLabel} onStatus={setStatus} />
                    ))}
                  </ul>
                </section>
              ) : null}
              {suggested.length > 0 ? (
                <section className="mt-10">
                  <Eyebrow>Suggestions</Eyebrow>
                  <h2 className="mt-2 font-display text-2xl tracking-tight">Profils compatibles</h2>
                  <ul className="mt-4 space-y-4">
                    {suggested.map((row) => (
                      <PartnerCard key={row.candidate.id} row={row} languageLabel={languageLabel} onStatus={setStatus} />
                    ))}
                  </ul>
                </section>
              ) : null}
            </>
          )}
        </>
      )}
    </Page>
  );
}

function PartnerCard({
  row,
  incoming = false,
  languageLabel,
  onStatus,
}: {
  row: { candidate: Candidate; score: number; status: string };
  incoming?: boolean;
  languageLabel: (id: string) => string;
  onStatus: (partnerId: string, status: "suggested" | "pending" | "accepted" | "paused" | "blocked") => void;
}) {
  const { candidate, score, status } = row;
  const displayWants = languageLabel(candidate.wants);
  const statusText =
    status === "accepted"
      ? "Accepté"
      : status === "pending"
        ? "En attente"
        : incoming
          ? "Demande reçue"
          : "Proposé";

  return (
    <li className="overflow-hidden rounded-2xl border border-border/60 bg-surface shadow-[var(--shadow-border)] magnetic-surface">
      <div className="flex items-start gap-4 p-5 sm:p-6">
        <Initials letters={candidate.initials} className="size-14 rounded-2xl" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="font-display text-xl tracking-tight">{candidate.name}</p>
              <p className="mt-0.5 flex items-center gap-1 text-xs text-subtle">
                <MapPin className="size-3" />
                {candidate.city ?? "La Réunion"}
              </p>
            </div>
            <Badge
              variant={status === "accepted" ? "default" : "outline"}
              className={cn(status === "accepted" && "bg-primary text-primary-foreground")}
            >
              {statusText}
            </Badge>
          </div>
          <p className="mt-3 text-sm text-muted">
            Parle {candidate.speaks} · veut {displayWants}
          </p>
          <p className="mt-1 text-xs text-subtle">
            {candidate.interests.length ? candidate.interests.join(" · ") : "Centres d'intérêt non renseignés"}
            {" · "}
            {candidate.window}
          </p>
          <p className="mt-3 text-sm leading-6">{candidate.goal}</p>
          {status !== "accepted" && (
            <div className="mt-4">
              <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.14em] text-subtle">
                <span>Compatibilité indicative</span>
                <span className="tabular-nums">{Math.round(score * 100)}</span>
              </div>
              <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-surface-2">
                <div className="h-full rounded-full bg-primary/70" style={{ width: `${Math.min(100, score * 100)}%` }} />
              </div>
            </div>
          )}
          <div className="mt-5 flex flex-wrap gap-2">
            {status === "accepted" ? (
              <Button size="sm" asChild>
                <Link to="/tandem/$id" params={{ id: candidate.id }}>
                  Ouvrir la session
                  <ArrowRight className="size-3.5" />
                </Link>
              </Button>
            ) : incoming && candidate.incomingStatus === "pending" ? (
              <Button
                size="sm"
                onClick={() => {
                  onStatus(candidate.id, "accepted");
                  toast("Connexion acceptée. La session est maintenant réciproque.");
                }}
              >
                Accepter
                <ArrowRight className="size-3.5" />
              </Button>
            ) : status === "pending" ? (
              <Button size="sm" variant="secondary" onClick={() => onStatus(candidate.id, "suggested")}>
                Annuler
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={() => {
                  onStatus(candidate.id, "pending");
                  toast("Demande envoyée. La session s'ouvrira après double accord.");
                }}
              >
                Proposer
                <ArrowRight className="size-3.5" />
              </Button>
            )}
            {status !== "blocked" && status !== "accepted" ? (
              <Button size="sm" variant="ghost" onClick={() => onStatus(candidate.id, "blocked")}>
                Masquer
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </li>
  );
}
