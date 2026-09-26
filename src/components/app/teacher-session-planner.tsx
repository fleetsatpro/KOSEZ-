import { useEffect, useState } from "react";
import { CalendarClock, Clock3, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { calendarFilename, teacherSessionToIcs } from "@/lib/blossom/calendar";
import { Eyebrow, Surface } from "@/components/app/primitives";
import {
  cancelTeacherSessionOnServer,
  createTeacherSessionOnServer,
  getTeacherSessionsOnServer,
} from "@/lib/blossom/domain.api";

type TeacherRow = {
  id: string;
  name: string;
};

type Session = Awaited<ReturnType<typeof getTeacherSessionsOnServer>>[number];

function localDateTime(value: string) {
  return new Date(value).toLocaleString("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function downloadCalendar(session: Session) {
  const ics = teacherSessionToIcs(session);
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = calendarFilename(session.title);
  anchor.click();
  URL.revokeObjectURL(url);
}

export function TeacherSessionPlanner({ roster }: { roster: TeacherRow[] }) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [learnerUserId, setLearnerUserId] = useState(roster[0]?.id ?? "");
  const [title, setTitle] = useState("Séance de pratique");
  const [startsAt, setStartsAt] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("60");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setLearnerUserId((current) => current || roster[0]?.id || "");
  }, [roster]);

  useEffect(() => {
    let disposed = false;
    setLoading(true);
    void getTeacherSessionsOnServer({ data: { limit: 20 } })
      .then((rows) => {
        if (!disposed) setSessions(rows);
      })
      .catch(() => {
        if (!disposed) setSessions([]);
      })
      .finally(() => {
        if (!disposed) setLoading(false);
      });
    return () => {
      disposed = true;
    };
  }, []);

  async function schedule() {
    if (!learnerUserId || !title.trim() || !startsAt || busy) return;
    const parsed = new Date(startsAt);
    if (Number.isNaN(parsed.getTime())) {
      toast("La date de séance n’est pas valide.");
      return;
    }
    setBusy(true);
    try {
      const session = await createTeacherSessionOnServer({
        data: {
          learnerUserId,
          title: title.trim(),
          startsAt: parsed.toISOString(),
          durationMinutes: Number(durationMinutes),
          notes: notes.trim() || null,
        },
      });
      setSessions((current) =>
        [...current, session].sort((a, b) => a.startsAt.localeCompare(b.startsAt)),
      );
      setNotes("");
      toast("Séance planifiée et notifications enregistrées.");
    } catch (error) {
      toast(error instanceof Error ? error.message : "La séance n’a pas pu être planifiée.");
    } finally {
      setBusy(false);
    }
  }

  async function cancel(id: string) {
    if (busy) return;
    setBusy(true);
    try {
      await cancelTeacherSessionOnServer({ data: { sessionId: id } });
      setSessions((current) => current.filter((item) => item.id !== id));
      toast("Séance annulée et notifications mises à jour.");
    } catch (error) {
      toast(error instanceof Error ? error.message : "La séance n’a pas pu être annulée.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Surface className="mt-4">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <CalendarClock className="size-4" />
        </span>
        <div>
          <Eyebrow>Planification</Eyebrow>
          <h2 className="mt-1 font-display text-2xl tracking-tight">Les prochaines séances, réellement programmées.</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
            Une programmation crée une date de travail. Elle ne vaut pas preuve de présence.
            L’assistance et l’attendance restent des événements séparés.
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_1fr_8rem]">
        <select
          value={learnerUserId}
          onChange={(event) => setLearnerUserId(event.target.value)}
          className="h-11 rounded-lg border border-border bg-bg px-3 text-sm"
          aria-label="Apprenant de la séance"
        >
          {roster.map((student) => (
            <option key={student.id} value={student.id}>{student.name}</option>
          ))}
        </select>
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          maxLength={180}
          className="h-11 rounded-lg border border-border bg-bg px-3 text-sm"
          placeholder="Objet de la séance"
          aria-label="Objet de la séance"
        />
        <select
          value={durationMinutes}
          onChange={(event) => setDurationMinutes(event.target.value)}
          className="h-11 rounded-lg border border-border bg-bg px-3 text-sm"
          aria-label="Durée de la séance"
        >
          <option value="30">30 min</option>
          <option value="45">45 min</option>
          <option value="60">60 min</option>
          <option value="90">90 min</option>
          <option value="120">120 min</option>
        </select>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto]">
        <input
          type="datetime-local"
          value={startsAt}
          onChange={(event) => setStartsAt(event.target.value)}
          className="h-11 rounded-lg border border-border bg-bg px-3 text-sm"
          aria-label="Date et heure de séance"
        />
        <Button disabled={!learnerUserId || !title.trim() || !startsAt || busy} onClick={() => void schedule()}>
          {busy ? "Enregistrement…" : "Planifier"}
        </Button>
      </div>

      <textarea
        value={notes}
        onChange={(event) => setNotes(event.target.value)}
        maxLength={2000}
        rows={2}
        className="mt-3 min-h-20 w-full rounded-lg border border-border bg-bg px-3 py-3 text-sm leading-6"
        placeholder="Notes privées de préparation (facultatif)…"
        aria-label="Notes privées de préparation"
      />

      <div className="mt-6">
        <Eyebrow>À venir</Eyebrow>
        {loading ? (
          <p className="mt-3 text-sm text-muted">Lecture du planning…</p>
        ) : sessions.length === 0 ? (
          <p className="mt-3 rounded-xl border border-dashed border-border p-4 text-sm leading-6 text-muted">
            Aucune séance programmée.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {sessions.slice(0, 8).map((session) => (
              <li key={session.id} className="flex flex-col gap-3 rounded-xl border border-border bg-surface-2/30 p-4 sm:flex-row sm:items-center">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-primary">
                  <Clock3 className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{session.title}</p>
                  <p className="mt-1 text-xs text-muted">
                    {session.learnerName} · {localDateTime(session.startsAt)} · {session.durationMinutes} min
                  </p>
                  {session.notes ? <p className="mt-2 text-xs leading-5 text-subtle">{session.notes}</p> : null}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => downloadCalendar(session)}
                    disabled={busy}
                  >
                    Calendrier
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => void cancel(session.id)}
                    disabled={busy}
                  >
                    <X className="size-4" />
                    Annuler
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Surface>
  );
}
