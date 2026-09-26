import { useEffect, useState } from "react";
import { LoaderCircle, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import {
  getAdminMessageReportsOnServer,
  updateAdminMessageReportOnServer,
} from "@/lib/blossom/domain.api";
import { Badge } from "@/components/ui/badge";
import { Eyebrow, Surface } from "@/components/app/primitives";

type MessageReport = Awaited<ReturnType<typeof getAdminMessageReportsOnServer>>[number];

export function AdminMessageReports() {
  const [rows, setRows] = useState<MessageReport[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try { setRows(await getAdminMessageReportsOnServer()); }
    catch { setRows([]); }
    finally { setLoading(false); }
  }

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(), 15000);
    return () => window.clearInterval(timer);
  }, []);

  async function move(row: MessageReport, status: "reviewing" | "resolved" | "dismissed") {
    try {
      const result = await updateAdminMessageReportOnServer({ data: { reportId: row.id, status } });
      setRows((current) => current.map((item) => item.id === row.id ? { ...item, status: result.status } : item));
      toast(status === "reviewing" ? "Signalement passé en revue." : "Signalement clôturé.");
    } catch { toast("La mise à jour du signalement a échoué."); }
  }

  return (
    <section className="mt-5">
      <Surface>
        <div className="flex items-start gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <ShieldAlert className="size-4" />
          </span>
          <div>
            <Eyebrow>Sécurité · messages</Eyebrow>
            <h2 className="mt-2 font-display text-2xl">Signalements à traiter</h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              Les messages signalés entrent dans un circuit de revue explicite. Les décisions sont journalisées.
            </p>
          </div>
        </div>
        {loading ? (
          <div className="mt-5 flex items-center gap-2 text-sm text-muted"><LoaderCircle className="size-4 animate-spin" /> Chargement…</div>
        ) : rows.length === 0 ? (
          <p className="mt-5 text-sm text-muted">Aucun signalement de message.</p>
        ) : (
          <div className="mt-5 space-y-3">
            {rows.slice(0, 20).map((row) => (
              <article key={row.id} className="rounded-xl border border-border bg-surface-2/30 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <Badge variant="outline">{row.status}</Badge>
                    <p className="mt-2 text-sm font-medium">{row.reason}</p>
                    <p className="mt-1 text-xs text-subtle">Message · {row.messageId ?? "supprimé"}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {row.status === "open" ? <button type="button" onClick={() => void move(row, "reviewing")} className="min-h-9 rounded-lg border border-border px-3 text-xs">Prendre en revue</button> : null}
                    {row.status === "reviewing" ? <>
                      <button type="button" onClick={() => void move(row, "resolved")} className="min-h-9 rounded-lg border border-border px-3 text-xs">Résoudre</button>
                      <button type="button" onClick={() => void move(row, "dismissed")} className="min-h-9 rounded-lg border border-border px-3 text-xs">Classer</button>
                    </> : null}
                  </div>
                </div>
                {row.messageBody ? <p className="mt-3 rounded-lg border border-border/60 bg-bg p-3 text-sm leading-6">{row.messageBody}</p> : null}
              </article>
            ))}
          </div>
        )}
      </Surface>
    </section>
  );
}
