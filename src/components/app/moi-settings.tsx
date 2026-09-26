import { useEffect, useState } from "react";
import { Check, Settings2 } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Eyebrow, Surface } from "@/components/app/primitives";
import { LANGUAGE_MODULES } from "@/lib/blossom/data";
import {
  getNotificationPreferencesOnServer,
  setNotificationPreferenceOnServer,
} from "@/lib/blossom/domain.api";
import { useBlossom } from "@/lib/blossom/store";

const NOTIFICATION_LABELS = {
  homework: "Devoirs",
  booking: "Réservations",
  event: "Rencontres & événements",
  tandem: "Tandem",
  learning: "Apprentissage",
  communication: "Messages",
} as const;

type NotificationKey = keyof typeof NOTIFICATION_LABELS;

export function MoiSettings() {
  const learner = useBlossom((s) => s.learner);
  const updateLearner = useBlossom((s) => s.updateLearner);
  const languageId = useBlossom((s) => s.languageId);
  const setLanguage = useBlossom((s) => s.setLanguage);
  const tandemOpen = useBlossom((s) => s.tandemOpen);
  const setTandemOpen = useBlossom((s) => s.setTandemOpen);
  const exportConsent = useBlossom((s) => s.exportConsent);
  const setExportConsent = useBlossom((s) => s.setExportConsent);
  const [draft, setDraft] = useState(learner);
  const [notificationPreferences, setNotificationPreferences] = useState<Record<NotificationKey, boolean>>({
    homework: true,
    booking: true,
    event: true,
    tandem: true,
    learning: true,
    communication: true,
  });
  const [notificationLoading, setNotificationLoading] = useState(true);
  const [notificationBusy, setNotificationBusy] = useState<NotificationKey | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => setDraft(learner), [learner]);

  useEffect(() => {
    let disposed = false;
    void getNotificationPreferencesOnServer()
      .then((prefs) => {
        if (!disposed) setNotificationPreferences(prefs);
      })
      .catch(() => {
        // Defaults remain enabled when preference storage is unavailable.
      })
      .finally(() => {
        if (!disposed) setNotificationLoading(false);
      });
    return () => {
      disposed = true;
    };
  }, []);

  async function toggleNotification(kind: NotificationKey) {
    if (notificationBusy) return;
    const next = !notificationPreferences[kind];
    setNotificationBusy(kind);
    try {
      const prefs = await setNotificationPreferenceOnServer({
        data: { kind, enabled: next },
      });
      setNotificationPreferences(prefs);
    } catch {
      // Keep the confirmed server state; do not render a failed toggle as saved.
    } finally {
      setNotificationBusy(null);
    }
  }

  function save() {
    updateLearner({
      firstName: draft.firstName.trim(),
      lastName: draft.lastName.trim(),
      goal: draft.goal.trim(),
      interests: draft.interests.map((item) => item.trim()).filter(Boolean).slice(0, 8),
      practiceWindow: draft.practiceWindow.trim(),
      coach: draft.coach.trim() || "Léo",
      coachVoice: draft.coachVoice.trim() || learner.coachVoice,
      city: draft.city.trim() || learner.city,
      avatar: draft.avatar.trim(),
    });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1800);
  }

  return (
    <section className="mt-6">
      <Surface className="!p-5 sm:!p-6">
        <div className="flex items-start gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Settings2 className="size-4" />
          </span>
          <div>
            <Eyebrow>Identité & préférences</Eyebrow>
            <h2 className="mt-1 font-display text-2xl">Votre espace, vraiment à vous.</h2>
            <p className="mt-1 text-sm leading-6 text-muted">
              Ces choix alimentent les missions, les échanges et la personnalisation. Ils sont enregistrés dans votre profil durable.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Field label="Prénom" value={draft.firstName} onChange={(value) => setDraft({ ...draft, firstName: value })} />
          <Field label="Nom" value={draft.lastName} onChange={(value) => setDraft({ ...draft, lastName: value })} />
          <Field label="Ville" value={draft.city} onChange={(value) => setDraft({ ...draft, city: value })} />
          <Field label="Créneau de pratique" value={draft.practiceWindow} placeholder="Ex. mardi / jeudi, 18h" onChange={(value) => setDraft({ ...draft, practiceWindow: value })} />
          <Field label="Objectif" value={draft.goal} multiline placeholder="Ce que vous voulez pouvoir faire en anglais…" onChange={(value) => setDraft({ ...draft, goal: value })} />
          <Field label="Intérêts" value={draft.interests.join(", ")} multiline placeholder="Cuisine, randonnée, travail…" onChange={(value) => setDraft({ ...draft, interests: value.split(",") })} />
          <label className="block">
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-subtle">Langue cible</span>
            <select
              className="mt-2 h-11 w-full rounded-xl border border-border bg-bg px-3 text-sm outline-none focus:border-primary/50"
              value={languageId}
              onChange={(event) => setLanguage(event.target.value)}
            >
              {LANGUAGE_MODULES.map((language) => <option key={language.id} value={language.id}>{language.name}</option>)}
            </select>
          </label>
          <Field label="Niveau" value={draft.level} placeholder="A2, A2+, B1…" onChange={(value) => setDraft({ ...draft, level: value })} />
          <Field label="Coach" value={draft.coach} onChange={(value) => setDraft({ ...draft, coach: value })} />
          <Field label="Voix du coach" value={draft.coachVoice} multiline onChange={(value) => setDraft({ ...draft, coachVoice: value })} />
          <Field label="Avatar (URL)" value={draft.avatar} placeholder="https://…" onChange={(value) => setDraft({ ...draft, avatar: value })} />
        </div>

        <div className="mt-6 rounded-2xl border border-border bg-surface-2/25 p-4 sm:p-5">
          <Eyebrow>Notifications dans K’Osez</Eyebrow>
          <h3 className="mt-1 font-display text-xl tracking-tight">Choisissez ce qui mérite de vous interrompre.</h3>
          <p className="mt-2 text-xs leading-5 text-muted">
            Ces réglages concernent uniquement les notifications in-app actuellement disponibles.
            Les alertes système liées à la sécurité et au compte restent toujours actives.
          </p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {(Object.keys(NOTIFICATION_LABELS) as NotificationKey[]).map((kind) => (
              <button
                key={kind}
                type="button"
                role="switch"
                aria-checked={notificationPreferences[kind]}
                aria-busy={notificationBusy === kind}
                disabled={notificationLoading || notificationBusy !== null}
                onClick={() => void toggleNotification(kind)}
                className="flex min-h-12 items-center justify-between gap-3 rounded-xl border border-border bg-bg/55 px-3 py-3 text-left transition hover:bg-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 disabled:opacity-60"
              >
                <span className="min-w-0">
                  <span className="block text-sm font-medium">{NOTIFICATION_LABELS[kind]}</span>
                  <span className="mt-0.5 block text-[11px] text-subtle">
                    {notificationPreferences[kind] ? "Activées" : "Désactivées"}
                  </span>
                </span>
                <span className={notificationPreferences[kind] ? "h-6 w-11 rounded-full bg-primary p-1" : "h-6 w-11 rounded-full bg-border p-1"}>
                  <span className={notificationPreferences[kind] ? "block size-4 translate-x-5 rounded-full bg-primary-foreground transition-transform" : "block size-4 rounded-full bg-bg transition-transform"} />
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Toggle
            label="Tandem ouvert"
            detail="Autoriser de nouvelles propositions de partenaire."
            checked={tandemOpen}
            onChange={setTandemOpen}
          />
          <Toggle
            label="Export audio"
            detail="Autoriser les futures fonctions d’export de vos propres prises."
            checked={exportConsent}
            onChange={setExportConsent}
          />
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <Button onClick={save}>{saved ? "Profil enregistré" : "Enregistrer mes préférences"} <Check className="size-4" /></Button>
          <Button asChild variant="secondary"><Link to="/learn/progress">Voir mes compétences</Link></Button>
        </div>
      </Surface>

      <nav className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4" aria-label="Accès rapides">
        <QuickLink to="/mission" label="Mission" />
        <QuickLink to="/osez" label="OSEZ" />
        <QuickLink to="/pronlab" label="Pron’Lab" />
        <QuickLink to="/learn/review" label="Réviser" />
        <QuickLink to="/library" label="Bibliothèque" />
        <QuickLink to="/explore" label="EXPLORE" />
        <QuickLink to="/connect" label="CONNECT" />
        <QuickLink to="/learn/history" label="Historique" />
      </nav>
    </section>
  );
}

function Field({
  label,
  value,
  placeholder,
  multiline,
  onChange,
}: {
  label: string;
  value: string;
  placeholder?: string;
  multiline?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label className={multiline ? "block sm:col-span-2" : "block"}>
      <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-subtle">{label}</span>
      {multiline ? (
        <textarea value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} className="mt-2 min-h-24 w-full rounded-xl border border-border bg-bg px-3 py-3 text-sm leading-6 outline-none focus:border-primary/50" />
      ) : (
        <input value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-border bg-bg px-3 text-sm outline-none focus:border-primary/50" />
      )}
    </label>
  );
}

function Toggle({
  label,
  detail,
  checked,
  onChange,
}: {
  label: string;
  detail: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)} className="flex items-start justify-between gap-4 rounded-2xl border border-border bg-surface-2/30 p-4 text-left">
      <span>
        <span className="block text-sm font-medium">{label}</span>
        <span className="mt-1 block text-xs leading-5 text-muted">{detail}</span>
      </span>
      <span className={checked ? "mt-0.5 h-6 w-11 rounded-full bg-primary p-1" : "mt-0.5 h-6 w-11 rounded-full bg-border p-1"}>
        <span className={checked ? "block size-4 translate-x-5 rounded-full bg-primary-foreground transition-transform" : "block size-4 rounded-full bg-bg transition-transform"} />
      </span>
    </button>
  );
}

function QuickLink({ to, label }: { to: string; label: string }) {
  return <Link to={to as never} className="rounded-xl border border-border bg-surface px-3 py-3 text-center text-xs font-semibold uppercase tracking-[0.12em] text-muted transition hover:border-primary/25 hover:text-primary">{label}</Link>;
}
