import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Shield, UserCog } from "lucide-react";
import { Eyebrow, Surface } from "@/components/app/primitives";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  listPlatformUsersOnServer,
  setUserPlatformRoleOnServer,
} from "@/lib/blossom/domain.api";

type UserRow = Awaited<ReturnType<typeof listPlatformUsersOnServer>>[number];
type Role = "admin" | "teacher" | "org_staff";

export function AdminRoleStudio() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  function load() {
    setLoading(true);
    void listPlatformUsersOnServer({ data: { limit: 100 } })
      .then(setUsers)
      .catch(() => toast("Impossible de charger les utilisateurs."))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  async function toggle(user: UserRow, role: Role, active: boolean) {
    setBusyId(`${user.id}:${role}`);
    try {
      await setUserPlatformRoleOnServer({
        data: { targetUserId: user.id, role, active },
      });
      toast(
        active
          ? `Rôle ${role} accordé à ${user.name}.`
          : `Rôle ${role} retiré pour ${user.name}.`,
      );
      load();
    } catch {
      toast("La mise à jour du rôle a échoué.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <Surface className="mt-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Eyebrow>Rôles plateforme</Eyebrow>
          <h2 className="mt-2 font-display text-2xl">Promouvoir des comptes</h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-muted">
            Accordez admin, enseignant ou staff organisation. Les changements sont
            audités. Vous ne pouvez pas retirer votre propre rôle admin.
          </p>
        </div>
        <UserCog className="size-5 text-primary" strokeWidth={1.7} />
      </div>

      {loading ? (
        <p className="mt-6 text-sm text-muted">Chargement des comptes…</p>
      ) : users.length === 0 ? (
        <p className="mt-6 text-sm text-muted">
          Aucun profil encore. Les comptes apparaissent après inscription email.
        </p>
      ) : (
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <thead>
              <tr className="text-[10px] uppercase tracking-[0.16em] text-subtle">
                <th className="pb-3 font-semibold">Compte</th>
                <th className="pb-3 font-semibold">Rôles</th>
                <th className="pb-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-t border-border">
                  <td className="py-3 align-top">
                    <p className="font-medium">{user.name}</p>
                    <p className="text-xs text-muted">{user.email ?? user.id}</p>
                  </td>
                  <td className="py-3 align-top">
                    <div className="flex flex-wrap gap-1.5">
                      {user.isAdmin ? <Badge>Admin</Badge> : null}
                      {user.isTeacher ? <Badge variant="outline">Teacher</Badge> : null}
                      {user.isOrgStaff ? (
                        <Badge variant="outline">Org staff</Badge>
                      ) : null}
                      {!user.isAdmin && !user.isTeacher && !user.isOrgStaff ? (
                        <span className="text-xs text-subtle">Apprenant</span>
                      ) : null}
                    </div>
                  </td>
                  <td className="py-3 align-top">
                    <div className="flex flex-wrap gap-2">
                      <RoleButton
                        label={user.isAdmin ? "Retirer admin" : "Admin"}
                        busy={busyId === `${user.id}:admin`}
                        onClick={() => void toggle(user, "admin", !user.isAdmin)}
                      />
                      <RoleButton
                        label={user.isTeacher ? "Retirer teacher" : "Teacher"}
                        busy={busyId === `${user.id}:teacher`}
                        onClick={() => void toggle(user, "teacher", !user.isTeacher)}
                      />
                      <RoleButton
                        label={user.isOrgStaff ? "Retirer staff" : "Org staff"}
                        busy={busyId === `${user.id}:org_staff`}
                        onClick={() =>
                          void toggle(user, "org_staff", !user.isOrgStaff)
                        }
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-5 flex items-start gap-2 text-xs leading-5 text-subtle">
        <Shield className="mt-0.5 size-3.5 shrink-0" />
        Les emails bootstrap (admin@kosez.app, owner@kosez.app) deviennent admin
        automatiquement à la première connexion.
      </p>
    </Surface>
  );
}

function RoleButton({
  label,
  busy,
  onClick,
}: {
  label: string;
  busy: boolean;
  onClick: () => void;
}) {
  return (
    <Button size="sm" variant="secondary" disabled={busy} onClick={onClick}>
      {busy ? "…" : label}
    </Button>
  );
}
