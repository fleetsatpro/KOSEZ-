import type { ErrorComponentProps } from "@tanstack/react-router";

export function RootErrorBoundary({ error, reset }: ErrorComponentProps) {
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.error("Unhandled render error:", error);
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#0a0d0c] px-6 text-center text-white">
      <p className="text-sm uppercase tracking-wide text-[#d9ff69]">K&apos;Osez BLOSSOM</p>
      <h1 className="text-xl font-semibold">Un imprévu s&apos;est glissé ici</h1>
      <p className="max-w-sm text-sm text-white/70">Ce n&apos;est pas grave — vos données sont en sécurité. Essayez de recharger la page.</p>
      <div className="mt-2 flex gap-3">
        <button type="button" onClick={reset} className="rounded-full bg-[#d9ff69] px-5 py-2 text-sm font-medium text-[#0a0d0c] transition hover:opacity-90">Réessayer</button>
        <a href="/" className="rounded-full border border-white/20 px-5 py-2 text-sm font-medium text-white transition hover:bg-white/10">Retour à l&apos;accueil</a>
      </div>
    </div>
  );
}
