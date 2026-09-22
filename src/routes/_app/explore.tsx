import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarDays, Check, Clock3, Download, MapPin, Users } from "lucide-react";
import { toast } from "sonner";
import { Eyebrow, Page, Surface } from "@/components/app/primitives";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CATALOGUE,
  EVENTS,
  MARKETPLACE,
  planAllows,
  type EventItem,
} from "@/lib/blossom/data";
import { useBlossom } from "@/lib/blossom/store";
import { formatLongDate } from "@/lib/utils";

export const Route = createFileRoute("/_app/explore")({
  component: ExplorePage,
});

function eventDate(event: EventItem): Date {
  return new Date(`${event.date}T${event.time}:00+04:00`);
}

function escapeIcs(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

function timeStamp(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return [
    date.getUTCFullYear(),
    pad(date.getUTCMonth() + 1),
    pad(date.getUTCDate()),
    "T",
    pad(date.getUTCHours()),
    pad(date.getUTCMinutes()),
    "00",
  ].join("");
}

function addMinutes(date: Date, minutes: number): Date {
  const next = new Date(date);
  next.setUTCMinutes(next.getUTCMinutes() + minutes);
  return next;
}

function downloadCalendar(event: EventItem) {
  const start = eventDate(event);
  const end = addMinutes(start, 60);
  const stamp = new Date().toISOString().replace(/[-:.]/g, "").replace("Z", "");
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//K'Osez//BLOSSOM//FR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${event.id}@kosez-blossom`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${timeStamp(start)}Z`,
    `DTEND:${timeStamp(end)}Z`,
    `SUMMARY:${escapeIcs(event.title)}`,
    `LOCATION:${escapeIcs(event.place)}`,
    `DESCRIPTION:${escapeIcs(event.blurb)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `kosez-${event.id}.ics`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
  toast("Fichier calendrier prêt.");
}

function ExplorePage() {
  const joined = useBlossom((s) => s.joinedEventIds);
  const eventRegistrationCounts = useBlossom((s) => s.eventRegistrationCounts);
  const joinEvent = useBlossom((s) => s.joinEvent);
  const leaveEvent = useBlossom((s) => s.leaveEvent);
  const enrolled = useBlossom((s) => s.enrolledIds);
  const bookingStatuses = useBlossom((s) => s.bookingStatuses);
  const enroll = useBlossom((s) => s.enroll);
  const plan = useBlossom((s) => s.plan);
  const waitlist = useBlossom((s) => s.waitlistIds);
  const joinWaitlist = useBlossom((s) => s.joinWaitlist);
  const earlyOk = planAllows(plan, "immersionEarly");

  const now = Date.now();
  const upcomingEvents = EVENTS
    .filter((event) => eventDate(event).getTime() > now)
    .sort((a, b) => eventDate(a).getTime() - eventDate(b).getTime());
  const joinedUpcoming = upcomingEvents.filter((event) => joined.includes(event.id));

  return (
    <Page className="kosez-feature-page">
      <div className="overflow-hidden rounded-2xl">
        <div className="relative aspect-[16/9]">
          <img
            src="/images/reunion-coast.jpg"
            alt=""
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-fg/75 to-fg/10" />
          <div className="absolute inset-x-0 bottom-0 p-5 text-primary-foreground sm:p-7">
            <Eyebrow className="text-primary-foreground/70">EXPLORE</Eyebrow>
            <h1 className="mt-1 max-w-2xl font-display text-4xl tracking-tight sm:text-5xl">
              Saint-Pierre est vivant
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-primary-foreground/75 sm:text-base">
              Des tables, des marchés, la côte. La langue se pratique dehors,
              puis revient avec vous dans l’Atelier.
            </p>
          </div>
        </div>
      </div>

      <section className="mt-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <Eyebrow>Votre agenda</Eyebrow>
            <h2 className="mt-2 font-display text-3xl tracking-tight">
              Ce qui vous attend.
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-muted">
              Une inscription reste visible ici. Le fichier .ics permet de
              l’ajouter à votre calendrier personnel sans prétendre modifier
              un agenda externe à votre place.
            </p>
          </div>
          <Badge variant="outline">
            {joinedUpcoming.length} rendez-vous à venir
          </Badge>
        </div>

        <Surface className="mt-5 overflow-hidden p-0">
          {joinedUpcoming.length ? (
            <div className="divide-y divide-border">
              {joinedUpcoming.map((event) => (
                <div
                  key={event.id}
                  className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-start gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <CalendarDays className="size-4" strokeWidth={1.7} />
                    </span>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium">{event.title}</p>
                        <Badge className="border-primary/20 bg-primary/10 text-primary">
                          Inscrit
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm text-muted">
                        {formatLongDate(event.date)} · {event.time}
                      </p>
                      <p className="mt-1 text-xs text-subtle">
                        {event.place} · {event.language}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="secondary"
                    className="min-h-11 shrink-0"
                    onClick={() => downloadCalendar(event)}
                  >
                    <Download className="size-4" />
                    Ajouter au calendrier
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 sm:p-7">
              <p className="font-display text-2xl tracking-tight">
                Votre agenda est encore ouvert.
              </p>
              <p className="mt-2 max-w-xl text-sm leading-6 text-muted">
                Rejoignez une rencontre ci-dessous : elle apparaîtra ici,
                avec un export calendrier à utiliser où vous le souhaitez.
              </p>
            </div>
          )}
        </Surface>
      </section>

      <section className="mt-10">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <Eyebrow>Rencontres</Eyebrow>
            <h2 className="mt-2 font-display text-3xl tracking-tight">
              Le prochain moment réel.
            </h2>
          </div>
          <p className="text-xs text-subtle">
            {upcomingEvents.length} rencontres actuellement programmées
          </p>
        </div>

        <div className="mt-5 grid gap-5">
          {upcomingEvents.map((event) => {
            const isIn = joined.includes(event.id);
            const registered = eventRegistrationCounts[event.id] ?? 0;
            const remaining = Math.max(
              0,
              event.spots - registered,
            );

            return (
              <article
                key={event.id}
                className="overflow-hidden rounded-2xl bg-surface shadow-[var(--shadow-border)] sm:grid sm:grid-cols-[minmax(0,0.9fr)_minmax(0,1.25fr)]"
              >
                <div className="aspect-video sm:aspect-auto sm:min-h-52">
                  <img
                    src={event.image}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="flex flex-col p-5 sm:p-6">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-subtle">
                        {event.host}
                      </p>
                      <h3 className="mt-1 font-display text-2xl sm:text-3xl">
                        {event.title}
                      </h3>
                    </div>
                    <Badge variant={isIn ? "default" : "outline"}>
                      {isIn ? "Inscrit" : `${remaining} places`}
                    </Badge>
                  </div>

                  <p className="mt-3 text-sm leading-6 text-muted">
                    {event.blurb}
                  </p>

                  <div className="mt-5 grid gap-2 text-xs text-muted sm:grid-cols-2">
                    <span className="flex items-center gap-2">
                      <CalendarDays className="size-3.5 text-primary" />
                      {formatLongDate(event.date)}
                    </span>
                    <span className="flex items-center gap-2">
                      <Clock3 className="size-3.5 text-primary" />
                      {event.time} · 1 h
                    </span>
                    <span className="flex items-center gap-2">
                      <MapPin className="size-3.5 text-primary" />
                      {event.place}
                    </span>
                    <span className="flex items-center gap-2">
                      <Users className="size-3.5 text-primary" />
                      {registered}/{event.spots} inscrits
                    </span>
                  </div>

                  <div className="mt-6 flex flex-col gap-2 sm:flex-row">
                    {isIn ? (
                      <>
                        <Button
                          variant="secondary"
                          className="min-h-11 flex-1"
                          onClick={() => downloadCalendar(event)}
                        >
                          <Download className="size-4" />
                          Ajouter au calendrier
                        </Button>
                        <Button
                          variant="outline"
                          className="min-h-11"
                          onClick={() => {
                            leaveEvent(event.id);
                            toast("Inscription annulée.");
                          }}
                        >
                          Se retirer
                        </Button>
                      </>
                    ) : (
                      <Button
                        className="min-h-11 flex-1"
                        disabled={remaining <= 0}
                        onClick={() => {
                          joinEvent(event.id);
                          toast("Inscription enregistrée dans votre espace.");
                        }}
                      >
                        Rejoindre
                      </Button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="mt-12">
        <div className="max-w-2xl">
          <Eyebrow>Programmes du centre</Eyebrow>
          <h2 className="mt-2 font-display text-3xl tracking-tight">
            Un cadre plus long, quand vous en avez besoin.
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            Explore donne accès aux programmes disponibles. Ajouter un programme
            le rend visible dans LEARN ; aucune promesse de paiement ou de place
            confirmée n’est faite ici.
          </p>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {CATALOGUE.map((item) => {
            const active = enrolled.includes(item.id);
            const bookingStatus = bookingStatuses[item.id];
            return (
              <article
                key={item.id}
                className="overflow-hidden rounded-2xl bg-surface shadow-[var(--shadow-border)]"
              >
                <div className="grid sm:grid-cols-[9rem_1fr]">
                  <img
                    src={item.image}
                    alt=""
                    className="aspect-[4/3] h-full w-full object-cover sm:aspect-auto"
                  />
                  <div className="flex min-w-0 flex-col p-5">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">{item.level}</Badge>
                      <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-subtle">
                        {item.format}
                      </span>
                    </div>
                    <h3 className="mt-3 font-display text-xl">{item.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-muted">
                      {item.description}
                    </p>
                    <div className="mt-4 grid gap-1 text-xs text-subtle">
                      <span>{item.instructor}</span>
                      <span>{item.location}</span>
                      <span>{item.schedule} · {item.price}</span>
                    </div>

                    <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                      <Button
                        className="min-h-11 flex-1"
                        variant={active ? "secondary" : "default"}
                        disabled={active}
                        onClick={() => {
                          enroll(item.id);
                          toast("Demande d’inscription enregistrée.");
                        }}
                      >
                        {active ? (
                          <>
                            <Check className="size-4" />
                            {bookingStatus === "confirmed"
                              ? "Inscription confirmée"
                              : "Demande envoyée"}
                          </>
                        ) : (
                          "Demander l’inscription"
                        )}
                      </Button>
                      <Button asChild variant="ghost" className="min-h-11">
                        <Link to="/learn">
                          Ouvrir LEARN
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="mt-12">
        <div className="flex items-end justify-between gap-3">
          <div>
            <Eyebrow>Immersions</Eyebrow>
            <p className="mt-2 max-w-lg text-sm text-muted">
              Le centre reste le hub. Les expériences partenaires prolongent
              le voyage sans transformer K’Osez en marketplace générique.
            </p>
          </div>
          <Link
            to="/immersion"
            className="hidden text-xs font-semibold uppercase tracking-[0.14em] text-primary sm:inline-flex"
          >
            Ouvrir le companion
          </Link>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {MARKETPLACE.map((item) => {
            const full = item.taken >= item.spots;
            const waiting = waitlist.includes(item.id);
            const locked = item.early && !earlyOk;

            return (
              <article
                key={item.id}
                className="overflow-hidden rounded-2xl bg-surface shadow-[var(--shadow-border)]"
              >
                <img
                  src={item.image}
                  alt=""
                  className="aspect-video w-full object-cover"
                />
                <div className="p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-subtle">
                        Expérience
                      </p>
                      <h3 className="mt-1 font-display text-2xl">
                        {item.title}
                      </h3>
                    </div>
                    <Badge variant="outline">
                      {item.taken}/{item.spots}
                    </Badge>
                  </div>

                  <p className="mt-2 text-sm leading-6 text-muted">
                    {item.blurb}
                  </p>
                  <p className="mt-3 text-xs text-subtle">
                    {item.dates} · {item.place}
                  </p>

                  {item.companion ? (
                    <Button asChild className="mt-5 min-h-11 w-full">
                      <Link to="/immersion">Ouvrir Companion</Link>
                    </Button>
                  ) : locked ? (
                    <div className="mt-5 rounded-xl border border-border bg-surface-2/40 p-3 text-xs leading-5 text-subtle">
                      Accès anticipé réservé au Centre ou à Premium.
                    </div>
                  ) : full || waiting ? (
                    <Button
                      className="mt-5 min-h-11 w-full"
                      variant="secondary"
                      disabled={waiting}
                      onClick={() => {
                        joinWaitlist(item.id);
                        toast(
                          waiting
                            ? "Vous êtes déjà sur la liste."
                            : "Demande ajoutée à la liste d’attente.",
                        );
                      }}
                    >
                      {waiting ? "Sur la liste d'attente" : "Rejoindre la liste d'attente"}
                    </Button>
                  ) : (
                    <Button
                      className="mt-5 min-h-11 w-full"
                      variant="secondary"
                      onClick={() => {
                        joinWaitlist(item.id);
                        toast("Demande ajoutée. Le centre confirme ensuite.");
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
      </section>
    </Page>
  );
}
