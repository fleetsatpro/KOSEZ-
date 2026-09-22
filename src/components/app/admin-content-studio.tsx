import { useEffect, useMemo, useState } from "react";
import { Check, FileEdit, Globe2, Save, Send, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eyebrow, Surface } from "@/components/app/primitives";
import {
  getAdminContentItemsOnServer,
  publishAdminContentOnServer,
  archiveAdminContentOnServer,
  saveAdminContentDraftOnServer,
  getAdminContentHistoryOnServer,
  restoreAdminContentDraftOnServer,
} from "@/lib/blossom/content.api";
import type { AdminContentItem } from "@/lib/blossom/content.server";

type Scalar = string | number | boolean | null;

const EVENT_FIELDS = [
  ["title", "Titre", false], ["blurb", "Résumé", true], ["date", "Date (YYYY-MM-DD)", false],
  ["time", "Heure (HH:MM)", false], ["place", "Lieu", false], ["language", "Langue / niveau", false],
  ["spots", "Capacité", false], ["image", "Image", false], ["host", "Hôte", false],
] as const;

const CATALOGUE_FIELDS = [
  ["title", "Titre", false], ["description", "Description", true], ["language", "Langue", false],
  ["level", "Niveau", false], ["format", "Format", false], ["instructor", "Intervenant", false],
  ["location", "Lieu", false], ["capacity", "Capacité", false], ["schedule", "Planning", false],
  ["price", "Prix / modalité", false], ["image", "Image", false],
] as const;

function Field({ label, value, multiline, numeric, onChange }: {
  label: string; value: Scalar; multiline?: boolean; numeric?: boolean; onChange: (value: string) => void;
}) {
  const textValue = value == null ? "" : String(value);
  return (
    <label className={multiline ? "block sm:col-span-2" : "block"}>
      <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-subtle">{label}</span>
      {multiline ? (
        <textarea className="mt-2 min-h-24 w-full rounded-xl border border-border bg-bg px-3 py-3 text-sm leading-6 outline-none focus:border-primary/50" value={textValue} onChange={(event) => onChange(event.target.value)} />
      ) : (
        <input className="mt-2 h-11 w-full rounded-xl border border-border bg-bg px-3 text-sm outline-none focus:border-primary/50" type={numeric ? "number" : "text"} value={textValue} onChange={(event) => onChange(event.target.value)} />
      )}
    </label>
  );
}

