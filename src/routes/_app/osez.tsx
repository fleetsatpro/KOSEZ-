import { createFileRoute, Link } from "@tanstack/react-router";
import { Eyebrow, Page } from "@/components/app/primitives";
import { Badge } from "@/components/ui/badge";
import { SCENARIOS, LEARNER_MEMORY, planAllows } from "@/lib/blossom/data";
import { hasSource } from "@/lib/blossom/engine";
import { useBlossom } from "@/lib/blossom/store";

export const Route = createFileRoute("/_app/osez")({
  component: OsezPage,
});

function OsezPage() {
  const log = useBlossom((s) => s.activityLog);
  const plan = useBlossom((s) => s.plan);
  const memoryOn = planAllows(plan, "memory");

  return (
    <Page className="kosez-feature-page">
      <Eyebrow>OSEZ</Eyebrow>
      <h1 className="mt-2 font-display text-4xl tracking-tight">Speak Rooms</h1>
      <p className="mt-3 max-w-lg text-sm leading-relaxed text-muted">
        Des conversations vocales, sans traduction à l'écran. Vous parlez.
        Léo vous répond. Le bilan vient après.
        {memoryOn ? (
          <>
            {" "}
            Aujourd'hui il glisse « {LEARNER_MEMORY.avoided} » dans le café —
            vous l'évitez encore.
          </>
        ) : null}
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
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
                  <h2 className="font-display text-2xl">{scene.title}</h2>
                  <Badge variant={done ? "default" : "outline"}>
                    {done ? "Faite" : `${scene.durationMin} min`}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-muted">{scene.setting}</p>
                <p className="mt-2 text-xs text-subtle">{scene.level}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </Page>
  );
}
