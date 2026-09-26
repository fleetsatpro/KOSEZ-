import { useEffect, useState } from "react";
import { Archive, Building2, Check, Plus, Users } from "lucide-react";
import { toast } from "sonner";
import { Eyebrow, Initials, Page, Surface } from "@/components/app/primitives";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useBlossomWorkspaceAccess } from "@/lib/blossom/access";
import { createOrganizationGroupOnServer, addOrganizationGroupMemberOnServer, archiveOrganizationGroupOnServer, getOrganizationGroupsOnServer, getOrganizationWorkspaceOnServer, removeOrganizationGroupMemberOnServer, setOrganizationGroupTeacherOnServer } from "@/lib/blossom/domain.api";
import { useBlossom } from "@/lib/blossom/store";

type OrganizationWorkspace = Awaited<ReturnType<typeof getOrganizationWorkspaceOnServer>>;

export function OrgStudio() {
  const setOrgMode = useBlossom((s) => s.setOrgMode);
  const { access, pending: accessPending } = useBlossomWorkspaceAccess();
  const [workspace, setWorkspace] = useState<OrganizationWorkspace>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [groups, setGroups] = useState<Awaited<ReturnType<typeof getOrganizationGroupsOnServer>>>([]);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupKind, setGroupKind] = useState<"class" | "cohort">("class");
  const [groupTeacher, setGroupTeacher] = useState("");
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [groupLearner, setGroupLearner] = useState("");
  const [mutatingGroup, setMutatingGroup] = useState("");

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
      .then(async (data) => {
        if (disposed) return;
        setWorkspace(data);
        if (data) {
          setGroupsLoading(true);
          try {
            setGroups(await getOrganizationGroupsOnServer({ data: { organizationId: data.id } }));
          } catch {
            setGroups([]);
          } finally {
            setGroupsLoading(false);
          }
        }
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

  const learners = workspace.members.filter((member) => member.role === "learner");
  const staff = workspace.members.filter((member) => ["owner", "admin", "teacher"].includes(member.role));
  const selectedGroup = groups.find((group) => group.id === selectedGroupId) ?? null;
  const availableLearners = learners.filter(
    (member) => !selectedGroup?.members.some((entry) => entry.id === member.id),
  );

  async function reloadGroups() {
    if (!workspace) return;
    setGroupsLoading(true);
    try {
      const next = await getOrganizationGroupsOnServer({ data: { organizationId: workspace.id } });
      setGroups(next);
      setSelectedGroupId((current) => current || next.find((group) => group.status === "active")?.id || "");
    } finally {
      setGroupsLoading(false);
    }
  }

  async function createGroup() {
    if (!workspace || !groupName.trim() || mutatingGroup) return;
    setMutatingGroup("create");
    try {
      await createOrganizationGroupOnServer({
        data: {
          organizationId: workspace.id,
          name: groupName.trim(),
          kind: groupKind,
          teacherUserId: groupTeacher || null,
        },
      });
      setGroupName("");
      setGroupTeacher("");
      await reloadGroups();
      toast("Structure créée.");
    } catch {
      toast("La classe ou cohorte n’a pas pu être créée.");
    } finally {
      setMutatingGroup("");
    }
  }

  async function addLearner() {
    if (!selectedGroup || !groupLearner || mutatingGroup) return;
    setMutatingGroup("member");
    try {
      await addOrganizationGroupMemberOnServer({
        data: { groupId: selectedGroup.id, learnerUserId: groupLearner },
      });
      setGroupLearner("");
      await reloadGroups();
      toast("Apprenant ajouté au groupe.");
    } catch {
      toast("L’apprenant n’a pas pu être ajouté.");
    } finally {
      setMutatingGroup("");
    }
  }

  async function removeLearner(userId: string) {
    if (!selectedGroup || mutatingGroup) return;
    setMutatingGroup("remove:" + userId);
    try {
      await removeOrganizationGroupMemberOnServer({
        data: { groupId: selectedGroup.id, learnerUserId: userId },
      });
      await reloadGroups();
    } catch {
      toast("Le retrait n’a pas été enregistré.");
    } finally {
      setMutatingGroup("");
    }
  }

  async function changeTeacher(userId: string) {
    if (!selectedGroup || mutatingGroup) return;
    setMutatingGroup("teacher");
    try {
      await setOrganizationGroupTeacherOnServer({
        data: { groupId: selectedGroup.id, teacherUserId: userId || null },
      });
      await reloadGroups();
      toast("Responsable mis à jour.");
    } catch {
      toast("Le responsable n’a pas pu être mis à jour.");
    } finally {
      setMutatingGroup("");
    }
  }

  async function archiveSelected() {
    if (!selectedGroup || mutatingGroup) return;
    setMutatingGroup("archive");
    try {
      await archiveOrganizationGroupOnServer({ data: { groupId: selectedGroup.id } });
      await reloadGroups();
      toast("Groupe archivé.");
    } catch {
      toast("Le groupe n’a pas pu être archivé.");
    } finally {
      setMutatingGroup("");
    }
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
          <p className="text-xs uppercase tracking-[0.16em] text-muted">Parole · 7 jours</p>
          <p className="mt-2 font-display text-4xl tabular-nums">{workspace.stats.speakingMinutesThisWeek}<span className="ml-1 text-sm text-muted">min</span></p>
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

      <Surface className="mt-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <Eyebrow>Classes & cohortes</Eyebrow>
            <h2 className="mt-2 font-display text-2xl tracking-tight">Une organisation structurée, pas un simple roster.</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
              Les groupes sont persistants, rattachés à cette organisation et séparés des liens globaux enseignant–apprenant.
              Les opérations sensibles restent contrôlées côté serveur.
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={() => void reloadGroups()} aria-label="Actualiser les groupes">
            <Users className="size-4" />
          </Button>
        </div>

        {(workspace.currentRole === "owner" || workspace.currentRole === "admin") ? (
          <div className="mt-5 rounded-xl border border-border bg-surface-2/30 p-4">
            <Eyebrow>Créer</Eyebrow>
            <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_9rem_1fr_auto]">
              <input
                value={groupName}
                onChange={(event) => setGroupName(event.target.value)}
                maxLength={100}
                className="h-11 rounded-lg border border-border bg-bg px-3 text-sm"
                placeholder="Nom de la classe ou cohorte"
                aria-label="Nom du groupe"
              />
              <select value={groupKind} onChange={(event) => setGroupKind(event.target.value as "class" | "cohort")} className="h-11 rounded-lg border border-border bg-bg px-3 text-sm">
                <option value="class">Classe</option>
                <option value="cohort">Cohorte</option>
              </select>
              <select value={groupTeacher} onChange={(event) => setGroupTeacher(event.target.value)} className="h-11 rounded-lg border border-border bg-bg px-3 text-sm">
                <option value="">Responsable plus tard</option>
                {staff.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}
              </select>
              <Button disabled={!groupName.trim() || mutatingGroup === "create"} onClick={() => void createGroup()}>
                <Plus className="size-4" />
                {mutatingGroup === "create" ? "Création…" : "Créer"}
              </Button>
            </div>
          </div>
        ) : null}

        {groupsLoading ? (
          <p className="mt-5 text-sm text-muted">Chargement des groupes…</p>
        ) : groups.length === 0 ? (
          <div className="mt-5 rounded-xl border border-dashed border-border p-5">
            <p className="text-sm text-muted">Aucune classe ou cohorte persistante pour cette organisation.</p>
          </div>
        ) : (
          <div className="mt-5 grid gap-4 lg:grid-cols-[18rem_1fr]">
            <div className="space-y-2">
              {groups.map((group) => (
                <button
                  key={group.id}
                  type="button"
                  onClick={() => setSelectedGroupId(group.id)}
                  className={selectedGroupId === group.id ? "w-full rounded-xl border border-primary/20 bg-primary/5 p-4 text-left" : "w-full rounded-xl border border-border bg-surface-2/30 p-4 text-left hover:bg-surface-2"}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate font-medium">{group.name}</span>
                    <Badge variant={group.status === "active" ? "outline" : "clay"}>{group.status}</Badge>
                  </span>
                  <span className="mt-2 block text-xs text-muted">
                    {group.kind === "class" ? "Classe" : "Cohorte"} · {group.learnerCount} apprenant{group.learnerCount === 1 ? "" : "s"}
                  </span>
                  <span className="mt-1 block text-[11px] text-subtle">
                    {group.activeLearnersThisWeek} actif{group.activeLearnersThisWeek === 1 ? "" : "s"} · 7 jours
                  </span>
                </button>
              ))}
            </div>

            {selectedGroup ? (
              <div className="rounded-xl border border-border bg-surface-2/20 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <Eyebrow>{selectedGroup.kind === "class" ? "Classe" : "Cohorte"}</Eyebrow>
                    <h3 className="mt-1 font-display text-2xl">{selectedGroup.name}</h3>
                    <p className="mt-1 text-xs text-muted">
                      {selectedGroup.teacher ? "Responsable · " + selectedGroup.teacher.name : "Aucun responsable attribué"}
                    </p>
                  </div>
                  {(workspace.currentRole === "owner" || workspace.currentRole === "admin") && selectedGroup.status === "active" ? (
                    <Button variant="ghost" size="sm" onClick={() => void archiveSelected()} disabled={mutatingGroup === "archive"}>
                      <Archive className="size-4" />
                      {mutatingGroup === "archive" ? "Archivage…" : "Archiver"}
                    </Button>
                  ) : null}
                </div>

                {(workspace.currentRole === "owner" || workspace.currentRole === "admin") && selectedGroup.status === "active" ? (
                  <div className="mt-5">
                    <Eyebrow>Responsable</Eyebrow>
                    <div className="mt-2 flex gap-2">
                      <select
                        value={selectedGroup.teacher?.id ?? ""}
                        onChange={(event) => void changeTeacher(event.target.value)}
                        className="h-11 min-w-0 flex-1 rounded-lg border border-border bg-bg px-3 text-sm"
                        disabled={mutatingGroup === "teacher"}
                      >
                        <option value="">Aucun responsable</option>
                        {staff.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}
                      </select>
                    </div>
                  </div>
                ) : null}

                {selectedGroup.status === "active" ? (
                  <div className="mt-5">
                    <Eyebrow>Apprenants</Eyebrow>
                    {(workspace.currentRole === "owner" || workspace.currentRole === "admin" || workspace.currentRole === "teacher") ? (
                      <div className="mt-2 flex gap-2">
                        <select
                          value={groupLearner}
                          onChange={(event) => setGroupLearner(event.target.value)}
                          className="h-11 min-w-0 flex-1 rounded-lg border border-border bg-bg px-3 text-sm"
                        >
                          <option value="">Ajouter un apprenant…</option>
                          {availableLearners.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}
                        </select>
                        <Button variant="secondary" disabled={!groupLearner || mutatingGroup === "member"} onClick={() => void addLearner()}>
                          {mutatingGroup === "member" ? "Ajout…" : "Ajouter"}
                        </Button>
                      </div>
                    ) : null}

                    {selectedGroup.members.length ? (
                      <ul className="mt-4 divide-y divide-border rounded-xl border border-border bg-bg/30">
                        {selectedGroup.members.map((member) => (
                          <li key={member.id} className="flex items-center gap-3 p-3">
                            <Initials letters={member.name.slice(0, 1)} />
                            <span className="min-w-0 flex-1">
                              <span className="block text-sm font-medium">{member.name}</span>
                              <span className="block text-[11px] text-subtle">{member.id}</span>
                            </span>
                            <Check className="size-4 text-primary" />
                            {(workspace.currentRole === "owner" || workspace.currentRole === "admin" || workspace.currentRole === "teacher") ? (
                              <Button variant="ghost" size="sm" onClick={() => void removeLearner(member.id)} disabled={mutatingGroup === "remove:" + member.id}>
                                Retirer
                              </Button>
                            ) : null}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-4 rounded-xl border border-dashed border-border p-4 text-sm text-muted">Aucun apprenant affecté.</p>
                    )}
                  </div>
                ) : (
                  <p className="mt-5 text-sm text-muted">Ce groupe est archivé; ses membres historiques restent consultables.</p>
                )}
              </div>
            ) : null}
          </div>
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
