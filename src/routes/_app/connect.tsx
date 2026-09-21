import { createFileRoute, Link } from "@tanstack/react-router";
import { Eyebrow, Page, Surface } from "@/components/app/primitives";
import { Button } from "@/components/ui/button";
import { CONNECT_PEOPLE, EVENTS, planAllows } from "@/lib/blossom/data";
import { useBlossom } from "@/lib/blossom/store";
import { formatShortDate } from "@/lib/utils";

export const Route = createFileRoute("/_app/connect")({
  component: ConnectPage,
});

function ConnectPage() {
  const joined = useBlossom((s) => s.joinedEventIds);
  const plan = useBlossom((s) => s.plan);
  const tandemOk = planAllows(plan, "tandem");

  return (
    <Page className="kosez-feature-page">
      <Eyebrow>CONNECT</Eyebrow>
      <h1 className="mt-2 font-display text-4xl tracking-tight">
        La maison, et le tandem
      </h1>
      <p className="mt-3 max-w-lg text-sm leading-relaxed text-muted">
        Se croiser d'abord. Puis, si les deux côtés acceptent, trente
        minutes dans chaque langue — cadré, pas un chat.
      </p>

      {tandemOk ? (
      <Link
        to="/tandem"
        className="mt-8 block overflow-hidden rounded-xl bg-surface shadow-[var(--shadow-border)]"
      >
        <img
          src="/images/cafe.jpg"
          alt=""
          className="aspect-video w-full object-cover sm:aspect-[21/9]"
        />
        <div className="p-5">
          <Eyebrow>Tandem</Eyebrow>
          <p className="mt-2 font-display text-2xl">Trente et trente</p>
          <p className="mt-1 text-sm text-muted">
            Matching, session structurée, débrief privé. Signaler ou partir
            à tout moment.
          </p>
        </div>
      </Link>
      ) : (
      <Surface className="mt-8">
        <Eyebrow>Tandem</Eyebrow>
        <p className="mt-3 font-display text-2xl">Trente et trente</p>
        <p className="mt-2 text-sm text-muted">
          Le tandem s'ouvre avec Premium ou le centre. Digital reste
          Missions, Speak, Pron'Lab.
        </p>
      </Surface>
      )}

      <Surface className="mt-8">
        <Eyebrow>Présences</Eyebrow>
        <ul className="mt-5 space-y-4">
          {CONNECT_PEOPLE.map((person) => (
            <li key={person.name} className="flex items-center gap-3">
              {person.avatar ? (
                <img
                  src={person.avatar}
                  alt=""
                  className="size-11 rounded-full object-cover"
                />
              ) : (
                <div className="flex size-11 items-center justify-center rounded-full bg-surface-2 font-display text-lg text-primary">
                  {person.initials}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="font-medium">{person.name}</p>
                <p className="text-xs text-subtle">{person.role}</p>
              </div>
              <p className="text-xs text-muted">{person.status}</p>
            </li>
          ))}
        </ul>
      </Surface>

      <section className="mt-8">
        <Eyebrow>Où se retrouver</Eyebrow>
        <ul className="mt-4 space-y-3">
          {EVENTS.map((event) => (
            <li
              key={event.id}
              className="flex items-center justify-between gap-3 rounded-lg bg-surface px-4 py-3 shadow-[var(--shadow-border)]"
            >
              <div>
                <p className="font-medium">{event.title}</p>
                <p className="text-xs text-muted">
                  {formatShortDate(event.date)} · {event.time}
                </p>
              </div>
              <p className="text-xs text-subtle">
                {joined.includes(event.id)
                  ? "Vous y serez"
                  : `${event.taken} inscrits`}
              </p>
            </li>
          ))}
        </ul>
        <Button asChild variant="secondary" className="mt-5 w-full">
          <Link to="/explore">Voir EXPLORE</Link>
        </Button>
      </section>
    </Page>
  );
}
