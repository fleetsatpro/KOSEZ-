import { useEffect, useMemo, useRef, useState } from "react";
import { Mic, MicOff, Users } from "lucide-react";
import { toast } from "sonner";
import { Eyebrow, Initials, Page, Surface } from "@/components/app/primitives";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useBlossomWorkspaceAccess } from "@/lib/blossom/access";
import { getTeacherWorkspaceOnServer } from "@/lib/blossom/domain.api";
import { TEACHER_TAGS } from "@/lib/blossom/data";
import { useBlossom } from "@/lib/blossom/store";
import { LearnerDetail } from "./learner-detail";

type Tab = "prep" | "roster" | "lecture";
type TeacherRow = Awaited<ReturnType<typeof getTeacherWorkspaceOnServer>>[number];

type RecognitionResult = {
  length: number;
  [index: number]:
    | { [index: number]: { transcript: string } | undefined }
    | undefined;
};

type RecognitionEvent = { results: RecognitionResult };
type RecognitionErrorEvent = { error?: string };
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

function formatLastActivity(value: string | null) {
  if (!value) return "Aucune activité enregistrée";
  const days = Math.floor(
    (Date.now() - new Date(value).getTime()) / 86_400_000,
  );
  if (days <= 0) return "Aujourd'hui";
  if (days === 1) return "Hier";
  return `Il y a ${days} jours`;
}

function deriveFlags(student: TeacherRow) {
  const flags: string[] = [];
  if (student.pronlabAttempts >= 2 && student.pronlabBest < 60) {
    flags.push("Prononciation");
  }
  if (student.activitiesThisWeek === 0) flags.push("Missions manquées");
  return flags;
}

function warmupFor(roster: TeacherRow[]) {
  const flagged = roster.flatMap((student) =>
    deriveFlags(student).map((flag) => `${student.name} · ${flag}`),
  );
  const focus = flagged.length
    ? flagged.slice(0, 4).join(", ")
    : "aucun signal prioritaire";
  return [
    "Six minutes · préparation proposée par K’Osez.",
    "",
    "1. Une question d’ouverture, chacun à son niveau.",
    "2. Une relance courte : “What about you?”",
    "3. Une micro-situation du quotidien, deux prises de parole.",
    "",
    `Focus détecté : ${focus}.`,
    "À garder, modifier ou jeter avant le cours.",
  ].join("\n");
}

function homeworkFor(student: TeacherRow) {
  const pronunciation = student.pronlabAttempts >= 2 && student.pronlabBest < 60;
  return {
    title: pronunciation ? "Reprendre un point de prononciation" : "Une mission cette semaine",
    body: pronunciation
      ? `${student.name} — choisissez un item Pron’Lab déjà travaillé et refaites-le une fois, posé. L’objectif est d’obtenir une nouvelle observation, pas de chasser une note.`
      : `${student.name} — une petite prise de parole cette semaine : décrivez une situation réelle pendant une minute. Nous la reprendrons en cours.`,
  };
}

