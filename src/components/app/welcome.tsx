import { Button } from "@/components/ui/button";
import { TODAY_MISSION } from "@/lib/blossom/data";
import { useBlossom } from "@/lib/blossom/store";
import { ArrowRight, Sprout } from "lucide-react";
import { Wordmark } from "./primitives";

export function Welcome() {
  const enter = useBlossom((s) => s.enter);
  const firstName = useBlossom((s) => s.learner.firstName);

  return (
    <main className="relative min-h-dvh overflow-hidden bg-fg text-primary-foreground">
      <img
        src="/images/botanical.jpg"
        alt=""
        className="absolute inset-0 h-full w-full object-cover opacity-60"
      />
      <div className="absolute inset-0 bg-fg/65" />
      <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-6xl flex-col justify-between px-5 py-6 sm:px-8 sm:py-8">
        <div className="flex items-center justify-between">
          <Wordmark inverted />
          <span className="hidden items-center gap-2 text-xs text-primary-foreground/65 sm:flex">
            <span className="size-1.5 rounded-full bg-primary-foreground/55" />
            Saint-Pierre · La Réunion
          </span>
        </div>

        <div className="grid gap-10 pb-5 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <section className="max-w-2xl">
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-primary-foreground/60">
              Un nouveau départ
            </p>
            <h1 className="mt-4 max-w-xl font-display text-5xl leading-[0.94] tracking-tight sm:text-6xl lg:text-7xl">
              Votre langue.
              <br />
              Votre voyage.
              <br />
              Votre BLOSSOM.
            </h1>
            <p className="mt-6 max-w-lg text-base leading-7 text-primary-foreground/78 sm:text-lg">
              {firstName}, on ne commence pas par une longue séance.
              On commence par un geste que vous pourrez vraiment utiliser.
            </p>
          </section>

          <section className="rounded-2xl border border-primary-foreground/15 bg-fg/70 p-5 shadow-[var(--shadow-border)] backdrop-blur-sm sm:p-6">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-primary-foreground/10 text-primary-foreground">
                <Sprout className="size-4.5" strokeWidth={1.7} />
              </span>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary-foreground/55">
                  Votre premier geste
                </p>
                <p className="mt-1 text-sm text-primary-foreground/80">
                  Aujourd'hui · {TODAY_MISSION.durationMin} min
                </p>
              </div>
            </div>
            <p className="mt-5 font-display text-2xl leading-tight sm:text-3xl">
              {TODAY_MISSION.title}
            </p>
            <p className="mt-3 text-sm leading-6 text-primary-foreground/68">
              Une scène réelle. Une phrase d'appui. Puis vous passez à l'action.
            </p>
            <Button
              className="mt-6 h-12 w-full bg-primary-foreground text-fg hover:bg-primary-foreground/90"
              onClick={enter}
            >
              Commencer le voyage
              <ArrowRight className="size-4" />
            </Button>
            <p className="mt-3 text-center text-[11px] text-primary-foreground/45">
              Sans forcer. Sans tout apprendre d'abord.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
