import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, CalendarDays, MapPin, UserRound, Users } from "lucide-react";
import { Eyebrow, Page, Surface } from "@/components/app/primitives";
import { Button } from "@/components/ui/button";
import { EVENTS, planAllows } from "@/lib/blossom/data";
import { getConnectPeersOnServer } from "@/lib/blossom/domain.api";
import { useBlossom } from "@/lib/blossom/store";
import { formatShortDate } from "@/lib/utils";
import { causalNextGesture } from "@/lib/blossom/organism";
import { ConversationPanel } from "@/components/app/conversation-panel";

export const Route = createFileRoute("/_app/connect")({
  component: ConnectPage,
});

type ConnectPeer = Awaited<ReturnType<typeof getConnectPeersOnServer>>[number];

function ConnectPage() {
  const joined = useBlossom((s) => s.joinedEventIds);
  const counts = useBlossom((s) => s.eventRegistrationCounts);
  const plan = useBlossom((s) => s.plan);
  const minerals = useBlossom((s) => s.mineralSnapshot);
  const growthEvents = useBlossom((s) => s.growthEvents);
  const tandemOpen = planAllows(plan, "tandem");
  const socialNext = causalNextGesture(minerals);
  const navigate = useNavigate();
  const [peers, setPeers] = useState<ConnectPeer[]>([]);
  const [conversationPeerId, setConversationPeerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let disposed = false;
    setLoading(true);
    void getConnectPeersOnServer()
      .then((rows) => {
        if (!disposed) setPeers(rows);
      })
      .catch(() => {
        if (!disposed) setPeers([]);
      })
      .finally(() => {
        if (!disposed) setLoading(false);
      });
    return () => {
      disposed = true;
    };
  }, [joined.join(",")]);

  const upcoming = useMemo(
    () =>
      EVENTS.filter(
        (event) =>
          new Date(`${event.date}T${event.time}:00Z`).getTime() > Date.now(),
      ).slice(0, 4),
    [],
  );

  const sharedEncounterCount = peers.reduce((total, peer) => total + peer.sharedEvents, 0);
  const nextEvent = upcoming.find((event) => joined.includes(event.id)) ?? upcoming[0] ?? null;

  function prepareFor(eventTitle: string) {
    try {
      sessionStorage.setItem("kosez-speak-topic", `Rencontre · ${eventTitle}`.slice(0, 120));
    } catch {
      /* session storage can be unavailable in privacy modes */
    }
    navigate({ to: "/osez/$id", params: { id: "topic" } });
  }

  return (
    <Page className="kosez-feature-page max-w-4xl">
      <header className="max-w-2xl">
        <Eyebrow>CONNECT</Eyebrow>
        <h1 className="mt-2 font-display text-4xl tracking-tight sm:text-5xl">
          Des personnes réelles. Des moments réels.
        </h1>
        <p className="mt-3 text-sm leading-7 text-muted sm:text-base">
          Les rencontres commencent dans EXPLORE. Ici, vous retrouvez les personnes
          qui partagent réellement un de vos rendez-vous — puis, lorsque le cadre
          est disponible, le tandem peut prendre le relais.
        </p>
      </header>

      <Surface className="mt-6 overflow-hidden !p-0" aria-label="Trace sociale de l'organisme">
        <div className="flex flex-col gap-5 p-5 sm:p-6 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <Eyebrow>Trace sociale · organisme</Eyebrow>
            <h2 className="mt-2 font-display text-2xl tracking-tight">Le tandem ne disparaît pas après la rencontre.</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
              Chaque tandem réellement clôturé nourrit le minéral social et laisse une fleur dans votre histoire.
              Aucune conversation fictive n'est transformée en preuve.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 text-[11px] text-primary">
                Minéral social · {minerals.social}/100
              </span>
              {growthEvents
                .filter((event) => event.mineral === "social")
                .slice(0, 2)
                .map((event) => (
                  <span key={event.id} className="rounded-full border border-border bg-surface-2 px-3 py-1.5 text-[11px] text-muted">
                    {event.label}
                  </span>
                ))}
            </div>
          </div>
          <div className="shrink-0 rounded-2xl border border-border bg-surface-2/45 p-4 md:max-w-xs">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-subtle">Pourquoi cette porte</p>
            <p className="mt-2 text-sm leading-6 text-fg">{socialNext.mineral === "social" ? socialNext.line : "Le prochain geste suit actuellement un autre besoin de votre organisme."}</p>
            <Link
              to="/tandem"
              className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-primary"
            >
              Ouvrir le tandem <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>
      </Surface>

      <section className="mt-8 grid gap-3 sm:grid-cols-3" aria-label="Résumé de connexion">
        <Surface className="!p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-subtle">Présences</p>
          <p className="mt-2 font-display text-2xl tabular-nums">{peers.length}</p>
          <p className="mt-1 text-xs leading-5 text-muted">personne{peers.length === 1 ? "" : "s"} réellement reliée{peers.length === 1 ? "" : "s"} à vos rendez-vous</p>
        </Surface>
        <Surface className="!p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-subtle">Rencontres partagées</p>
          <p className="mt-2 font-display text-2xl tabular-nums">{sharedEncounterCount}</p>
          <p className="mt-1 text-xs leading-5 text-muted">points de contact observés dans le cercle</p>
        </Surface>
        <Surface className="!p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-subtle">Prochain mouvement</p>
          <p className="mt-2 font-display text-lg leading-tight">{nextEvent?.title ?? "Aucun rendez-vous"}</p>
          <p className="mt-1 text-xs leading-5 text-muted">{nextEvent ? "Préparez une phrase avant de partir." : "Explorez les rencontres pour créer le prochain point de contact."}</p>
        </Surface>
      </section>

      <Surface className="mt-4 !p-5 sm:!p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <Eyebrow>Avant le réel</Eyebrow>
            <p className="mt-2 font-display text-2xl tracking-tight">Une rencontre commence avant le premier mot.</p>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">Choisissez une situation de votre agenda, préparez une intention simple dans OSEZ, puis laissez la rencontre produire sa propre trace. K’Osez ne fabrique pas de présence : ce cercle vient de rendez-vous effectivement partagés.</p>
          </div>
          {nextEvent ? (
            <Button variant="secondary" className="shrink-0" onClick={() => prepareFor(nextEvent.title)}>
              Préparer « {nextEvent.title} » <ArrowRight className="size-4" />
            </Button>
          ) : (
            <Button asChild variant="secondary" className="shrink-0">
              <Link to="/explore">Trouver une rencontre <ArrowRight className="size-4" /></Link>
            </Button>
          )}
        </div>
      </Surface>

      {conversationPeerId ? (
        <ConversationPanel
          kind="tandem"
          partnerUserId={conversationPeerId}
          partnerName={peers.find((peer) => peer.id === conversationPeerId)?.name}
          title={
            "Avec " +
            (peers.find((peer) => peer.id === conversationPeerId)?.name ?? "votre tandem")
          }
        />
      ) : null}

      {tandemOpen ? (
        <Link
          to="/tandem"
          className="mt-8 block overflow-hidden rounded-2xl bg-surface shadow-[var(--shadow-border)] transition-transform duration-200 hover:-translate-y-0.5"
        >
          <img
            src="/images/cafe.jpg"
            alt=""
            className="aspect-[21/9] w-full object-cover"
          />
          <div className="grid gap-5 p-5 sm:grid-cols-[1fr_auto] sm:items-end sm:p-6">
            <div>
              <Eyebrow>Tandem</Eyebrow>
              <p className="mt-2 font-display text-2xl sm:text-3xl">
                Trente et trente
              </p>
              <p className="mt-2 max-w-xl text-sm leading-6 text-muted">
                Matching à double accord, échange structuré, aucun chat ouvert.
              </p>
            </div>
            <Button variant="secondary">Ouvrir le tandem</Button>
          </div>
        </Link>
      ) : (
        <Surface className="mt-8">
          <Eyebrow>Tandem</Eyebrow>
          <p className="mt-2 font-display text-2xl">Le tandem n’est pas activé pour votre formule.</p>
          <p className="mt-2 text-sm leading-6 text-muted">
            Les rencontres et présences restent accessibles. Le tandem s’ouvre
            avec les formules prévues par K’Osez.
          </p>
        </Surface>
      )}

      <section className="mt-10">
        <div className="flex items-end justify-between gap-3">
          <div>
            <Eyebrow>Présences</Eyebrow>
            <h2 className="mt-2 font-display text-3xl tracking-tight">
              Votre cercle actuel
            </h2>
          </div>
          <Users className="size-5 text-primary" strokeWidth={1.7} />
        </div>

        {loading ? (
          <Surface className="mt-5">
            <p className="text-sm text-muted">Recherche des présences partagées…</p>
          </Surface>
        ) : peers.length === 0 ? (
          <Surface className="mt-5">
            <UserRound className="size-5 text-primary" strokeWidth={1.7} />
            <h3 className="mt-4 font-display text-2xl">Votre cercle va se créer dans le réel.</h3>
            <p className="mt-2 max-w-xl text-sm leading-6 text-muted">
              Rejoignez une rencontre dans EXPLORE. Les participants associés à
              un même rendez-vous apparaîtront ici automatiquement. Aucun profil
              fictif n’est affiché.
            </p>
            <Button asChild variant="secondary" className="mt-5">
              <Link to="/explore">Voir les rencontres</Link>
            </Button>
          </Surface>
        ) : (
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {peers.map((peer) => (
              <Surface key={peer.id} className="!p-5">
                <div className="flex items-start gap-3">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 font-display text-lg text-primary">
                    {peer.name.slice(0, 1).toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <p className="font-display text-xl tracking-tight">{peer.name}</p>
                    <p className="mt-1 text-xs text-subtle">
                      {peer.level ?? "Niveau non renseigné"}
                      {peer.city ? ` · ${peer.city}` : ""}
                    </p>
                  </div>
                </div>
                {peer.tandemAccepted ? (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="mt-4"
                    onClick={() => setConversationPeerId(peer.id)}
                  >
                    Parler avec {peer.name}
                  </Button>
                ) : null}

                <div className="mt-4 flex flex-wrap gap-2 text-[11px] text-muted">
                  <span className="rounded-full border border-border px-3 py-1.5">
                    {peer.sharedEvents} rencontre{peer.sharedEvents > 1 ? "s" : ""} partagée{peer.sharedEvents > 1 ? "s" : ""}
                  </span>
                  {peer.interests.slice(0, 3).map((interest) => (
                    <span key={interest} className="rounded-full bg-surface-2 px-3 py-1.5">
                      {interest}
                    </span>
                  ))}
                </div>
              </Surface>
            ))}
          </div>
        )}
      </section>

      <section className="mt-10">
        <div className="flex items-end justify-between gap-3">
          <div>
            <Eyebrow>Vos rendez-vous</Eyebrow>
            <h2 className="mt-2 font-display text-3xl tracking-tight">
              Là où les échanges commencent.
            </h2>
          </div>
          <Link
            to="/explore"
            className="text-xs font-semibold uppercase tracking-[0.14em] text-primary"
          >
            Explorer
          </Link>
        </div>

        <ul className="mt-5 space-y-3">
          {upcoming.map((event) => {
            const registered = counts[event.id] ?? 0;
            return (
              <li
                key={event.id}
                className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-border)] sm:flex-row sm:items-center"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-surface-2 text-primary">
                  <CalendarDays className="size-4" strokeWidth={1.7} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{event.title}</p>
                  <p className="mt-1 text-xs text-muted">
                    {formatShortDate(event.date)} · {event.time}
                  </p>
                  <p className="mt-1 flex items-center gap-1 text-xs text-subtle">
                    <MapPin className="size-3" />
                    {event.place}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="text-xs text-subtle">
                    {joined.includes(event.id)
                      ? "Vous y serez"
                      : `${registered}/${event.spots} inscrits`}
                  </span>
                  <Button type="button" size="sm" variant="ghost" onClick={() => prepareFor(event.title)}>
                    Préparer
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </Page>
  );
}
