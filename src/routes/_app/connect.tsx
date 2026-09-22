import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { CalendarDays, MapPin, UserRound, Users } from "lucide-react";
import { Eyebrow, Page, Surface } from "@/components/app/primitives";
import { Button } from "@/components/ui/button";
import { EVENTS, planAllows } from "@/lib/blossom/data";
import { getConnectPeersOnServer } from "@/lib/blossom/domain.api";
import { useBlossom } from "@/lib/blossom/store";
import { formatShortDate } from "@/lib/utils";

export const Route = createFileRoute("/_app/connect")({
  component: ConnectPage,
});

type ConnectPeer = Awaited<ReturnType<typeof getConnectPeersOnServer>>[number];

function ConnectPage() {
  const joined = useBlossom((s) => s.joinedEventIds);
  const counts = useBlossom((s) => s.eventRegistrationCounts);
  const plan = useBlossom((s) => s.plan);
  const tandemOpen = planAllows(plan, "tandem");
  const [peers, setPeers] = useState<ConnectPeer[]>([]);
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
                <span className="text-xs text-subtle">
                  {joined.includes(event.id)
                    ? "Vous y serez"
                    : `${registered}/${event.spots} inscrits`}
                </span>
              </li>
            );
          })}
        </ul>
      </section>
    </Page>
  );
}
