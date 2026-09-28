import { createFileRoute } from "@tanstack/react-router";
import { useBlossom } from "@/lib/blossom/store";
import { canUseLearningSurface } from "@/lib/i18n/learning-surface";
import { Eyebrow, Surface } from "@/components/app/primitives";
import { Button } from "@/components/ui/button";
import { Users } from "lucide-react";

export const Route = createFileRoute("/_app/connect")({
  component: ConnectPage,
});

function ConnectPage() {
  const languageId = useBlossom((s) => s.languageId);
  const uiLocale = useBlossom((s) => s.uiLocale);
  const tandemOpen = useBlossom((s) => s.tandemOpen);
  const setTandemOpen = useBlossom((s) => s.setTandemOpen);
  const tandemStatus = useBlossom((s) => s.tandemStatus);

  const allowed = canUseLearningSurface("tandem", languageId, uiLocale);
  const peersUnavailable = !allowed;

  if (peersUnavailable) {
    return (
      <div className="mx-auto max-w-lg px-4 py-10">
        <Eyebrow>Tandem</Eyebrow>
        <h1 className="mt-2 font-display text-3xl tracking-tight">Pairs indisponibles</h1>
        <Surface className="mt-6">
          <p className="text-sm leading-7 text-muted">
            Le tandem n'est pas encore disponible pour cette langue ou cette locale.
            Continuez sur Mission, Osez ou Pron'Lab en attendant l'ouverture des paires.
          </p>
        </Surface>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <Eyebrow>Tandem</Eyebrow>
      <h1 className="mt-2 font-display text-3xl tracking-tight">Parler avec un pair</h1>
      <p className="mt-2 text-sm text-muted">
        Ouvrez votre disponibilité pour recevoir des suggestions de partenaires.
      </p>

      <Surface className="mt-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Users className="size-5 text-primary" />
          <div>
            <p className="font-medium">Disponibilité</p>
            <p className="text-xs text-muted">{tandemOpen ? "Visible pour les pairs" : "Fermé"}</p>
          </div>
        </div>
        <Button
          variant={tandemOpen ? "secondary" : "default"}
          onClick={() => setTandemOpen(!tandemOpen)}
        >
          {tandemOpen ? "Fermer" : "Ouvrir"}
        </Button>
      </Surface>

      <div className="mt-8 space-y-3">
        <Eyebrow>Statuts</Eyebrow>
        {Object.keys(tandemStatus).length === 0 ? (
          <p className="text-sm text-muted">Aucun partenaire pour le moment.</p>
        ) : (
          Object.entries(tandemStatus).map(([id, status]) => (
            <Surface key={id} className="flex items-center justify-between">
              <span className="text-sm font-medium">{id}</span>
              <span className="text-xs uppercase tracking-wider text-muted">{status}</span>
            </Surface>
          ))
        )}
      </div>
    </div>
  );
}
