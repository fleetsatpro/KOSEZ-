import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, Circle, LoaderCircle } from "lucide-react";
import { Eyebrow, Surface } from "@/components/app/primitives";
import { MINERAL_DEFINITIONS, type MineralKey } from "@/lib/blossom/organism";
import { Badge } from "@/components/ui/badge";
import { getEvidenceTimelineOnServer } from "@/lib/blossom/domain.api";
import type { EvidenceTimelineItem } from "@/lib/blossom/evidence.server";

const CLASS_LABEL: Record<EvidenceTimelineItem["evidenceClass"], string> = {
  action: "Action",
  artifact: "Trace",
  observation: "Observation",
  plan: "Plan",
};

export function EvidenceTimeline({
  learnerUserId,
  title = "Fil de preuves",
  description = "Une vue chronologique des preuves réellement enregistrées.",
  limit = 40,
}: {
  learnerUserId?: string;
  title?: string;
  description?: string;
  limit?: number;
}) {
  const [items, setItems] = useState<EvidenceTimelineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [mineralFilter, setMineralFilter] = useState<MineralKey | "all">("all");
  const [classFilter, setClassFilter] = useState<"all" | EvidenceTimelineItem["evidenceClass"]>("all");

  useEffect(() => {
    let disposed = false;
    setLoading(true);
    setError(false);
    void getEvidenceTimelineOnServer({
      data: { learnerUserId, limit },
    })
      .then((rows) => {
        if (!disposed) setItems(rows);
      })
      .catch(() => {
        if (!disposed) {
          setItems([]);
          setError(true);
        }
      })
      .finally(() => {
        if (!disposed) setLoading(false);
      });
    return () => {
      disposed = true;
    };
  }, [learnerUserId, limit]);

  const filtered = useMemo(
    () => items.filter((item) => (mineralFilter === "all" || item.mineral === mineralFilter) && (classFilter === "all" || item.evidenceClass === classFilter)),
    [items, mineralFilter, classFilter],
  );

  return (
    <Surface className="mt-5 !p-0 overflow-hidden">
      <div className="border-b border-border p-5 sm:p-6">
        <Eyebrow>Preuves</Eyebrow>
        <h2 className="mt-2 font-display text-2xl tracking-tight">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-muted">{description}</p>
      </div>

      <div className="border-b border-border/60 px-5 py-4 sm:px-6">
        <div className="flex flex-wrap items-center gap-2" aria-label="Filtres de preuves">
          <button type="button" onClick={() => setMineralFilter("all")} className={`rounded-full border px-3 py-1.5 text-[11px] ${mineralFilter === "all" ? "border-primary/30 bg-primary/10 text-primary" : "border-border text-muted"}`}>Tout</button>
          {(Object.keys(MINERAL_DEFINITIONS) as MineralKey[]).map((key) => (
            <button key={key} type="button" onClick={() => setMineralFilter(key)} className={`rounded-full border px-3 py-1.5 text-[11px] ${mineralFilter === key ? "border-primary/30 bg-primary/10 text-primary" : "border-border text-muted"}`}>{MINERAL_DEFINITIONS[key].label}</button>
          ))}
          <span className="mx-1 hidden h-4 w-px bg-border sm:block" />
          <select value={classFilter} onChange={(event) => setClassFilter(event.target.value as typeof classFilter)} className="h-8 rounded-full border border-border bg-bg px-3 text-[11px] text-muted" aria-label="Type de preuve">
            <option value="all">Toutes les classes</option>
            <option value="action">Action</option><option value="artifact">Trace</option><option value="observation">Observation</option><option value="plan">Plan</option>
          </select>
        </div>
        <p className="mt-3 text-[11px] text-subtle">{filtered.length} preuve{filtered.length === 1 ? "" : "s"} visible{filtered.length === 1 ? "" : "s"}. Un plan n’est jamais présenté comme une preuve d’action.</p>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 p-6 text-sm text-muted">
          <LoaderCircle className="size-4 animate-spin" />
          Lecture des preuves autorisées…
        </div>
      ) : error ? (
        <div className="p-6 text-sm leading-6 text-muted">
          Le fil de preuves n’est pas disponible pour le moment. Rien n’est
          présenté comme confirmé lorsque la source n’a pas répondu.
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-6 text-sm leading-6 text-muted">
          {items.length === 0 ? "Aucune preuve enregistrée pour ce compte." : "Aucune trace ne correspond à ce filtre. Revenez à « Tout » pour revoir l’ensemble du parcours."}
        </div>
      ) : (
        <ol className="divide-y divide-border/60">
          {filtered.map((item) => (
            <li key={item.id} className="p-5 sm:p-6">
              <div className="flex gap-3">
                <span className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Circle className="size-2.5 fill-current" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">{item.title}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <Badge variant="outline">{CLASS_LABEL[item.evidenceClass]}</Badge>
                        {item.mineral ? <Badge className="border-primary/20 bg-primary/5 text-primary">{MINERAL_DEFINITIONS[item.mineral].label}</Badge> : <Badge variant="outline">Aucun minéral</Badge>}
                        <span className="text-[11px] text-subtle">
                          {new Date(item.at).toLocaleString("fr-FR", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </span>
                      </div>
                    </div>
                    {item.route ? (
                      <a
                        href={item.route}
                        className="inline-flex min-h-8 items-center gap-1 rounded-lg px-2 text-[10px] font-semibold uppercase tracking-[0.13em] text-primary hover:bg-primary/10"
                      >
                        {item.actionLabel} <ArrowUpRight className="size-3.5" />
                      </a>
                    ) : null}
                  </div>
                  <p className="mt-3 text-sm leading-6 text-muted">{item.summary}</p>
                  {item.mineral ? <p className="mt-2 text-[11px] leading-5 text-subtle">Nourrit · {MINERAL_DEFINITIONS[item.mineral].label} · {MINERAL_DEFINITIONS[item.mineral].purpose}</p> : null}
                  {item.sourceId ? (
                    <p className="mt-2 truncate text-[11px] text-subtle">
                      Source · {item.sourceId}
                    </p>
                  ) : null}
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}
    </Surface>
  );
}
