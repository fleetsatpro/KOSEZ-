import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Wordmark } from "@/components/app/primitives";
import { authEnabled, GROK_PROVIDERS, signIn } from "@/lib/auth/client";
import { useCurrentUserState } from "@/lib/auth/use-current-user";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const { user, isPending } = useCurrentUserState();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (authEnabled && !isPending && user) {
    return <Navigate to="/" />;
  }

  async function handle(providerId: string) {
    setBusy(providerId);
    setError(null);
    try {
      await signIn(providerId, { callbackURL: "/" });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Connexion impossible.");
      setBusy(null);
    }
  }

  return (
    <main className="modern-ui paper-grain min-h-dvh bg-bg text-fg">
      <div className="mx-auto flex min-h-dvh w-full max-w-5xl items-center px-5 py-8 sm:px-8">
        <div className="grid w-full overflow-hidden rounded-[28px] border border-border bg-surface shadow-[0_30px_100px_-60px_rgba(0,0,0,.9)] lg:grid-cols-[1.05fr_.95fr]">
          <section className="relative min-h-[28rem] overflow-hidden bg-fg p-7 text-primary-foreground sm:p-10">
            <div className="pointer-events-none absolute -right-24 -top-24 size-80 rounded-full border border-primary-foreground/10" />
            <div className="pointer-events-none absolute -bottom-40 left-1/2 size-96 -translate-x-1/2 rounded-full bg-primary/12 blur-3xl" />
            <div className="relative flex h-full flex-col justify-between">
              <Wordmark inverted />
              <div className="max-w-xl">
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-primary-foreground/45">
                  K'Osez · votre espace
                </p>
                <h1 className="mt-4 font-display text-5xl leading-[0.9] tracking-[-0.05em] sm:text-6xl">
                  Reprendre exactement <span className="text-primary">où vous étiez.</span>
                </h1>
                <p className="mt-5 max-w-lg text-sm leading-7 text-primary-foreground/65">
                  Votre parcours, vos preuves, vos exercices et votre mémoire vous suivent d'un appareil à l'autre.
                </p>
              </div>
            </div>
          </section>

          <section className="p-7 sm:p-10">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-subtle">
              Connexion
            </p>
            <h2 className="mt-3 font-display text-3xl tracking-tight">Entrer dans BLOSSOM</h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              Une identité unique pour votre apprentissage, vos échanges et vos preuves.
            </p>

            {authEnabled ? (
              <div className="mt-7 space-y-3">
                {GROK_PROVIDERS.map((provider) => (
                  <Button
                    key={provider.providerId}
                    variant="secondary"
                    size="lg"
                    className="h-12 w-full justify-between"
                    disabled={busy !== null}
                    onClick={() => void handle(provider.providerId)}
                  >
                    <span>{busy === provider.providerId ? "Connexion…" : `Continuer avec ${provider.label}`}</span>
                    <ArrowRight className="size-4" />
                  </Button>
                ))}
              </div>
            ) : (
              <div className="mt-7 rounded-2xl border border-primary/15 bg-primary/5 p-5">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 size-5 text-primary" />
                  <div>
                    <p className="font-medium">Mode aperçu</p>
                    <p className="mt-1 text-sm leading-6 text-muted">
                      L'authentification est désactivée pour cet environnement de démonstration. Les données de test restent isolées dans ce profil.
                    </p>
                  </div>
                </div>
                <Button asChild className="mt-5 w-full">
                  <Link to="/">Entrer dans l'application <ArrowRight className="size-4" /></Link>
                </Button>
              </div>
            )}

            {error ? (
              <p role="alert" className="mt-4 rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
                {error}
              </p>
            ) : null}

            <p className="mt-7 border-t border-border pt-5 text-xs leading-5 text-subtle">
              En continuant, vous accédez aux fonctionnalités correspondant à votre compte et à vos autorisations.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
