import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Wordmark } from "@/components/app/primitives";
import { authClient, authEnabled } from "@/lib/auth/client";
import { emailAndPasswordEnabled } from "@/lib/auth/email-password";
import { useCurrentUserState } from "@/lib/auth/use-current-user";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

type Mode = "signin" | "signup";

function LoginPage() {
  const { user, isPending } = useCurrentUserState();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  if (authEnabled && !isPending && user) {
    return <Navigate to="/" />;
  }

  async function handleEmail(event: FormEvent) {
    event.preventDefault();
    if (!emailAndPasswordEnabled) return;
    setBusy(true);
    setError(null);
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedName = name.trim();
    if (!trimmedEmail || password.length < 8) {
      setError("Email et mot de passe (8 caractères minimum) requis.");
      setBusy(false);
      return;
    }
    try {
      if (mode === "signup") {
        if (!trimmedName) {
          setError("Indiquez un prénom ou un nom d'affichage.");
          setBusy(false);
          return;
        }
        const { error: signUpError } = await authClient.signUp.email({
          email: trimmedEmail,
          password,
          name: trimmedName,
        });
        if (signUpError) {
          throw new Error(signUpError.message ?? "Inscription impossible.");
        }
      } else {
        const { error: signInError } = await authClient.signIn.email({
          email: trimmedEmail,
          password,
        });
        if (signInError) {
          throw new Error(signInError.message ?? "Identifiants incorrects.");
        }
      }
      window.location.href = "/";
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Connexion impossible.");
      setBusy(false);
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
                  Votre parcours, vos preuves, vos exercices et votre mémoire vous suivent d'un
                  appareil à l'autre. Connexion par email uniquement.
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

            {!authEnabled ? (
              <div className="mt-7 rounded-2xl border border-primary/15 bg-primary/5 p-5">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 size-5 text-primary" />
                  <div>
                    <p className="font-medium">Mode aperçu</p>
                    <p className="mt-1 text-sm leading-6 text-muted">
                      L'authentification est désactivée pour cet environnement de démonstration.
                      Les données de test restent isolées dans ce profil.
                    </p>
                  </div>
                </div>
                <Button asChild className="mt-5 w-full">
                  <Link to="/">
                    Entrer dans l'application <ArrowRight className="size-4" />
                  </Link>
                </Button>
              </div>
            ) : emailAndPasswordEnabled ? (
              <form className="mt-7 space-y-3" onSubmit={(e) => void handleEmail(e)}>
                <div className="flex gap-2 rounded-full border border-border/70 bg-surface-2/50 p-1">
                  <button
                    type="button"
                    className={
                      mode === "signin"
                        ? "flex-1 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
                        : "flex-1 rounded-full px-3 py-1.5 text-xs font-medium text-muted"
                    }
                    onClick={() => {
                      setMode("signin");
                      setError(null);
                    }}
                  >
                    Se connecter
                  </button>
                  <button
                    type="button"
                    className={
                      mode === "signup"
                        ? "flex-1 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
                        : "flex-1 rounded-full px-3 py-1.5 text-xs font-medium text-muted"
                    }
                    onClick={() => {
                      setMode("signup");
                      setError(null);
                    }}
                  >
                    Créer un compte
                  </button>
                </div>

                {mode === "signup" ? (
                  <label className="block space-y-1.5">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-subtle">
                      Prénom / nom
                    </span>
                    <input
                      type="text"
                      autoComplete="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="h-11 w-full rounded-xl border border-border bg-bg px-3 text-sm text-fg outline-none ring-primary/40 focus:ring-2"
                      placeholder="Daniela"
                      disabled={busy}
                    />
                  </label>
                ) : null}

                <label className="block space-y-1.5">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-subtle">
                    Email
                  </span>
                  <input
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-11 w-full rounded-xl border border-border bg-bg px-3 text-sm text-fg outline-none ring-primary/40 focus:ring-2"
                    placeholder="vous@exemple.com"
                    required
                    disabled={busy}
                  />
                </label>

                <label className="block space-y-1.5">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-subtle">
                    Mot de passe
                  </span>
                  <input
                    type="password"
                    autoComplete={mode === "signup" ? "new-password" : "current-password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-11 w-full rounded-xl border border-border bg-bg px-3 text-sm text-fg outline-none ring-primary/40 focus:ring-2"
                    placeholder="8 caractères minimum"
                    minLength={8}
                    required
                    disabled={busy}
                  />
                </label>

                <Button
                  type="submit"
                  size="lg"
                  className="h-12 w-full justify-between"
                  disabled={busy}
                >
                  <span>
                    {busy
                      ? mode === "signup"
                        ? "Création…"
                        : "Connexion…"
                      : mode === "signup"
                        ? "Créer mon compte"
                        : "Se connecter"}
                  </span>
                  <ArrowRight className="size-4" />
                </Button>
              </form>
            ) : (
              <p className="mt-7 text-sm text-muted">
                L'inscription par email n'est pas activée sur cet environnement.
              </p>
            )}

            {error ? (
              <p
                role="alert"
                className="mt-4 rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive"
              >
                {error}
              </p>
            ) : null}

            <p className="mt-7 border-t border-border pt-5 text-xs leading-5 text-subtle">
              En continuant, vous accédez aux fonctionnalités correspondant à votre compte et à vos
              autorisations. Connexion sécurisée par email et mot de passe uniquement.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
