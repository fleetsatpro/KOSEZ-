import { Button } from "@/components/ui/button";
import { useBlossom } from "@/lib/blossom/store";
import { Wordmark } from "./primitives";

export function Welcome() {
  const enter = useBlossom((s) => s.enter);
  const firstName = useBlossom((s) => s.learner.firstName);

  return (
    <div className="relative min-h-dvh overflow-hidden bg-fg text-primary-foreground">
      <img
        src="/images/botanical.jpg"
        alt=""
        className="absolute inset-0 h-full w-full object-cover opacity-70"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-fg via-fg/55 to-fg/25" />
      <div className="relative z-10 mx-auto flex min-h-dvh max-w-lg flex-col justify-end px-6 pb-12 pt-16">
        <Wordmark inverted />
        <h1 className="mt-10 font-display text-4xl leading-[1.12] tracking-tight sm:text-5xl">
          Votre langue.
          <br />
          Votre voyage.
          <br />
          Votre BLOSSOM.
        </h1>
        <p className="mt-5 max-w-sm text-sm leading-relaxed text-primary-foreground/80">
          {firstName}, la suite n'est pas un exercice. C'est une
          plante qui grandit chaque fois que vous osez parler — ici, et dehors.
        </p>
        <Button
          className="mt-8 h-12 w-full bg-primary-foreground text-fg hover:bg-primary-foreground/92"
          onClick={enter}
        >
          Entrer dans le voyage
        </Button>
        <p className="mt-4 text-center text-xs text-primary-foreground/55">
          Saint-Pierre · La Réunion
        </p>
      </div>
    </div>
  );
}
