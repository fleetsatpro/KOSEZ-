import { useEffect, useState } from "react";
import { Building2, Users } from "lucide-react";
import { Eyebrow, Initials, Page, Surface } from "@/components/app/primitives";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useBlossomWorkspaceAccess } from "@/lib/blossom/access";
import { getOrganizationWorkspaceOnServer } from "@/lib/blossom/domain.api";
import { useBlossom } from "@/lib/blossom/store";

type OrganizationWorkspace = Awaited<ReturnType<typeof getOrganizationWorkspaceOnServer>>;

export function OrgStudio() {
  const setOrgMode = useBlossom((s) => s.setOrgMode);
  const { access, pending: accessPending } = useBlossomWorkspaceAccess();
  const [workspace, setWorkspace] = useState<OrganizationWorkspace>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let disposed = false;
    if (accessPending) return;
    if (!access.isOrgStaff) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    void getOrganizationWorkspaceOnServer()
      .then((data) => {
        if (!disposed) setWorkspace(data);
      })
      .catch(() => {
        if (!disposed) setError("Impossible de charger votre organisation.");
      })
      .finally(() => {
        if (!disposed) setLoading(false);
      });
    return () => {
      disposed = true;
    };
  }, [access.isOrgStaff, accessPending]);

  if (accessPending || loading) {
    return (
      <Page>
        <Eyebrow>Espace entreprise</Eyebrow>
        <p className="mt-3 text-sm text-muted">Vérification de vos autorisations…</p>
      </Page>
    );
  }

  if (!access.isOrgStaff) {
    return (
      <Page>
        <Eyebrow>Espace entreprise</Eyebrow>
        <h1 className="mt-2 font-display text-2xl">Accès non disponible</h1>
        <p className="mt-3 text-sm leading-6 text-muted">
          Ce compte n’a pas de rôle entreprise actif.
        </p>
        <Button variant="secondary" className="mt-6" onClick={() => setOrgMode(false)}>
          Revenir au voyage
        </Button>
      </Page>
    );
  }

  if (error) {
    return (
      <Page>
        <Eyebrow>Espace entreprise</Eyebrow>
        <h1 className="mt-2 font-display text-2xl">Données indisponibles</h1>
        <p className="mt-3 text-sm text-muted">{error}</p>
        <Button
          className="mt-6"
          variant="secondary"
          onClick={() => window.location.reload()}
        >
          Réessayer
        </Button>
      </Page>
    );
  }

  if (!workspace) {
    return (
      <Page>
        <Eyebrow>Espace entreprise</Eyebrow>
        <Surface className="mt-6">
          <Building2 className="size-5 text-primary" />
          <h1 className="mt-4 font-display text-2xl">Organisation introuvable.</h1>
          <p className="mt-2 text-sm leading-6 text-muted">
            Le rôle entreprise est bien présent sur le compte, mais aucune organisation active n’a été trouvée.
          </p>
        </Surface>
      </Page>
    );
  }

  return (
    <Page>
      <div className="flex items-start justify-between gap-4">
        <div>
          <Eyebrow>Espace entreprise</Eyebrow>
          <h1 className="mt-2 font-display text-4xl tracking-tight">{workspace.name}</h1>
          <p className="mt-1 text-sm text-muted">
            {workspace.city ?? "Localisation non renseignée"} · données de membres actives
          </p>
        </div>
        <Button variant="secondary" onClick={() => setOrgMode(false)}>
          Revenir
        </Button>
      </div>

      <div className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Surface>
          <p className="text-xs uppercase tracking-[0.16em] text-muted">Membres actifs</p>
          <p className="mt-2 font-display text-4xl tabular-nums">{workspace.members.length}</p>
        </Surface>
        <Surface>
          <p className="text-xs uppercase tracking-[0.16em] text-muted">Apprenants</p>
          <p className="mt-2 font-display text-4xl tabular-nums">{workspace.stats.learners}</p>
        </Surface>
        <Surface>
          <p className="text-xs uppercase tracking-[0.16em] text-muted">Actifs · 7 jours</p>
          <p className="mt-2 font-display text-4xl tabular-nums text-primary">{workspace.stats.activeLearnersThisWeek}</p>
        </Surface>
        <Surface>
          <p className="text-xs uppercase tracking-[0.16em] text-muted">Pratique · 7 jours</p>
          <p className="mt-2 font-display text-4xl tabular-nums">{workspace.stats.practiceMinutesThisWeek}<span className="ml-1 text-sm text-muted">min</span></p>
        </Surface>
      </div>

      <Surface className="mt-5">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Users className="size-4" />
          </span>
          <div>
            <Eyebrow>Membres</Eyebrow>
            <p className="mt-1 text-sm text-muted">
              Liste issue des relations organisationnelles actives.
            </p>
          </div>
        </div>

        {workspace.members.length ? (
          <ul className="mt-6 divide-y divide-border">
            {workspace.members.map((member) => (
              <li key={member.id} className="flex items-center gap-3 py-4">
                <Initials letters={member.name.slice(0, 1)} />
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{member.name}</p>
                  <p className="mt-1 text-xs text-subtle">{member.id}</p>
                </div>
                <Badge variant="outline">{member.role}</Badge>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-6 text-sm text-muted">Aucun membre actif.</p>
        )}
      </Surface>

      <p className="mt-5 text-xs leading-5 text-subtle">
        Les invitations, facturation et autres opérations administratives restent
        désactivées tant qu’un workflow serveur dédié n’est pas configuré. Aucune
        action fictive n’est affichée comme accomplie.
      </p>
    </Page>
  );
}
