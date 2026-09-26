import { useEffect, useState } from "react";
import { ArrowUpRight, Circle, LoaderCircle } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Eyebrow, Surface } from "@/components/app/primitives";
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

  return (
    <Surface className="mt-5 !p-0 overflow-hidden">
      <div className="border-b border-border p-5 sm:p-6">
        <Eyebrow>Preuves</Eyebrow>
        <h2 className="mt-2 font-display text-2xl tracking-tight">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-muted">{description}</p>
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
      ) : items.length === 0 ? (
        <div className="p-6 text-sm leading-6 text-muted">
          Aucune preuve enregistrée pour ce compte.
        </div>
      ) : (
        <ol className="divide-y divide-border/60">
          {items.map((item) => (
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
                        <span className="text-[11px] text-subtle">
                          {new Date(item.at).toLocaleString("fr-FR", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </span>
                      </div>
                    </div>
                    {item.route ? (
                      <Link
                        to={item.route as never}
                        className="inline-flex min-h-8 items-center gap-1 rounded-lg px-2 text-[10px] font-semibold uppercase tracking-[0.13em] text-primary hover:bg-primary/10"
                      >
                        Ouvrir <ArrowUpRight className="size-3.5" />
                      </Link>
                    ) : null}
                  </div>
                  <p className="mt-3 text-sm leading-6 text-muted">{item.summary}</p>
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
