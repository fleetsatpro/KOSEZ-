import { useEffect, useState } from "react";
import { CheckCircle2, LoaderCircle, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import {
  getAdminSafetyCasesOnServer,
  updateAdminSafetyCaseOnServer,
} from "@/lib/blossom/domain.api";
import type { AdminSafetyCase } from "@/lib/blossom/safety.server";
import { Badge } from "@/components/ui/badge";
import { Eyebrow, Surface } from "@/components/app/primitives";

export function AdminSafetyQueue() {
  const [cases, setCases] = useState<AdminSafetyCase[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      setCases(await getAdminSafetyCasesOnServer());
    } catch {
      setCases([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(), 15_000);
    return () => window.clearInterval(timer);
  }, []);

  async function move(item: AdminSafetyCase, status: "reviewing" | "resolved" | "dismissed") {
    try {
      const result = await updateAdminSafetyCaseOnServer({
        data: {
          caseId: item.id,
          type: item.type,
          status,
        },
      });
      setCases((current) =>
        current.map((entry) =>
          entry.id === item.id && entry.type === item.type
            ? { ...entry, status: result.status, updatedAt: result.updatedAt }
            : entry,
        ),
      );
      toast(status === "reviewing" ? "Cas pris en revue." : "Cas de sécurité clôturé.");
    } catch {
      toast("La transition du cas n’a pas été enregistrée.");
    }
  }

  const openCount = cases.filter((item) => item.status === "open" || item.status === "reviewing").length;

  return (
    <Surface className="mt-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Eyebrow>Sécurité · centre de cas</Eyebrow>
          <h2 className="mt-2 font-display text-2xl tracking-tight">Signalements traçables</h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            Tandem et messagerie partagent le même circuit de revue. Chaque transition est autorisée côté serveur et journalisée.
          </p>
        </div>
        <Badge variant={openCount ? "clay" : "outline"}>
          {openCount} ouvert{openCount === 1 ? "" : "s"}
        </Badge>
      </div>

      {loading ? (
        <div className="mt-5 flex items-center gap-2 text-sm text-muted">
          <LoaderCircle className="size-4 animate-spin" /> Chargement des cas…
        </div>
      ) : cases.length === 0 ? (
        <div className="mt-5 rounded-xl border border-dashed border-border p-5">
          <CheckCircle2 className="size-4 text-primary" />
          <p className="mt-2 text-sm text-muted">Aucun signalement enregistré.</p>
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          {cases.slice(0, 50).map((item) => (
            <article key={item.type + ":" + item.id} className="rounded-xl border border-border bg-surface-2/30 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">{item.type === "tandem" ? "Tandem" : "Message"}</Badge>
                    <Badge variant="outline">{item.status}</Badge>
                  </div>
                  <p className="mt-2 text-sm font-medium">{item.reason}</p>
                  <p className="mt-1 text-[11px] text-subtle">
                    Auteur du signalement · {item.reporterUserId}
                  </p>
                  {item.subjectUserId ? (
                    <p className="mt-1 text-[11px] text-subtle">
                      Personne concernée · {item.subjectUserId}
                    </p>
                  ) : null}
                </div>

                <div className="flex flex-wrap gap-2">
                  {item.status === "open" ? (
                    <button
                      type="button"
                      onClick={() => void move(item, "reviewing")}
                      className="min-h-9 rounded-lg border border-border px-3 text-xs"
                    >
                      Prendre en revue
                    </button>
                  ) : null}
                  {item.status === "reviewing" ? (
                    <>
                      <button
                        type="button"
                        onClick={() => void move(item, "resolved")}
                        className="min-h-9 rounded-lg border border-border px-3 text-xs"
                      >
                        Résoudre
                      </button>
                      <button
                        type="button"
                        onClick={() => void move(item, "dismissed")}
                        className="min-h-9 rounded-lg border border-border px-3 text-xs"
                      >
                        Classer
                      </button>
                    </>
                  ) : null}
                </div>
              </div>

              {item.body ? (
                <div className="mt-3 flex gap-2 rounded-lg border border-border/60 bg-bg p-3">
                  <ShieldAlert className="mt-0.5 size-3.5 shrink-0 text-subtle" />
                  <p className="whitespace-pre-wrap text-sm leading-6">{item.body}</p>
                </div>
              ) : null}

              <p className="mt-3 text-[10px] uppercase tracking-[0.14em] text-subtle">
                Mis à jour · {new Date(item.updatedAt).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" })}
              </p>
            </article>
          ))}
        </div>
      )}
    </Surface>
  );
}
