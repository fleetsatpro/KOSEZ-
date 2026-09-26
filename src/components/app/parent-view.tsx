import { useEffect, useState } from "react";
import { HeartHandshake, Users } from "lucide-react";
import { calendarFilename, teacherSessionToIcs } from "@/lib/blossom/calendar";
import { Button } from "@/components/ui/button";
import { Eyebrow, Initials, Page, Surface } from "./primitives";
import { useBlossomWorkspaceAccess } from "@/lib/blossom/access";
import { getGuardianWorkspaceOnServer } from "@/lib/blossom/domain.api";
import { useBlossom } from "@/lib/blossom/store";
import { LearnerDetail } from "./learner-detail";
import { getGuardianSessionsOnServer } from "@/lib/blossom/domain.api";

type GuardianRow = Awaited<ReturnType<typeof getGuardianWorkspaceOnServer>>[number];
type GuardianSession = Awaited<ReturnType<typeof getGuardianSessionsOnServer>>[number];

function downloadSessionCalendar(session: {
  id: string;
  title: string;
  startsAt: string;
  durationMinutes: number;
  teacherName: string;
  learnerName: string;
}) {
  const ics = teacherSessionToIcs(session);
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = calendarFilename(session.title);
  anchor.click();
  URL.revokeObjectURL(url);
}

function relative(value: string | null) {
  if (!value) return "Aucune activité enregistrée";
  const days = Math.floor((Date.now() - new Date(value).getTime()) / 86_400_000);
  if (days <= 0) return "Aujourd’hui";
  if (days === 1) return "Hier";
  return `Il y a ${days} jours`;
}

