import { useEffect, useState } from "react";
import { ArrowUpRight, Check, LoaderCircle } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { getLearnerFeedbackOnServer } from "@/lib/blossom/domain.api";
import type { LearningFeedbackRow } from "@/lib/blossom/learning-feedback.server";
import { Badge } from "@/components/ui/badge";
import { Eyebrow, Surface } from "@/components/app/primitives";

export function LearnerFeedback({
  learnerUserId,
}: {
  learnerUserId?: string;
}) {
  const [items, setItems] = useState<LearningFeedbackRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let disposed = false;
    setLoading(true);
    setError(false);
    void getLearnerFeedbackOnServer({
      data: { learnerUserId, limit: 18 },
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
  }, [learnerUserId]);

  return (
    <Surface className="mt-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Eyebrow>Retour pédagogique</Eyebrow>
          <h2 className="mt-1 font-display text-2xl tracking-tight">
            Ce qu’un enseignant a réellement observé
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            Ces retours sont attachés à des productions précises. Ils ne sont
            pas convertis automatiquement en score.
          </p>
        </div>
        <Check className="size-4 text-primary" />
      </div>

      {loading ? (
        <div className="mt-5 flex items-center gap-2 text-sm text-muted">
          <LoaderCircle className="size-4 animate-spin" />
          Lecture des retours…
        </div>
      ) : error ? (
        <p className="mt-5 text-sm leading-6 text-muted">
          Les retours pédagogiques ne sont pas disponibles pour le moment.
        </p>
      ) : items.length === 0 ? (
        <p className="mt-5 text-sm leading-6 text-muted">
          Aucun retour enseignant n’est encore enregistré.
        </p>
      ) : (
        <div className="mt-5 space-y-3">
          {items.map((item) => (
            <article
              key={item.id}
              className="rounded-xl border border-border bg-surface-2/35 p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">Production</Badge>
                  <span className="text-[11px] text-subtle">
                    {new Date(item.updatedAt).toLocaleString("fr-FR", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </span>
                </div>
                <Link
                  to="/learn/labs"
                  className="inline-flex min-h-8 items-center gap-1 rounded-lg px-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-primary hover:bg-primary/10"
                >
                  Ouvrir LEARN <ArrowUpRight className="size-3.5" />
                </Link>
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-fg">
                {item.body}
              </p>
              <p className="mt-2 truncate text-[11px] text-subtle">
                Preuve · {item.submissionId}
              </p>
            </article>
          ))}
        </div>
      )}
    </Surface>
  );
}
