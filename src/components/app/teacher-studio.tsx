import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Mic, MicOff } from "lucide-react";
import { Eyebrow, Initials, Page, Surface } from "@/components/app/primitives";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  HOMEWORK_DRAFTS,
  INTELLIGENCE,
  PRONLAB_SETS,
  TEACHER_ROSTER,
  TEACHER_TAGS,
  WARMUP_DRAFT,
  findPronlabItem,
} from "@/lib/blossom/data";
import { pronlabFlags } from "@/lib/blossom/engine";
import { useBlossom } from "@/lib/blossom/store";

type Tab = "prep" | "roster" | "lecture";

type RecognitionResult = {
  length: number;
  [index: number]: {
    [index: number]: { transcript: string } | undefined;
  } | undefined;
};

type RecognitionEvent = {
  results: RecognitionResult;
};

type RecognitionErrorEvent = {
  error?: string;
};

type RecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: RecognitionEvent) => void) | null;
  onerror: ((event: RecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type RecognitionConstructor = new () => RecognitionLike;

type SpeechRecognitionWindow = Window & {
  SpeechRecognition?: RecognitionConstructor;
  webkitSpeechRecognition?: RecognitionConstructor;
};


export function TeacherStudio() {
  const setTeacherMode = useBlossom((s) => s.setTeacherMode);
  const attempts = useBlossom((s) => s.pronlabAttempts);
  const notes = useBlossom((s) => s.teacherNotes);
  const addNote = useBlossom((s) => s.addTeacherNote);
  const warmup = useBlossom((s) => s.warmup);
  const saveWarmup = useBlossom((s) => s.saveWarmup);
  const homework = useBlossom((s) => s.homework);
  const saveDraft = useBlossom((s) => s.saveHomeworkDraft);
  const sendHomework = useBlossom((s) => s.sendHomework);
  const assignSet = useBlossom((s) => s.assignSet);
  const assigned = useBlossom((s) => s.assignedSetIds);
  const [tab, setTab] = useState<Tab>("prep");
  const [noteStudent, setNoteStudent] = useState("camille");
  const [noteText, setNoteText] = useState("");
  const [noteTags, setNoteTags] = useState<string[]>([]);
  const [hwStudent, setHwStudent] = useState("camille");
  const [hwTitle, setHwTitle] = useState(HOMEWORK_DRAFTS.camille!.title);
  const [hwBody, setHwBody] = useState(HOMEWORK_DRAFTS.camille!.body);
  const [voiceRecording, setVoiceRecording] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const recognitionRef = useRef<RecognitionLike | null>(null);
  const voiceBaseTextRef = useRef("");

  useEffect(() => {
    const speechWindow = window as SpeechRecognitionWindow;
    setVoiceSupported(Boolean(speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition));
    return () => {
      recognitionRef.current?.stop();
      recognitionRef.current = null;
    };
  }, []);

  function startVoiceNote() {
    const speechWindow = window as SpeechRecognitionWindow;
    const Constructor = speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;
    if (!Constructor) {
      setVoiceSupported(false);
      setVoiceError("La dictée vocale n'est pas disponible dans ce navigateur.");
      return;
    }

    const recognition = new Constructor();
    recognition.lang = "fr-FR";
    recognition.continuous = false;
    recognition.interimResults = true;
    voiceBaseTextRef.current = noteText.trim();
    recognition.onresult = (event) => {
      let transcript = "";
      for (let index = 0; index < event.results.length; index += 1) {
        const result = event.results[index];
        const spoken = result?.[0]?.transcript?.trim();
        if (spoken) transcript = `${transcript} ${spoken}`.trim();
      }
      if (transcript) {
        setNoteText([voiceBaseTextRef.current, transcript].filter(Boolean).join(" "));
      }
    };
    recognition.onerror = () => {
      setVoiceRecording(false);
      recognitionRef.current = null;
      setVoiceError("La dictée n'a pas pu démarrer. Vous pouvez saisir la note au clavier.");
    };
    recognition.onend = () => {
      setVoiceRecording(false);
      recognitionRef.current = null;
    };

    try {
      recognitionRef.current = recognition;
      recognition.start();
      setVoiceError(null);
      setVoiceRecording(true);
    } catch {
      recognitionRef.current = null;
      setVoiceRecording(false);
      setVoiceError("La dictée n'a pas pu démarrer.");
    }
  }

  function stopVoiceNote() {
    recognitionRef.current?.stop();
  }

  const camilleFlags = pronlabFlags(
    attempts,
    PRONLAB_SETS.flatMap((s) => s.items.map((i) => i.id)),
  );

  const roster = TEACHER_ROSTER.map((s) =>
    s.id === "camille"
      ? {
          ...s,
          flags: [
            ...s.flags,
            ...camilleFlags.map((f) => {
              const item = findPronlabItem(f.itemId);
              return item ? `Pron'Lab · ${item.phrase}` : "Pron'Lab";
            }),
          ].filter((v, i, a) => a.indexOf(v) === i),
        }
      : s,
  ).sort((a, b) => b.flags.length - a.flags.length);

  return (
    <Page>
      <div className="flex items-start justify-between gap-4">
        <div>
          <Eyebrow>Studio enseignant</Eyebrow>
          <h1 className="mt-2 font-display text-3xl tracking-tight">
            Conversation A2
          </h1>
          <p className="mt-1 text-sm text-muted">Mardi 18:00 · Léa Moreau</p>
        </div>
        <Button variant="secondary" onClick={() => setTeacherMode(false)}>
          Revenir au voyage
        </Button>
      </div>

      <div className="mt-6 flex gap-2">
        {(["prep", "roster", "lecture"] as const).map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`h-11 rounded-md px-4 text-sm ${
              tab === id
                ? "bg-primary text-primary-foreground"
                : "bg-surface text-muted shadow-[var(--shadow-border)]"
            }`}
          >
            {id === "prep" ? "Avant le cours" : id === "roster" ? "Promo" : "Lecture"}
          </button>
        ))}
      </div>

      {tab === "prep" && (
        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          <Surface>
            <Eyebrow>Qui a besoin d'attention</Eyebrow>
            <ul className="mt-4 space-y-4">
              {roster.map((student) => (
                <li key={student.id} className="flex items-start gap-3">
                  {student.avatar ? (
                    <img
                      src={student.avatar}
                      alt=""
                      className="size-10 rounded-full object-cover"
                    />
                  ) : (
                    <Initials letters={student.name.slice(0, 1)} />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{student.name}</p>
                    <p className="text-xs text-subtle">
                      {student.level} · {student.lastActivity}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {student.flags.length === 0 ? (
                        <span className="text-xs text-muted">Rien à signaler</span>
                      ) : (
                        student.flags.map((flag) => (
                          <Badge key={flag} variant="clay">
                            {flag}
                          </Badge>
                        ))
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <Button
              className="mt-5 w-full"
              variant="secondary"
              onClick={() => {
                assignSet("set-th");
                toast("Set « Les TH qui bloquent » assigné à Camille.");
              }}
              disabled={assigned.includes("set-th")}
            >
              {assigned.includes("set-th")
                ? "Remédiation TH déjà assignée"
                : "Assigner la remédiation TH (5–8 items)"}
            </Button>
          </Surface>

          <Surface>
            <Eyebrow>Échauffement 6 min</Eyebrow>
            {warmup ? (
              <p className="mt-4 whitespace-pre-line text-sm leading-relaxed">
                {warmup}
              </p>
            ) : (
              <p className="mt-4 text-sm text-muted">
                Un passage parlant, calé sur les drapeaux du jour. Vous
                restez l'autorité : générer, relire, ou jeter.
              </p>
            )}
            <Button
              className="mt-5 w-full"
              onClick={() => {
                saveWarmup(WARMUP_DRAFT);
                toast("Échauffement proposé. À vous de le garder.");
              }}
            >
              Proposer l'échauffement
            </Button>
          </Surface>

          <Surface>
            <Eyebrow>Note rapide</Eyebrow>
            <p className="mt-2 text-sm text-muted">Moins de trente secondes.</p>
            <select
              className="mt-4 h-11 w-full rounded-md border border-border bg-bg px-3 text-sm"
              value={noteStudent}
              onChange={(e) => setNoteStudent(e.target.value)}
            >
              {TEACHER_ROSTER.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <div className="mt-3 flex flex-wrap gap-2">
              {TEACHER_TAGS.map((tag) => {
                const on = noteTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() =>
                      setNoteTags((t) =>
                        on ? t.filter((x) => x !== tag) : [...t, tag],
                      )
                    }
                    className={`rounded-full px-3 py-1 text-xs ${
                      on
                        ? "bg-primary text-primary-foreground"
                        : "bg-surface-2 text-muted"
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
            <textarea
              className="mt-3 min-h-24 w-full rounded-md border border-border bg-bg p-3 text-sm"
              placeholder="Une phrase. Ou rien — les tags suffisent."
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
            />
            <Button
              className="mt-3 w-full"
              variant="secondary"
              onClick={() => {
                addNote(noteStudent, noteTags, noteText);
                setNoteText("");
                setNoteTags([]);
                toast("Note gardée. Rien n'est parti vers l'apprenant.");
              }}
            >
              Enregistrer
            </Button>
            <Button
              className="mt-2 w-full"
              variant="ghost"
              disabled={!voiceSupported}
              onClick={() => (voiceRecording ? stopVoiceNote() : startVoiceNote())}
            >
              {voiceRecording ? <MicOff className="size-4" /> : <Mic className="size-4" />}
              {voiceRecording ? "Arrêter la dictée" : "Dicter la note"}
            </Button>
            <p className="mt-2 text-[11px] leading-5 text-subtle">
              {voiceError ??
                (voiceSupported
                  ? "La transcription apparaît dans le champ ci-dessus. Vous relisez puis vous enregistrez."
                  : "Dictée vocale indisponible ici : utilisez la saisie texte.")}
            </p>
            {notes.length > 0 && (
              <ul className="mt-4 space-y-2 text-sm">
                {notes.slice(-3).map((n) => (
                  <li key={n.id} className="text-muted">
                    {TEACHER_ROSTER.find((s) => s.id === n.studentId)?.name} ·{" "}
                    {n.tags.join(", ") || "sans tag"}
                    {n.text ? ` — ${n.text}` : ""}
                  </li>
                ))}
              </ul>
            )}
          </Surface>

          <Surface>
            <Eyebrow>Devoir — vous relisez avant l'envoi</Eyebrow>
            <select
              className="mt-4 h-11 w-full rounded-md border border-border bg-bg px-3 text-sm"
              value={hwStudent}
              onChange={(e) => {
                setHwStudent(e.target.value);
                const draft = HOMEWORK_DRAFTS[e.target.value];
                if (draft) {
                  setHwTitle(draft.title);
                  setHwBody(draft.body);
                }
              }}
            >
              {Object.keys(HOMEWORK_DRAFTS).map((id) => (
                <option key={id} value={id}>
                  {TEACHER_ROSTER.find((s) => s.id === id)?.name}
                </option>
              ))}
            </select>
            <input
              className="mt-3 h-11 w-full rounded-md border border-border bg-bg px-3 text-sm"
              value={hwTitle}
              onChange={(e) => setHwTitle(e.target.value)}
            />
            <textarea
              className="mt-3 min-h-32 w-full rounded-md border border-border bg-bg p-3 text-sm"
              value={hwBody}
              onChange={(e) => setHwBody(e.target.value)}
            />
            <div className="mt-3 flex gap-2">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => {
                  saveDraft(hwStudent, hwTitle, hwBody);
                  toast("Brouillon gardé.");
                }}
              >
                Garder
              </Button>
              <Button
                className="flex-1"
                onClick={() => {
                  saveDraft(hwStudent, hwTitle, hwBody);
                  const draft = useBlossom
                    .getState()
                    .homework.find(
                      (h) => h.studentId === hwStudent && h.status === "draft",
                    );
                  if (draft) sendHomework(draft.id);
                  toast("Envoyé. Visible dans LEARN.");
                }}
              >
                Envoyer
              </Button>
            </div>
            {homework.filter((h) => h.status === "sent").length > 0 && (
              <p className="mt-3 text-xs text-subtle">
                {homework.filter((h) => h.status === "sent").length} envoyé
                {homework.filter((h) => h.status === "sent").length > 1 ? "s" : ""}
              </p>
            )}
          </Surface>
        </div>
      )}

      {tab === "roster" && (
        <div className="mt-8 overflow-x-auto">
          <table className="w-full min-w-[36rem] text-left text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-[0.16em] text-muted">
                <th className="py-3 font-medium">Apprenant</th>
                <th className="py-3 font-medium">Stade</th>
                <th className="py-3 font-medium">Parole</th>
                <th className="py-3 font-medium">Dernière activité</th>
                <th className="py-3 font-medium">Signaux</th>
              </tr>
            </thead>
            <tbody>
              {roster.map((s) => (
                <tr key={s.id} className="border-t border-border">
                  <td className="py-3">
                    {s.name}
                    <span className="block text-xs text-subtle">{s.level}</span>
                  </td>
                  <td className="py-3">{s.stage}</td>
                  <td className="py-3 tabular-nums">{s.minutes} min</td>
                  <td className="py-3 text-muted">{s.lastActivity}</td>
                  <td className="py-3">
                    {s.flags.length === 0 ? "—" : s.flags[0]}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "lecture" && (
        <div className="mt-8">
          <p className="max-w-lg text-sm leading-relaxed text-muted">
            K'Osez Intelligence. Ce qui tient, ce qui bloque, ce qui
            convertit. Pas de classement d'ego.
          </p>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2">
            {INTELLIGENCE.map((row) => (
              <li key={row.label}>
                <Surface>
                  <p className="text-xs uppercase tracking-[0.16em] text-muted">
                    {row.label}
                  </p>
                  <p className="mt-2 font-display text-2xl">{row.value}</p>
                  <p className="mt-1 text-sm text-muted">{row.note}</p>
                </Surface>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Page>
  );
}
