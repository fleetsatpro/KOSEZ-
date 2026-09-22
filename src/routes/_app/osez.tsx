import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Mic, MapPin, Sparkles } from "lucide-react";
import { CourageRibbon } from "@/components/app/courage-ribbon";
import { Eyebrow, Page } from "@/components/app/primitives";
import { Badge } from "@/components/ui/badge";
import { SCENARIOS, LEARNER_MEMORY, planAllows } from "@/lib/blossom/data";
import { hasSource } from "@/lib/blossom/engine";
import { courageDaysFromLog, todaysPulseDare } from "@/lib/blossom/organism";
import { useBlossom } from "@/lib/blossom/store";

export const Route = createFileRoute("/_app/osez")({
  component: OsezPage,
});

function OsezPage() {
  const log = useBlossom((s) => s.activityLog);
  const plan = useBlossom((s) => s.plan);
  const memoryOn = planAllows(plan, "memory");
  const dare = todaysPulseDare();
  const courageDays = courageDaysFromLog(log);

  return (
    <Page className="kosez-feature-page">
      <Eyebrow>OSEZ</Eyebrow>
      <h1 className="mt-2 font-display text-4xl tracking-tight">Parler maintenant</h1>
      <p className="mt-3 max-w-lg text-sm leading-relaxed text-muted">
        Trois portes. Une seule suffit aujourd&apos;hui.
        {memoryOn ? (
          <>
            {" "}
            Léo garde en tête « {LEARNER_MEMORY.avoided} » — sans vous brusquer.
          </>
        ) : null}
      </p>

      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        <Link
          to="/osez/pulse"
          className="group flex flex-col rounded-2xl border border-primary/20 bg-primary/5 p-5 shadow-[var(--shadow-border)] transition-transform hover:-translate-y-0.5"
        >
          <span className="flex size-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <Sparkles className="size-4" strokeWidth={1.7} />
          </span>
          <h2 className="mt-4 font-display text-2xl">Pulse</h2>
          <p className="mt-2 flex-1 text-sm leading-6 text-muted">{dare.line}</p>
          <p className="mt-4 inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            90 secondes
            <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
          </p>
        </Link>

        <div className="rounded-2xl border border-border/70 bg-surface p-5 shadow-[var(--shadow-border)]">
          <span className="flex size-10 items-center justify-center rounded-xl bg-surface-2 text-primary">
            <MapPin className="size-4" strokeWidth={1.7} />
          </span>
          <h2 className="mt-4 font-display text-2xl">Street</h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            Dans le monde réel, puis vous notez. La terre s&apos;en souvient.
          </p>
          <p className="mt-4 text-xs text-subtle">
            Utilisez une mission Terrain depuis BLOSSOM, ou une room ci-dessous.
          </p>
        </div>

        <Link
          to="/tandem"
          className="group flex flex-col rounded-2xl border border-border/70 bg-surface p-5 shadow-[var(--shadow-border)] transition-transform hover:-translate-y-0.5"
        >
          <span className="flex size-10 items-center justify-center rounded-xl bg-surface-2 text-primary">
            <Mic className="size-4" strokeWidth={1.7} />
          </span>
          <h2 className="mt-4 font-display text-2xl">Tandem</h2>
          <p className="mt-2 flex-1 text-sm leading-6 text-muted">
            Une constellation de présences — pas un feed.
          </p>
          <p className="mt-4 inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            Ouvrir
            <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
          </p>
        </Link>
      </div>

      <div className="mt-8 rounded-2xl border border-border/70 bg-surface p-5 shadow-[var(--shadow-border)]">
        <CourageRibbon days={courageDays} />
      </div>

      <h2 className="mt-10 font-display text-2xl tracking-tight">Speak Rooms</h2>
      <p className="mt-2 max-w-lg text-sm text-muted">
        Conversations guidées. Vous parlez. Le bilan vient après.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {SCENARIOS.map((scene) => {
          const done = hasSource(log, `speak-${scene.id}`);
          return (
            <Link
              key={scene.id}
              to="/osez/$id"
              params={{ id: scene.id }}
              className="group overflow-hidden rounded-xl bg-surface shadow-[var(--shadow-border)] transition-shadow duration-150 hover:shadow-[var(--shadow-border-hover)]"
            >
              <div className="aspect-video overflow-hidden">
                <img
                  src={scene.image}
                  alt=""
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                />
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-display text-2xl">{scene.title}</h3>
                  <Badge variant={done ? "default" : "outline"}>
                    {done ? "Faite" : `${scene.durationMin} min`}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-muted">{scene.setting}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </Page>
  );
}
