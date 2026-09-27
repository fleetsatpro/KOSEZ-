import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Eyebrow, Page, Surface } from "@/components/app/primitives";
import { useBlossom } from "@/lib/blossom/store";
import { isLearnSurfaceAvailable, learnLanguageDef, type LearnSurface } from "@/lib/i18n/locales";

export function LearningSurfaceGate({
  surface,
  children,
}: {
  surface: LearnSurface;
  children: ReactNode;
}) {
  const languageId = useBlossom((s) => s.languageId);
  const language = learnLanguageDef(languageId);

  if (isLearnSurfaceAvailable(languageId, surface)) return <>{children}</>;

  return (
    <Page className="kosez-feature-page max-w-2xl">
      <Eyebrow>Couverture du parcours</Eyebrow>
      <h1 className="mt-2 font-display text-4xl tracking-tight sm:text-5xl">
        Cette porte n’est pas encore ouverte en {language.nativeName}.
      </h1>
      <p className="mt-4 max-w-xl text-sm leading-7 text-muted">
        Le moteur de pratique et la voix peuvent déjà exister pour cette langue,
        mais cette surface n’a pas encore son contenu dédié. K’Osez ne vous
        montre pas un parcours anglais sous une autre étiquette.
      </p>
      <Surface className="mt-6 max-w-xl !p-5">
        <p className="text-sm leading-6 text-fg">
          Parcours disponible : {language.surfaces.length
            ? language.surfaces.join(" · ")
            : "aucune surface dédiée pour le moment"}.
        </p>
        <Link
          to="/moi"
          className="mt-4 inline-flex text-xs font-semibold uppercase tracking-[0.14em] text-primary"
        >
          Modifier la langue dans MOI
        </Link>
      </Surface>
    </Page>
  );
}