export function AdminContentStudio() {
  const [items, setItems] = useState<AdminContentItem[]>([]);
  const [selectedKey, setSelectedKey] = useState("");
  const [draft, setDraft] = useState<Record<string, Scalar>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<Awaited<ReturnType<typeof getAdminContentHistoryOnServer>>>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const selected = useMemo(() => items.find((item) => item.contentKey === selectedKey) ?? items[0], [items, selectedKey]);

  useEffect(() => {
    let disposed = false;
    void getAdminContentItemsOnServer()
      .then((rows) => { if (!disposed) { setItems(rows); setSelectedKey((current) => current || rows[0]?.contentKey || ""); } })
      .catch(() => { if (!disposed) setError("Impossible de charger le registre éditorial."); })
      .finally(() => { if (!disposed) setLoading(false); });
    return () => { disposed = true; };
  }, []);

  useEffect(() => {
    if (!selected) return;
    setDraft({ ...selected.draftPayload });
    setHistoryLoading(true);
    void getAdminContentHistoryOnServer({ data: { contentKey: selected.contentKey } })
      .then(setHistory)
      .catch(() => setHistory([]))
      .finally(() => setHistoryLoading(false));
  }, [selected]);

  function createItem(kind: "event" | "catalogue", subtype: "course" | "immersion" = "course") {
    const token = typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().slice(0, 8)
      : String(Date.now());
    const id = (kind === "event" ? "evt-admin-" : "cat-admin-") + token;
    const baseDate = new Date(Date.now() + 7 * 86_400_000).toISOString().slice(0, 10);
    const item: AdminContentItem = kind === "event"
      ? {
          contentKey: id, kind, state: "fallback", draftRevision: 0, publishedRevision: 0,
          draftPayload: { id, title: "Nouvel événement", blurb: "", date: baseDate, time: "18:00", place: "", language: "English", spots: 8, image: "/images/cafe.jpg", host: "Équipe K'Osez" },
          publishedPayload: null, updatedBy: null, publishedBy: null, publishedAt: null, updatedAt: new Date().toISOString(),
        }
      : {
          contentKey: id, kind, state: "fallback", draftRevision: 0, publishedRevision: 0,
          draftPayload: subtype === "immersion"
            ? { id, kind: "immersion", title: "Nouvelle immersion", description: "", language: "English", level: "A2+", format: "Immersion", instructor: "Équipe K'Osez", location: "À définir", capacity: 10, schedule: "À définir", price: "Sur inscription", image: "/images/reunion-coast.jpg", early: false, companion: false }
            : { id, kind: "course", title: "Nouveau programme", description: "", language: "English", level: "A2", format: "Groupe", instructor: "Équipe K'Osez", location: "Maison K'Osez", capacity: 8, schedule: "À définir", price: "Sur inscription", image: "/images/atelier.jpg" },
          publishedPayload: null, updatedBy: null, publishedBy: null, publishedAt: null, updatedAt: new Date().toISOString(),
        };
    setItems((current) => [item, ...current]);
    setSelectedKey(id);
    toast("Nouveau brouillon créé. Enregistrez-le pour le rendre durable.");
  }

  async function restoreRevision(
    channel: "draft" | "published" | "archived",
    revision: number,
  ) {
    if (!selected) return;
    try {
      const result = await restoreAdminContentDraftOnServer({
        data: {
          contentKey: selected.contentKey,
          channel,
          revision,
          expectedDraftRevision: selected.draftRevision,
        },
      });
      const restoredHistory = await getAdminContentHistoryOnServer({
        data: { contentKey: selected.contentKey },
      });
      setDraft({ ...(selected.draftPayload as Record<string, Scalar>), ...restoredHistory[0]?.payload });
      setItems((current) =>
        current.map((item) =>
          item.contentKey === selected.contentKey
            ? {
                ...item,
                draftPayload: restoredHistory[0]?.payload ?? item.draftPayload,
                draftRevision: result.draftRevision,
                state: result.state,
              }
            : item,
        ),
      );
      setHistory(restoredHistory);
      toast(`Révision v${revision} restaurée comme brouillon.`);
    } catch {
      toast("La restauration a échoué. Vérifiez qu’aucune modification concurrente n’a été enregistrée.");
    }
  }

  async function save() {
    if (!selected) return;
    setSaving(true);
    try {
      if (selected.kind === "event") {
        const payload = {
          id: selected.contentKey,
          title: String(draft.title ?? ""),
          blurb: String(draft.blurb ?? ""),
          date: String(draft.date ?? ""),
          time: String(draft.time ?? ""),
          place: String(draft.place ?? ""),
          language: String(draft.language ?? ""),
          spots: Number(draft.spots ?? 0),
          image: String(draft.image ?? ""),
          host: String(draft.host ?? ""),
        };
        const result = await saveAdminContentDraftOnServer({
          data: {
            kind: "event",
            contentKey: selected.contentKey,
            payload,
            expectedDraftRevision: selected.draftRevision,
          },
        });
        setItems((current) =>
          current.map((item) =>
            item.contentKey === selected.contentKey
              ? { ...item, draftPayload: payload, draftRevision: result.draftRevision, state: result.state }
              : item,
          ),
        );
        toast("Brouillon événement enregistré.");
        return;
      }

      const payload = {
        id: selected.contentKey,
        kind:
          String(draft.kind ?? selected.draftPayload.kind) as
            | "course"
            | "individual"
            | "group"
            | "immersion"
            | "workshop"
            | "event"
            | "pronlab",
        title: String(draft.title ?? ""),
        description: String(draft.description ?? ""),
        language: String(draft.language ?? ""),
        level: String(draft.level ?? ""),
        format: String(draft.format ?? ""),
        instructor: String(draft.instructor ?? ""),
        location: String(draft.location ?? ""),
        capacity: Number(draft.capacity ?? 0),
        schedule: String(draft.schedule ?? ""),
        price: String(draft.price ?? ""),
        image: String(draft.image ?? ""),
        ...(draft.kind === "immersion"
          ? {
              early: draft.early === true,
              companion: draft.companion === true,
            }
          : {}),
      };
      const result = await saveAdminContentDraftOnServer({
        data: {
          kind: "catalogue",
          contentKey: selected.contentKey,
          payload,
          expectedDraftRevision: selected.draftRevision,
        },
      });
      setItems((current) =>
        current.map((item) =>
          item.contentKey === selected.contentKey
            ? { ...item, draftPayload: payload, draftRevision: result.draftRevision, state: "draft" }
            : item,
        ),
      );
      toast("Brouillon programme enregistré.");
    } catch {
      toast("Le brouillon n’a pas pu être enregistré.");
    } finally { setSaving(false); }
  }

  async function archive() {
    if (!selected || selected.state !== "published") return;
    try {
      await archiveAdminContentOnServer({
        data: {
          contentKey: selected.contentKey,
          expectedPublishedRevision: selected.publishedRevision,
        },
      });
      setItems((current) =>
        current.map((item) =>
          item.contentKey === selected.contentKey
            ? { ...item, state: "archived" }
            : item,
        ),
      );
      toast("Contenu archivé.");
    } catch {
      toast("L’archivage a échoué. Le contenu publié reste inchangé.");
    }
  }

  async function publish() {
    if (!selected) return;
    setPublishing(true);
    try {
      const result = await publishAdminContentOnServer({
        data: {
          contentKey: selected.contentKey,
          expectedDraftRevision: selected.draftRevision,
        },
      });
      setItems((current) => current.map((item) => item.contentKey === selected.contentKey ? { ...item, publishedPayload: { ...draft }, publishedRevision: result.publishedRevision, state: "published", publishedAt: new Date().toISOString() } : item));
      toast("Publication confirmée.");
    } catch {
      toast("La publication a échoué. Le brouillon reste intact.");
    } finally { setPublishing(false); }
  }

  function updateField(key: string, value: string) {
    const numeric = key === "spots" || key === "capacity";
    setDraft((current) => ({ ...current, [key]: numeric && value !== "" ? Number(value) : value }));
  }

  if (loading) return <Surface className="mt-5"><p className="text-sm text-muted">Chargement du registre éditorial…</p></Surface>;
  if (error) return <Surface className="mt-5"><p className="text-sm text-muted">{error}</p></Surface>;
  if (!selected) return <Surface className="mt-5"><Eyebrow>Éditorial</Eyebrow><p className="mt-2 font-display text-2xl">Aucun contenu géré.</p></Surface>;

  const fields = selected.kind === "event" ? EVENT_FIELDS : CATALOGUE_FIELDS;
  const changed = JSON.stringify(draft) !== JSON.stringify(selected.draftPayload);

  return (
    <section className="mt-5">
      <div className="grid gap-5 lg:grid-cols-[19rem_minmax(0,1fr)]">
        <Surface className="!p-4">
          <div className="flex items-start justify-between gap-3">
            <div><Eyebrow>Éditorial</Eyebrow><h2 className="mt-2 font-display text-2xl">Registre</h2></div>
            <FileEdit className="size-4 text-primary" />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Button size="sm" variant="secondary" onClick={() => createItem("event")}>+ Événement</Button>
            <Button size="sm" variant="secondary" onClick={() => createItem("catalogue", "course")}>+ Programme</Button>
            <Button size="sm" variant="secondary" onClick={() => createItem("catalogue", "immersion")}>+ Immersion</Button>
          </div>
          <div className="mt-5 space-y-2">{items.map((item) => (
            <button key={item.contentKey} type="button" onClick={() => setSelectedKey(item.contentKey)} className={item.contentKey === selected.contentKey ? "w-full rounded-xl border border-primary/30 bg-primary/5 p-3 text-left" : "w-full rounded-xl border border-border bg-surface-2/40 p-3 text-left hover:bg-surface-2/70"}>
              <div className="flex items-center justify-between gap-2"><span className="truncate text-sm font-medium">{String(item.draftPayload.title ?? item.contentKey)}</span><Badge variant="outline">{item.kind}</Badge></div>
              <p className="mt-1 text-[11px] text-subtle">v{item.draftRevision} · publié v{item.publishedRevision}</p>
            </button>
          ))}</div>
        </Surface>

        <Surface className="!p-5 sm:!p-6">
          <div className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
            <div><div className="flex items-center gap-2"><Eyebrow>{selected.kind === "event" ? "Événement" : "Programme"}</Eyebrow><Badge variant={selected.state === "published" ? "default" : "outline"}>{selected.state}</Badge></div>
              <h3 className="mt-2 font-display text-3xl">{String(draft.title ?? selected.contentKey)}</h3>
              <p className="mt-1 text-xs text-subtle">{selected.contentKey} · brouillon v{selected.draftRevision}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" disabled={saving || publishing || !changed} onClick={save}><Save className="size-4" />{saving ? "Enregistrement…" : "Enregistrer"}</Button>
              <Button disabled={saving || publishing || changed || selected.state === "published" || selected.draftRevision <= 0} onClick={publish}><Send className="size-4" />{publishing ? "Publication…" : "Publier"}</Button><Button variant="outline" disabled={saving || publishing || changed || selected.state !== "published"} onClick={archive}>Archiver</Button>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">{fields.map(([key, label, multiline]) => <Field key={key} label={label} value={draft[key] ?? null} multiline={multiline} numeric={key === "spots" || key === "capacity"} onChange={(value) => updateField(key, value)} />)}</div>
          {selected.kind === "catalogue" && draft.kind === "immersion" ? (
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <label className="flex min-h-12 items-center gap-3 rounded-xl border border-border bg-surface-2/40 px-3">
                <input
                  type="checkbox"
                  checked={draft.early === true}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, early: event.target.checked }))
                  }
                />
                <span className="text-sm">Accès anticipé</span>
              </label>
              <label className="flex min-h-12 items-center gap-3 rounded-xl border border-border bg-surface-2/40 px-3">
                <input
                  type="checkbox"
                  checked={draft.companion === true}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, companion: event.target.checked }))
                  }
                />
                <span className="text-sm">Companion K’Osez</span>
              </label>
            </div>
          ) : null}

          <div className="mt-6 rounded-xl border border-border bg-surface-2/30 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <Eyebrow>Historique</Eyebrow>
                <p className="mt-1 text-sm text-muted">
                  {historyLoading ? "Chargement…" : `${history.length} révision${history.length > 1 ? "s" : ""}`}
                </p>
              </div>
              <ShieldCheck className="size-4 text-primary" />
            </div>
            {!historyLoading && history.length === 0 ? (
              <p className="mt-4 text-xs text-subtle">
                Les prochaines sauvegardes et publications seront archivées ici.
              </p>
            ) : (
              <ol className="mt-4 space-y-2">
                {history.slice(0, 8).map((entry) => (
                  <li key={entry.revisionId} className="flex flex-col gap-2 rounded-lg border border-border/70 bg-bg/40 px-3 py-2.5 sm:flex-row sm:items-center">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">v{entry.revision}</Badge>
                      <span className="text-xs uppercase tracking-[0.12em] text-subtle">{entry.channel}</span>
                      <span className="text-xs text-muted">
                        {new Date(entry.createdAt).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}
                      </span>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="sm:ml-auto"
                      disabled={saving || publishing || changed}
                      onClick={() => void restoreRevision(entry.channel, entry.revision)}
                    >
                      Restaurer comme brouillon
                    </Button>
                  </li>
                ))}
              </ol>
            )}
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <Status icon={FileEdit} label="Brouillon" value={"v" + selected.draftRevision} />
            <Status icon={Globe2} label="Publié" value={"v" + selected.publishedRevision} />
            <Status icon={ShieldCheck} label="Audit" value={selected.publishedAt ? "Traçable" : "En attente"} />
          </div>

          <div className="mt-5 rounded-xl border border-border bg-surface-2/40 p-4"><div className="flex items-start gap-3"><Check className="mt-0.5 size-4 text-primary" /><p className="text-xs leading-5 text-muted">Enregistrer crée un brouillon. Publier est une seconde action versionnée et auditée. Un échec de publication ne détruit pas le brouillon.</p></div></div>
        </Surface>
      </div>
    </section>
  );
}

function Status({ icon: Icon, label, value }: { icon: typeof FileEdit; label: string; value: string }) {
  return <div className="rounded-xl border border-border bg-surface-2/40 p-3"><div className="flex items-center gap-2 text-primary"><Icon className="size-3.5" /><span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-subtle">{label}</span></div><p className="mt-2 font-display text-lg">{value}</p></div>;
}