import { useEffect, useState } from "react";
import { Check, LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import {
  getLearningFeedbackBundleOnServer,
  saveLearningFeedbackOnServer,
} from "@/lib/blossom/domain.api";
import type { LearningFeedbackBundle } from "@/lib/blossom/learning-feedback.server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eyebrow, Surface } from "@/components/app/primitives";

export function LearningFeedbackPanel({ learnerUserId }: { learnerUserId: string }) {
  const [items, setItems] = useState<LearningFeedbackBundle[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");

  async function load() {
    setLoading(true);
    try {
      const rows = await getLearningFeedbackBundleOnServer({ data: { learnerUserId, limit: 18 } });
      setItems(rows);
      setDrafts(Object.fromEntries(rows.map((row) => [row.submissionId, row.feedback?.body ?? ""])));
    } catch {
      setItems([]);
      toast("Les productions pédagogiques ne sont pas disponibles.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [learnerUserId]);

  async function save(item: LearningFeedbackBundle) {
    const body = drafts[item.submissionId]?.trim() ?? "";
    if (!body || busy) return;
    setBusy(item.submissionId);
    try {
      await saveLearningFeedbackOnServer({
        data: {
          submissionId: item.submissionId,
          learnerUserId,
          body,
        },
      });
      toast("Retour enseignant enregistré.");
      await load();
    } catch {
      toast("Le retour n’a pas été enregistré.");
    } finally {
      setBusy("");
    }
  }

  return (
    <Surface>
      <Eyebrow>Retour pédagogique</Eyebrow>
      <h3 className="mt-1 font-display text-xl">Sur les productions réelles</h3>
      <p className="mt-2 text-sm leading-6 text-muted">
        Le retour est saisi par l’enseignant et rattaché à une production précise.
        K’Osez ne transforme pas cette note en score automatique.
      </p>

      {loading ? (
        <div className="mt-5 flex items-center gap-2 text-sm text-muted">
          <LoaderCircle className="size-4 animate-spin" /> Chargement…
        </div>
      ) : items.length === 0 ? (
        <p className="mt-5 text-sm text-muted">Aucune production à commenter.</p>
      ) : (
        <div className="mt-5 space-y-5">
          {items.slice(0, 8).map((item) => (
            <article key={item.submissionId} className="rounded-2xl border border-border bg-surface-2/35 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{item.taskId}</p>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    <Badge variant="outline">{item.kind}</Badge>
                    <span className="text-[11px] text-subtle">
                      {new Date(item.createdAt).toLocaleString("fr-FR", { dateStyle: "medium" })}
                    </span>
                  </div>
                </div>
                {item.feedback ? <Check className="size-4 text-primary" aria-label="Retour déjà enregistré" /> : null}
              </div>
              <p className="mt-3 max-h-28 overflow-hidden whitespace-pre-wrap text-sm leading-6 text-muted">
                {item.content}
              </p>
              <textarea
                value={drafts[item.submissionId] ?? ""}
                onChange={(event) => setDrafts((current) => ({ ...current, [item.submissionId]: event.target.value }))}
                maxLength={4000}
                rows={3}
                className="mt-3 min-h-20 w-full resize-y rounded-xl border border-border bg-bg p-3 text-sm leading-6"
                placeholder="Retour concret : ce qui tient, ce qui est à retravailler, le prochain geste."
                aria-label={"Retour pour " + item.taskId}
              />
              <Button
                className="mt-2"
                variant="secondary"
                disabled={!drafts[item.submissionId]?.trim() || busy === item.submissionId}
                onClick={() => void save(item)}
              >
                {busy === item.submissionId ? "Enregistrement…" : item.feedback ? "Mettre à jour le retour" : "Enregistrer le retour"}
              </Button>
            </article>
          ))}
        </div>
      )}
    </Surface>
  );
}
