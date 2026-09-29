import { Link } from "@tanstack/react-router";
import { ArrowLeft, Languages } from "lucide-react";
import { Eyebrow, Page, Surface } from "@/components/app/primitives";
import { Button } from "@/components/ui/button";
import { describeLearnLanguage } from "@/lib/i18n";
import type { LearnLanguageId } from "@/lib/i18n/locales";

export function LearningSurfaceAvailability({
  languageId,
  surface,
}: {
  languageId: LearnLanguageId;
  surface: string;
}) {
  const language = describeLearnLanguage(languageId, "fr");
  return (
    <Page className="kosez-feature-page max-w-2xl">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link to="/moi">
          <ArrowLeft className="size-4" />
          Retour
        </Link>
      </Button>
      <Surface className="mt-8 !p-6">
        <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Languages className="size-4" />
        </span>
        <Eyebrow className="mt-5">Surface non activée</Eyebrow>
        <h1 className="mt-2 font-display text-3xl tracking-tight">
          {language.label} n’est pas encore disponible ici.
        </h1>
        <p className="mt-3 text-sm leading-7 text-muted">
          Cette porte ({surface}) n’est pas exposée pour cette langue. Choisissez une
          langue disposant de cette surface dans vos préférences, sans basculer vers
          un contenu d’une autre langue.
        </p>
        <Button asChild className="mt-6">
          <Link to="/moi">Changer de langue</Link>
        </Button>
      </Surface>
    </Page>
  );
}
