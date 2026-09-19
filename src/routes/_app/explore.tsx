import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Eyebrow, Page } from "@/components/app/primitives";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EVENTS, MARKETPLACE, planAllows } from "@/lib/blossom/data";
import { useBlossom } from "@/lib/blossom/store";
import { formatLongDate } from "@/lib/utils";

export const Route = createFileRoute("/_app/explore")({
  component: ExplorePage,
});

function ExplorePage() {
  const joined = useBlossom((s) => s.joinedEventIds);
  const joinEvent = useBlossom((s) => s.joinEvent);
  const leaveEvent = useBlossom((s) => s.leaveEvent);
  const plan = useBlossom((s) => s.plan);
  const waitlist = useBlossom((s) => s.waitlistIds);
  const joinWaitlist = useBlossom((s) => s.joinWaitlist);
  const earlyOk = planAllows(plan, "immersionEarly");

  return (
    <Page>
      <div className="overflow-hidden rounded-2xl">
        <div className="relative aspect-video">
          <img
            src="/images/reunion-coast.jpg"
            alt=""
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-fg/70 to-fg/10" />
          <div className="absolute bottom-0 p-6 text-primary-foreground">
            <Eyebrow className="text-primary-foreground/70">EXPLORE</Eyebrow>
            <h1 className="mt-1 font-display text-4xl tracking-tight">
              Saint-Pierre est vivant
            </h1>
            <p className="mt-2 max-w-md text-sm text-primary-foreground/80">
              Des tables, des marchés, la côte. La langue se pratique dehors.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-5">
        {EVENTS.map((event) => {
          const isIn = joined.includes(event.id);
          const remaining = event.spots - event.taken - (isIn ? 1 : 0);
          return (
            <article
              key={event.id}
              className="overflow-hidden rounded-xl bg-surface shadow-[var(--shadow-border)] sm:grid sm:grid-cols-[minmax(0,0.9fr)_minmax(0,1.2fr)]"
            >
              <div className="aspect-video sm:aspect-auto sm:min-h-44">
                <img
                  src={event.image}
                  alt=""
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="flex flex-col p-5">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="font-display text-2xl">{event.title}</h2>
                  <Badge variant={isIn ? "default" : "outline"}>
                    {isIn ? "Inscrit" : `${Math.max(0, remaining)} places`}
                  </Badge>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {event.blurb}
                </p>
                <p className="mt-3 text-sm">
                  {formatLongDate(event.date)} · {event.time}
                </p>
                <p className="text-xs text-subtle">
                  {event.place} · {event.language} · {event.host}
                </p>
                <div className="mt-4 flex-1" />
                {isIn ? (
                  <Button
                    variant="outline"
                    onClick={() => {
                      leaveEvent(event.id);
                      toast("Inscription annulée.");
                    }}
                  >
                    Se retirer
                  </Button>
                ) : (
                  <Button
                    disabled={remaining <= 0}
                    onClick={() => {
                      joinEvent(event.id);
                      toast("C'est noté dans votre calendrier.");
                    }}
                  >
                    Rejoindre
                  </Button>
                )}
              </div>
            </article>
          );
        })}
      </div>

      <Eyebrow className="mt-12">Immersions</Eyebrow>
      <p className="mt-2 max-w-lg text-sm text-muted">
        Le centre reste le hub. Les weekends partenaires s'ouvrent sans
        diluer Saint-Pierre.
      </p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {MARKETPLACE.map((item) => {
          const full = item.taken >= item.spots;
          const waiting = waitlist.includes(item.id);
          const locked = item.early && !earlyOk;
          return (
            <article
              key={item.id}
              className="overflow-hidden rounded-xl bg-surface shadow-[var(--shadow-border)]"
            >
              <img
                src={item.image}
                alt=""
                className="aspect-video w-full object-cover"
              />
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="font-display text-xl">{item.title}</h2>
                  <Badge variant="outline">
                    {item.taken}/{item.spots}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-subtle">
                  {item.dates} · {item.place}
                </p>
                <p className="mt-2 text-sm text-muted">{item.blurb}</p>
                {item.companion ? (
                  <Button asChild className="mt-4 w-full" size="sm">
                    <Link to="/immersion">Companion</Link>
                  </Button>
                ) : locked ? (
                  <p className="mt-4 text-xs text-subtle">
                    Avant-première Premium ou centre.
                  </p>
                ) : full || waiting ? (
                  <Button
                    className="mt-4 w-full"
                    size="sm"
                    variant="secondary"
                    disabled={waiting}
                    onClick={() => {
                      joinWaitlist(item.id);
                      toast("Liste d'attente. Le centre confirme.");
                    }}
                  >
                    {waiting ? "En liste" : "Liste d'attente"}
                  </Button>
                ) : (
                  <Button
                    className="mt-4 w-full"
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      joinWaitlist(item.id);
                      toast("Demande envoyée. Un conseiller confirme.");
                    }}
                  >
                    Demander une place
                  </Button>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </Page>
  );
}
