import { Link } from "@tanstack/react-router";
import { MESSAGES } from "@/lib/i18n/messages";

export function RouterNotFound() {
  const m = MESSAGES.fr;
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-bg px-6 text-center text-fg">
      <p className="font-display text-2xl tracking-tight">{m.errors.notFound}</p>
      <p className="mt-2 text-sm text-muted">{m.errors.notFoundDetail}</p>
      <Link to="/" className="mt-6 text-sm text-primary">
        {m.errors.backToBlossom}
      </Link>
    </main>
  );
}