export function TeacherStudio() {
  const setTeacherMode = useBlossom((s) => s.setTeacherMode);
  const notes = useBlossom((s) => s.teacherNotes);
  const addNote = useBlossom((s) => s.addTeacherNote);
  const homework = useBlossom((s) => s.homework);
  const saveDraft = useBlossom((s) => s.saveHomeworkDraft);
  const sendHomework = useBlossom((s) => s.sendHomework);
  const { access, pending: accessPending } = useBlossomWorkspaceAccess();

  const [roster, setRoster] = useState<TeacherRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [workspaceError, setWorkspaceError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("prep");
  const [noteStudent, setNoteStudent] = useState("");
  const [noteText, setNoteText] = useState("");
  const [noteTags, setNoteTags] = useState<string[]>([]);
  const [hwStudent, setHwStudent] = useState("");
  const [hwTitle, setHwTitle] = useState("");
  const [hwBody, setHwBody] = useState("");
  const [selectedLearnerId, setSelectedLearnerId] = useState("");

  const [voiceRecording, setVoiceRecording] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const recognitionRef = useRef<RecognitionLike | null>(null);
  const voiceBaseTextRef = useRef("");

  useEffect(() => {
    let disposed = false;
    if (accessPending) return;
    if (!access.isTeacher) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setWorkspaceError(null);
    void getTeacherWorkspaceOnServer()
      .then((rows) => {
        if (disposed) return;
        setRoster(rows);
        setNoteStudent((current) => current || rows[0]?.id || "");
        setHwStudent((current) => current || rows[0]?.id || "");
        if (rows[0]) {
          const draft = homeworkFor(rows[0]);
          setHwTitle(draft.title);
          setHwBody(draft.body);
        }
      })
      .catch(() => {
        if (!disposed) setWorkspaceError("Impossible de charger votre classe. Réessayez.");
      })
      .finally(() => {
        if (!disposed) setLoading(false);
      });
    return () => {
      disposed = true;
    };
  }, [access.isTeacher, accessPending]);

  useEffect(() => {
    const speechWindow = window as SpeechRecognitionWindow;
    setVoiceSupported(
      Boolean(
        speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition,
      ),
    );
    return () => recognitionRef.current?.stop();
  }, []);

  const attention = useMemo(
    () => roster.filter((student) => deriveFlags(student).length > 0),
    [roster],
  );
  const warmup = useMemo(() => warmupFor(roster), [roster]);

  function startVoiceNote() {
    const speechWindow = window as SpeechRecognitionWindow;
    const Constructor =
      speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;
    if (!Constructor) {
      setVoiceSupported(false);
      setVoiceError("La dictée vocale n’est pas disponible dans ce navigateur.");
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
        const spoken = event.results[index]?.[0]?.transcript?.trim();
        if (spoken) transcript = `${transcript} ${spoken}`.trim();
      }
      if (transcript) {
        setNoteText([voiceBaseTextRef.current, transcript].filter(Boolean).join(" "));
      }
    };
    recognition.onerror = () => {
      setVoiceRecording(false);
      recognitionRef.current = null;
      setVoiceError("La dictée n’a pas pu démarrer.");
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
      setVoiceError("La dictée n’a pas pu démarrer.");
    }
  }

  function setHomeworkStudent(id: string) {
    setHwStudent(id);
    const student = roster.find((row) => row.id === id);
    if (!student) return;
    const draft = homeworkFor(student);
    setHwTitle(draft.title);
    setHwBody(draft.body);
  }

  if (accessPending || loading) {
    return (
      <Page>
        <Eyebrow>Studio enseignant</Eyebrow>
        <h1 className="mt-2 font-display text-3xl tracking-tight">Votre classe</h1>
        <p className="mt-3 text-sm text-muted">Chargement des données autorisées…</p>
      </Page>
    );
  }

  if (!access.isTeacher) {
    return (
      <Page>
        <Eyebrow>Studio enseignant</Eyebrow>
        <h1 className="mt-2 font-display text-2xl">Accès non disponible</h1>
        <p className="mt-3 text-sm leading-6 text-muted">
          Ce compte n’a pas de relation enseignant active.
        </p>
        <Button variant="secondary" className="mt-6" onClick={() => setTeacherMode(false)}>
          Revenir au voyage
        </Button>
      </Page>
    );
  }

  if (workspaceError) {
    return (
      <Page>
        <Eyebrow>Studio enseignant</Eyebrow>
        <h1 className="mt-2 font-display text-2xl">Votre classe est indisponible</h1>
        <p className="mt-3 text-sm leading-6 text-muted">{workspaceError}</p>
        <Button
          className="mt-6"
          variant="secondary"
          onClick={() => {
            setWorkspaceError(null);
            setLoading(true);
            void getTeacherWorkspaceOnServer()
              .then(setRoster)
              .catch(() => setWorkspaceError("Le chargement a échoué."))
              .finally(() => setLoading(false));
          }}
        >
          Réessayer
        </Button>
      </Page>
    );
  }

  return (
    <Page>
      <div className="flex items-start justify-between gap-4">
        <div>
          <Eyebrow>Studio enseignant</Eyebrow>
          <h1 className="mt-2 font-display text-3xl tracking-tight">
            Votre classe, maintenant.
          </h1>
          <p className="mt-1 text-sm text-muted">
            {roster.length} apprenant{roster.length > 1 ? "s" : ""} · signaux calculés à partir de leur activité réelle.
          </p>
        </div>
        <Button variant="secondary" onClick={() => setTeacherMode(false)}>
          Revenir au voyage
        </Button>
      </div>

      {roster.length === 0 ? (
        <Surface className="mt-8">
          <Users className="size-5 text-primary" />
          <h2 className="mt-4 font-display text-2xl">Classe vide pour le moment.</h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-muted">
            Aucun apprenant actif n’est encore relié à votre compte enseignant.
            Les comptes et relations se configurent côté administration ; aucune donnée de démonstration n’est affichée ici.
          </p>
        </Surface>
      ) : (
        <>
          <div className="mt-6 flex gap-2 overflow-x-auto pb-1">
            {(["prep", "roster", "lecture"] as const).map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={id === tab ? "h-11 shrink-0 rounded-md bg-primary px-4 text-sm text-primary-foreground" : "h-11 shrink-0 rounded-md bg-surface px-4 text-sm text-muted shadow-[var(--shadow-border)]"}
              >
                {id === "prep" ? "Avant le cours" : id === "roster" ? "Classe" : "Lecture"}
              </button>
            ))}
          </div>

          {tab === "prep" ? (
            <div className="mt-8 grid gap-4 lg:grid-cols-2">
              <Surface>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Eyebrow>Attention</Eyebrow>
                    <p className="mt-1 text-sm text-muted">
                      {attention.length
                        ? `${attention.length} apprenant${attention.length > 1 ? "s" : ""} avec un signal.`
                        : "Aucun signal prioritaire détecté."}
                    </p>
                  </div>
                  <Badge variant="outline">{roster.length} total</Badge>
                </div>

                <ul className="mt-5 space-y-4">
                  {(attention.length ? attention : roster).slice(0, 8).map((student) => {
                    const flags = deriveFlags(student);
                    return (
                      <li key={student.id} className="flex items-start gap-3">
                        <Initials letters={student.name.slice(0, 1)} />
                        <div className="min-w-0 flex-1">
                          <p className="font-medium">{student.name}</p>
                          <p className="text-xs text-subtle">
                            {student.level ?? "Niveau non renseigné"} · {formatLastActivity(student.lastActivity)}
                          </p>
                          <div className="mt-2 flex flex-wrap gap-1">
                            {(flags.length ? flags : ["Régulier"]).map((flag) => (
                              <Badge key={flag} variant={flags.length ? "clay" : "outline"}>
                                {flag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>

                <p className="mt-5 rounded-xl border border-border bg-surface-2/45 p-4 text-xs leading-5 text-muted">
                  Les signaux servent à préparer le cours. La décision d’assigner
                  un travail précis reste dans le circuit pédagogique de l’enseignant.
                </p>
              </Surface>

              <Surface>
                <Eyebrow>Échauffement · 6 min</Eyebrow>
                <p className="mt-4 whitespace-pre-line text-sm leading-7">{warmup}</p>
                <p className="mt-4 text-xs leading-5 text-subtle">
                  Proposition dérivée de la classe chargée. Rien n’est envoyé automatiquement.
                </p>
              </Surface>

              <Surface>
                <Eyebrow>Note rapide</Eyebrow>
                <p className="mt-2 text-sm text-muted">Tags + dictée, puis relecture avant sauvegarde.</p>
                <select
                  className="mt-4 h-11 w-full rounded-md border border-border bg-bg px-3 text-sm"
                  value={noteStudent}
                  onChange={(event) => setNoteStudent(event.target.value)}
                >
                  {roster.map((student) => (
                    <option key={student.id} value={student.id}>{student.name}</option>
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
                          setNoteTags((current) =>
                            on ? current.filter((item) => item !== tag) : [...current, tag],
                          )
                        }
                        className={on ? "rounded-full bg-primary px-3 py-2 text-xs text-primary-foreground" : "rounded-full bg-surface-2 px-3 py-2 text-xs text-muted"}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>

                <textarea
                  className="mt-3 min-h-28 w-full rounded-md border border-border bg-bg p-3 text-sm"
                  placeholder="Une observation concrète."
                  value={noteText}
                  onChange={(event) => setNoteText(event.target.value)}
                />

                <Button
                  className="mt-3 w-full"
                  variant="secondary"
                  disabled={!noteStudent || (!noteText.trim() && noteTags.length === 0)}
                  onClick={() => {
                    addNote(noteStudent, noteTags, noteText.trim());
                    setNoteText("");
                    setNoteTags([]);
                    toast("Note enregistrée. La synchronisation est traitée automatiquement.");
                  }}
                >
                  Enregistrer la note
                </Button>

                <Button
                  className="mt-2 w-full"
                  variant="ghost"
                  disabled={!voiceSupported}
                  onClick={() => {
                    if (voiceRecording) {
                      recognitionRef.current?.stop();
                    } else {
                      startVoiceNote();
                    }
                  }}
                >
                  {voiceRecording ? <MicOff className="size-4" /> : <Mic className="size-4" />}
                  {voiceRecording ? "Arrêter la dictée" : "Dicter la note"}
                </Button>
                <p className="mt-2 text-[11px] leading-5 text-subtle">
                  {voiceError ??
                    (voiceSupported
                      ? "La dictée apparaît dans le champ ci-dessus."
                      : "Dictée vocale indisponible ici : utilisez le texte.")}
                </p>

                {notes.length ? (
                  <ul className="mt-5 space-y-2 text-sm">
                    {notes.slice(-4).reverse().map((note) => (
                      <li key={note.id} className="border-t border-border pt-3 text-muted">
                        {note.studentId} · {note.tags.join(", ") || "sans tag"}{note.text ? ` — ${note.text}` : ""}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </Surface>

              <Surface>
                <Eyebrow>Devoir · brouillon contrôlé</Eyebrow>
                <select
                  className="mt-4 h-11 w-full rounded-md border border-border bg-bg px-3 text-sm"
                  value={hwStudent}
                  onChange={(event) => setHomeworkStudent(event.target.value)}
                >
                  {roster.map((student) => (
                    <option key={student.id} value={student.id}>{student.name}</option>
                  ))}
                </select>
                <input
                  className="mt-3 h-11 w-full rounded-md border border-border bg-bg px-3 text-sm"
                  value={hwTitle}
                  onChange={(event) => setHwTitle(event.target.value)}
                  maxLength={200}
                />
                <textarea
                  className="mt-3 min-h-32 w-full rounded-md border border-border bg-bg p-3 text-sm"
                  value={hwBody}
                  onChange={(event) => setHwBody(event.target.value)}
                  maxLength={5000}
                />
                <div className="mt-3 flex gap-2">
                  <Button
                    variant="secondary"
                    className="flex-1"
                    onClick={() => {
                      saveDraft(hwStudent, hwTitle.trim(), hwBody.trim());
                      toast("Brouillon enregistré localement et mis en file de synchronisation.");
                    }}
                  >
                    Garder
                  </Button>
                  <Button
                    className="flex-1"
                    disabled={!hwStudent || !hwTitle.trim() || !hwBody.trim()}
                    onClick={() => {
                      saveDraft(hwStudent, hwTitle.trim(), hwBody.trim());
                      const draft = useBlossom.getState().homework.find(
                        (item) => item.studentId === hwStudent && item.status === "draft",
                      );
                      if (draft) sendHomework(draft.id);
                      toast("Devoir marqué comme envoyé. La synchronisation est traitée automatiquement.");
                    }}
                  >
                    Envoyer
                  </Button>
                </div>
                <p className="mt-3 text-xs leading-5 text-subtle">
                  L’enseignant conserve la décision finale. Aucune génération ou envoi automatique ne contourne cette étape.
                </p>
                {homework.filter((item) => item.status === "sent").length ? (
                  <p className="mt-3 text-xs text-subtle">
                    {homework.filter((item) => item.status === "sent").length} devoir
                    {homework.filter((item) => item.status === "sent").length > 1 ? "s" : ""} envoyé(s).
                  </p>
                ) : null}
              </Surface>
            </div>
          ) : null}

          {tab === "roster" ? (
            <>
            <div className="mt-8 overflow-x-auto">
              <table className="w-full min-w-[42rem] text-left text-sm">
                <thead>
                  <tr className="text-xs uppercase tracking-[0.16em] text-muted">
                    <th className="py-3 font-medium">Apprenant</th>
                    <th className="py-3 font-medium">Activité</th>
                    <th className="py-3 font-medium">Parole</th>
                    <th className="py-3 font-medium">Pron’Lab</th>
                    <th className="py-3 font-medium">Dernière activité</th>
                  </tr>
                </thead>
                <tbody>
                  {roster.map((student) => (
                    <tr key={student.id} className="border-t border-border">
                      <td className="py-3">
                        <button
                          type="button"
                          className="text-left hover:text-primary"
                          onClick={() => setSelectedLearnerId(student.id)}
                        >
                          {student.name}
                          <span className="block text-xs text-subtle">{student.level ?? "—"}</span>
                        </button>
                      </td>
                      <td className="py-3 tabular-nums">{student.activitiesThisWeek}</td>
                      <td className="py-3 tabular-nums">{student.practiceMinutes} min</td>
                      <td className="py-3 tabular-nums">{student.pronlabAttempts}</td>
                      <td className="py-3 text-muted">{formatLastActivity(student.lastActivity)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {selectedLearnerId ? (
              <LearnerDetail learnerUserId={selectedLearnerId} role="teacher" />
            ) : (
              <Surface className="mt-5 border-dashed">
                <p className="text-sm text-muted">Sélectionnez un apprenant pour ouvrir son fil de preuves.</p>
              </Surface>
            )}
            </>
          ) : null}

          {tab === "lecture" ? (
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <Surface>
                <Eyebrow>Apprenants actifs</Eyebrow>
                <p className="mt-2 font-display text-4xl tabular-nums">{roster.length}</p>
              </Surface>
              <Surface>
                <Eyebrow>Avec signal</Eyebrow>
                <p className="mt-2 font-display text-4xl tabular-nums">{attention.length}</p>
              </Surface>
              <Surface>
                <Eyebrow>Temps de pratique</Eyebrow>
                <p className="mt-2 font-display text-4xl tabular-nums">
                  {roster.reduce((sum, student) => sum + student.practiceMinutes, 0)}
                  <span className="ml-1 text-base text-muted">min</span>
                </p>
              </Surface>
            </div>
          ) : null}
        </>
      )}
    </Page>
  );
}
