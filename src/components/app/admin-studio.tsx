import { useEffect, useState } from "react";
import { Activity, Building2, ClipboardList, ShieldCheck, Users } from "lucide-react";
import { Eyebrow, Page, Surface } from "@/components/app/primitives";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getAdminWorkspaceOnServer } from "@/lib/blossom/domain.api";
import { useBlossomWorkspaceAccess } from "@/lib/blossom/access";
import { useBlossom } from "@/lib/blossom/store";

type AdminWorkspace = Awaited<ReturnType<typeof getAdminWorkspaceOnServer>>;

function relative(value: string) {
  const days = Math.floor((Date.now() - new Date(value).getTime()) / 86_400_000);
  if (days <= 0) return "Aujourd’hui";
  if (days === 1) return "Hier";
  return `Il y a ${days} jours`;
}

export function AdminStudio() {
  const setAdminMode = useBlossom((s) => s.setAdminMode);
  const { access, pending: accessPending } = useBlossomWorkspaceAccess();
  const [workspace, setWorkspace] = useState<AdminWorkspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function load() {
    setLoading(true);
    setError(null);
    void getAdminWorkspaceOnServer()
      .then(setWorkspace)
      .catch(() => setError("Impossible de charger le centre opérationnel."))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    if (!accessPending && access.isAdmin) load();
    else if (!accessPending) setLoading(false);
  }, [access.isAdmin, accessPending]);

  if (accessPending || loading) {
    return (
      <Page>
        <Eyebrow>Admin</Eyebrow>
        <h1 className="mt-2 font-display text-3xl">Centre opérationnel</h1>
        <p className="mt-3 text-sm text-muted">Vérification des droits et chargement des données…</p>
      </Page>
    );
  }

  if (!access.isAdmin) {
    return (
      <Page>
        <Eyebrow>Admin</Eyebrow>
        <h1 className="mt-2 font-display text-2xl">Accès non disponible</h1>
        <p className="mt-3 max-w-lg text-sm leading-6 text-muted">
          Aucun droit d’administration plateforme actif n’est associé à ce compte.
        </p>
        <Button className="mt-6" variant="secondary" onClick={() => setAdminMode(false)}>
          Revenir au voyage
        </Button>
      </Page>
    );
  }

  if (error || !workspace) {
    return (
      <Page>
        <Eyebrow>Admin</Eyebrow>
        <h1 className="mt-2 font-display text-2xl">Données indisponibles</h1>
        <p className="mt-3 text-sm leading-6 text-muted">
          {error ?? "Aucune donnée opérationnelle n’a été retournée."}
        </p>
        <Button className="mt-6" variant="secondary" onClick={load}>
          Réessayer
        </Button>
      </Page>
    );
  }

  return (
    <Page className="max-w-5xl">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Eyebrow>Admin · Opérations</Eyebrow>
          <h1 className="mt-2 font-display text-4xl tracking-tight">
            Le système, pas une démo.
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
            Vue plateforme alimentée par les relations, événements, demandes
            et journaux réellement enregistrés. Aucun compteur de présentation.
          </p>
        </div>
        <Button variant="secondary" onClick={load}>
          Actualiser
        </Button>
      </header>

      <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric icon={Users} label="Apprenants" value={workspace.learners} />
        <Metric icon={Activity} label="Enseignants" value={workspace.teachers} />
        <Metric icon={Users} label="Parents" value={workspace.guardians} />
        <Metric icon={Building2} label="Organisations" value={workspace.activeOrganizations} />
      </section>

      <section className="mt-5 grid gap-4 lg:grid-cols-[1.1fr_.9fr]">
        <Surface>
          <div className="flex items-start justify-between gap-3">
            <div>
              <Eyebrow>Commerce</Eyebrow>
              <h2 className="mt-2 font-display text-2xl">Demandes et paiements</h2>
            </div>
            <ClipboardList className="size-5 text-primary" strokeWidth={1.7} />
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <Metric label="Demandes ouvertes" value={workspace.bookingRequests.requested} />
            <Metric label="Confirmées" value={workspace.bookingRequests.confirmed} />
            <Metric label="Payées" value={workspace.bookingRequests.paid} />
            <Metric label="Non payées" value={workspace.bookingRequests.unpaid} />
          </div>

          <p className="mt-5 text-xs leading-5 text-subtle">
            Une demande n’est jamais affichée comme payée ou confirmée par
            simple action client. Les changements d’état doivent venir du
            workflow serveur concerné.
          </p>
        </Surface>

        <Surface>
          <Eyebrow>Présence</Eyebrow>
          <h2 className="mt-2 font-display text-2xl">Événements enregistrés</h2>
          <p className="mt-2 text-sm text-muted">
            {workspace.joinedEventRegistrations} inscription
            {workspace.joinedEventRegistrations > 1 ? "s" : ""} actuellement dans le journal.
          </p>

          <div className="mt-6 rounded-xl border border-border bg-surface-2/45 p-4">
            <div className="flex items-center gap-3">
              <ShieldCheck className="size-4 text-primary" />
              <div>
                <p className="text-sm font-medium">Audit activé</p>
                <p className="text-xs text-muted">
                  Les opérations sensibles enregistrées apparaissent ci-dessous.
                </p>
              </div>
            </div>
          </div>
        </Surface>
      </section>

      <section className="mt-5">
        <Surface>
          <div className="flex items-end justify-between gap-3">
            <div>
              <Eyebrow>Journal</Eyebrow>
              <h2 className="mt-2 font-display text-2xl">Dernières opérations</h2>
            </div>
            <Badge variant="outline">{workspace.recentAudit.length} entrées</Badge>
          </div>

          {workspace.recentAudit.length === 0 ? (
            <p className="mt-6 text-sm text-muted">
              Aucun événement d’audit disponible pour le moment.
            </p>
          ) : (
            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[44rem] text-left text-sm">
                <thead>
                  <tr className="text-[10px] uppercase tracking-[0.16em] text-subtle">
                    <th className="pb-3 font-semibold">Action</th>
                    <th className="pb-3 font-semibold">Ressource</th>
                    <th className="pb-3 font-semibold">Sujet</th>
                    <th className="pb-3 font-semibold">Quand</th>
                  </tr>
                </thead>
                <tbody>
                  {workspace.recentAudit.map((event) => (
                    <tr key={event.id} className="border-t border-border">
                      <td className="py-3 font-medium">{event.action}</td>
                      <td className="py-3 text-muted">
                        {event.resourceType}
                        {event.resourceId ? ` · ${event.resourceId}` : ""}
                      </td>
                      <td className="py-3 text-muted">
                        {event.subjectUserId ?? "—"}
                      </td>
                      <td className="py-3 text-subtle">{relative(event.occurredAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Surface>
      </section>

      <p className="mt-5 text-xs leading-5 text-subtle">
        Catalogue, mission and event authoring still require a dedicated
        content-management transaction model; this workspace deliberately does
        not expose fake “save” controls for file-backed content.
      </p>
    </Page>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon?: typeof Users;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface-2/45 p-4">
      {Icon ? <Icon className="size-4 text-primary" strokeWidth={1.7} /> : null}
      <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-subtle">
        {label}
      </p>
      <p className="mt-1 font-display text-3xl tabular-nums">{value}</p>
    </div>
  );
}