export function ParentView() {
  const setParentMode = useBlossom((s) => s.setParentMode);
  const { access, pending: accessPending } = useBlossomWorkspaceAccess();
  const [children, setChildren] = useState<GuardianRow[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessions, setSessions] = useState<GuardianSession[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);

  useEffect(() => {
    let disposed = false;
    if (accessPending) return;
    if (!access.isGuardian) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    void getGuardianWorkspaceOnServer()
      .then((rows) => {
        if (disposed) return;
        setChildren(rows);
        setSelectedId((current) => current || rows[0]?.id || "");
      })
      .catch(() => {
        if (!disposed) setError("Impossible de charger les apprenants liés à ce compte.");
      })
      .finally(() => {
        if (!disposed) setLoading(false);
      });
    return () => {
      disposed = true;
    };
  }, [access.isGuardian, accessPending]);

  const selected = children.find((child) => child.id === selectedId) ?? children[0];
  useEffect(() => {
    if (!selected) {
      setSessions([]);
      return;
    }
    let disposed = false;
    setSessionsLoading(true);
    void getGuardianSessionsOnServer({
      data: { learnerUserId: selected.id, limit: 12 },
    })
      .then((rows) => {
        if (!disposed) setSessions(rows);
      })
      .catch(() => {
        if (!disposed) setSessions([]);
      })
      .finally(() => {
        if (!disposed) setSessionsLoading(false);
      });
    return () => {
      disposed = true;
    };
  }, [selected?.id]);


  if (accessPending || loading) {
    return (
      <Page className="max-w-2xl">
        <Eyebrow>Espace parent</Eyebrow>
        <p className="mt-3 text-sm text-muted">Vérification des liens et chargement des données…</p>
      </Page>
    );
  }

  if (!access.isGuardian) {
    return (
      <Page className="max-w-2xl">
        <Eyebrow>Espace parent</Eyebrow>
        <h1 className="mt-2 font-display text-2xl">Accès non disponible</h1>
        <p className="mt-3 text-sm leading-6 text-muted">
          Ce compte n’a pas de lien parent actif.
        </p>
        <Button variant="secondary" className="mt-6" onClick={() => setParentMode(false)}>
          Revenir au voyage
        </Button>
      </Page>
    );
  }

  if (error) {
    return (
      <Page className="max-w-2xl">
        <Eyebrow>Espace parent</Eyebrow>
        <h1 className="mt-2 font-display text-2xl">Données indisponibles</h1>
        <p className="mt-3 text-sm leading-6 text-muted">{error}</p>
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

  return (
    <Page className="max-w-2xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Eyebrow>Espace parent</Eyebrow>
          <h1 className="mt-2 font-display text-4xl tracking-tight">
            La semaine, pas le travail.
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted">
            Vous voyez les repères d’activité des apprenants qui vous sont réellement liés.
          </p>
        </div>
        <Button variant="secondary" onClick={() => setParentMode(false)}>
          Revenir
        </Button>
      </div>

      {children.length === 0 ? (
        <Surface className="mt-8">
          <Users className="size-5 text-primary" />
          <h2 className="mt-4 font-display text-2xl">Aucun apprenant lié.</h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            Le compte parent est prêt, mais aucune relation active n’a encore été enregistrée.
            Rien n’est inventé en attendant.
          </p>
        </Surface>
      ) : (
        <>
          <div className="mt-8 flex flex-wrap gap-2">
            {children.map((child) => {
              const active = child.id === selected?.id;
              return (
                <button
                  key={child.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setSelectedId(child.id)}
                  className={active
                    ? "flex min-h-11 items-center gap-2 rounded-full bg-primary px-4 text-sm text-primary-foreground"
                    : "flex min-h-11 items-center gap-2 rounded-full border border-border bg-surface px-4 text-sm text-muted"}
                >
                  <Initials letters={child.name.slice(0, 1)} />
                  {child.name}
                </button>
              );
            })}
          </div>

          {selected ? (
            <>
            <section className="mt-6">
              <div className="rounded-2xl border border-border bg-surface p-6 shadow-[var(--shadow-border)]">
                <div className="flex items-start gap-4">
                  <span className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <HeartHandshake className="size-5" />
                  </span>
                  <div>
                    <p className="font-display text-2xl">{selected.name}</p>
                    <p className="mt-1 text-xs text-subtle">
                      {selected.level ? `Niveau ${selected.level}` : "Niveau non renseigné"}
                    </p>
                  </div>
                </div>

                <div className="mt-7 grid gap-3 sm:grid-cols-3">
                  <Metric label="Activités · 7 jours" value={String(selected.activitiesThisWeek)} />
                  <Metric label="Parole observée" value={`${selected.speakingMinutes} min`} />
                  <Metric label="Dernière activité" value={relative(selected.lastActivity)} />
                </div>
              </div>

              <Surface className="mt-4">
                <Eyebrow>Planning pédagogique</Eyebrow>
                <h2 className="mt-2 font-display text-2xl tracking-tight">
                  Les séances réellement programmées
                </h2>
                <p className="mt-2 text-sm leading-6 text-muted">
                  Une séance planifiée indique une date de travail. Elle ne certifie
                  pas la présence de l’apprenant.
                </p>
                {sessionsLoading ? (
                  <p className="mt-4 text-sm text-muted">Lecture du planning…</p>
                ) : sessions.length === 0 ? (
                  <p className="mt-4 rounded-xl border border-dashed border-border p-4 text-sm leading-6 text-muted">
                    Aucune séance programmée pour le moment.
                  </p>
                ) : (
                  <ul className="mt-4 space-y-2">
                    {sessions.slice(0, 6).map((session) => (
                      <li key={session.id} className="rounded-xl border border-border bg-surface-2/30 p-4">
                        <p className="font-medium">{session.title}</p>
                        <p className="mt-1 text-xs text-muted">
                          {new Date(session.startsAt).toLocaleString("fr-FR", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })} · {session.durationMinutes} min · {session.teacherName}
                        </p>
                        {session.notes ? (
                          <p className="mt-2 text-xs leading-5 text-subtle">{session.notes}</p>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                )}
              </Surface>
            </section>
            <LearnerDetail learnerUserId={selected.id} role="guardian" />
            </>
          ) : null}
        </>
      )}
    </Page>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface-2/50 p-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-subtle">{label}</p>
      <p className="mt-2 font-display text-xl tabular-nums">{value}</p>
    </div>
  );
}
