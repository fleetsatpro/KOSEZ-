import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import {
  Leaf,
  Shield,
  BookOpen,
  Calendar,
  CalendarClock,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import { LanguageSettings } from "@/components/app/language-settings";
import { Eyebrow, Page, Surface } from "@/components/app/primitives";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  attendanceProof,
  EVENTS,
  LEARNER_MEMORY,
  planAllows,
  PLANS,
  PLANT_IMAGE,
} from "@/lib/blossom/data";
import { countByType, resolveMemory } from "@/lib/blossom/engine";
import {
  courageDaysFromLog,
  courageRibbon,
  organismStatusLine,
} from "@/lib/blossom/organism";
import { useBlossom, useJourney } from "@/lib/blossom/store";
import { LeoLetterCard } from "@/components/app/leo-letter-card";
import { formatShortDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { useBlossomWorkspaceAccess } from "@/lib/blossom/access";
import { MoiSettings } from "@/components/app/moi-settings";
import { EvidenceTimeline } from "@/components/app/evidence-timeline";
import { ConversationPanel } from "@/components/app/conversation-panel";
import { ConversationInbox } from "@/components/app/conversation-inbox";
import { LearnerFeedback } from "@/components/app/learner-feedback";
import { OrganismMineralsPanel } from "@/components/app/organism-minerals-panel";
import { calendarFilename, teacherSessionToIcs } from "@/lib/blossom/calendar";
import { getLearnerSessionsOnServer } from "@/lib/blossom/domain.api";

export const Route = createFileRoute("/_app/moi")({
  component: MoiPage,
});

/**
 * MOI is not a settings dump.
 * Identity stage · Léo's private memory · preuves · courage atmosphere.
 */
function downloadSessionCalendar(session: {
  id: string;
  title: string;
  startsAt: string;
  durationMinutes: number;
  teacherName: string;
  learnerName: string;
}) {
  const ics = teacherSessionToIcs(session);
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = calendarFilename(session.title);
  anchor.click();
  URL.revokeObjectURL(url);
}

function MoiPage() {
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<Awaited<ReturnType<typeof getLearnerSessionsOnServer>>>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [selectedConversationKind, setSelectedConversationKind] = useState<"support" | "tandem" | "teacher">("support");
  const [selectedConversationPeerId, setSelectedConversationPeerId] = useState<string | null>(null);
  const [selectedConversationPeerName, setSelectedConversationPeerName] = useState<string | null>(null);
  const learner = useBlossom((s) => s.learner);
  const joined = useBlossom((s) => s.joinedEventIds);
  const enrolled = useBlossom((s) => s.enrolledIds);
  const syncOwnerUserId = useBlossom((s) => s.syncOwnerUserId);
  const log = useBlossom((s) => s.activityLog);
  const setParentMode = useBlossom((s) => s.setParentMode);
  const setTeacherMode = useBlossom((s) => s.setTeacherMode);
  const setOrgMode = useBlossom((s) => s.setOrgMode);
  const setAdminMode = useBlossom((s) => s.setAdminMode);
  const setChildMode = useBlossom((s) => s.setChildMode);
  const { access, pending: accessPending } = useBlossomWorkspaceAccess();
  const resetJourney = useBlossom((s) => s.resetJourney);
  const leoLetters = useBlossom((s) => s.leoLetters);
  const markLeoLetterRead = useBlossom((s) => s.markLeoLetterRead);
  const latestLetter = leoLetters[0] ?? null;
  const vocab = useBlossom((s) => s.vocabulary);
  const plan = useBlossom((s) => s.plan);
  const attempts = useBlossom((s) => s.pronlabAttempts);
  const minerals = useBlossom((s) => s.mineralSnapshot);
  const growthEvents = useBlossom((s) => s.growthEvents);
  const memoryOn = planAllows(plan, "memory");
  const memory = resolveMemory(attempts, LEARNER_MEMORY);
  const completeHomework = useBlossom((s) => s.completeHomework);
  const homework = useBlossom((s) => s.homework).filter(
    (h) =>
      h.studentId === syncOwnerUserId &&
      (h.status === "sent" || h.status === "done"),
  );
  const journey = useJourney();
  const proof = attendanceProof({
    missions: journey.missions.current,
    speak: journey.speak.current,
    pronlab: journey.pronlab.current,
    tandem: countByType(log, "TANDEM_COMPLETED"),
  });
  const cells = courageRibbon(courageDaysFromLog(log));
  const spoken = cells.filter(Boolean).length;
  const leoLine = organismStatusLine(minerals);
  const plantSrc = PLANT_IMAGE[journey.stage.id];
  const progress = Math.max(4, Math.round(journey.progress * 100));
  const initials = learner.firstName
    ? learner.firstName.slice(0, 1).toUpperCase()
    : "K";

  useEffect(() => {
    let disposed = false;
    void getLearnerSessionsOnServer({ data: { limit: 12 } })
      .then((rows) => {
        if (!disposed) setSessions(rows);
      })
      .catch(() => {
        if (!disposed) setSessions([]);
      })
      .finally(() => {
        if (!disposed) setSessionsLoading(false);
      });
    return () => {
      disposed = true;
    };
  }, []);

  const calendar = [
    ...EVENTS.filter((e) => joined.includes(e.id)).map((e) => ({
      id: e.id,
      title: e.title,
      when: `${formatShortDate(e.date)} · ${e.time}`,
      kind: "event" as const,
    })),
  ];

  return (
    <Page className="kosez-feature-page max-w-3xl">
      <section className="relative overflow-hidden rounded-3xl border border-border/60">
        <div className="relative aspect-[16/9] sm:aspect-[21/9]">
          <img
            src={plantSrc}
            alt=""
            className="absolute inset-0 h-full w-full object-cover object-center scale-[1.03]"
          />
          <div
            className="absolute inset-0 bg-gradient-to-t from-black via-black/55 to-black/20"
            aria-hidden
          />
          <div className="absolute inset-x-0 bottom-0 flex items-end gap-4 p-5 sm:p-7">
            {learner.avatar ? (
              <img
                src={learner.avatar}
                alt=""
                className="size-16 shrink-0 rounded-2xl object-cover ring-2 ring-white/20 sm:size-20"
              />
            ) : (
              <span className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-primary/20 font-display text-2xl text-white ring-2 ring-white/20 sm:size-20 sm:text-3xl">
                {initials}
              </span>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/45">
                MOI · {journey.stage.label}
              </p>
              <h1 className="mt-1 font-display text-3xl tracking-tight text-white sm:text-4xl">
                {learner.firstName} {learner.lastName}
              </h1>
              <p className="mt-1 text-sm text-white/55">
                {learner.city} · {learner.targetLanguage} {learner.level}
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-border/50 bg-surface/90 px-5 py-4 sm:px-7">
          <p className="font-display text-lg leading-snug text-fg sm:text-xl">
            {leoLine}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted">
            <span className="tabular-nums">
              <span className="font-display text-base text-fg">{journey.points}</span>{" "}
              pts
            </span>
            <span className="h-3 w-px bg-border" aria-hidden />
            <span className="tabular-nums">{progress}% du stade</span>
            <span className="h-3 w-px bg-border" aria-hidden />
            <span className="tabular-nums">
              {spoken}/28 courage
            </span>
          </div>
          <div
            className="mt-3 h-1 overflow-hidden rounded-full bg-surface-2"
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full rounded-full bg-primary/90 transition-[width] duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </section>

      <section
        className="mt-6 rounded-2xl border border-border/70 bg-surface/80 p-4 sm:p-5"
        aria-label="Ruban de courage"
      >
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-subtle">
            Ruban de courage
          </p>
          <p className="text-xs tabular-nums text-muted">
            {spoken} / 28 · sans flamme
          </p>
        </div>
        <ul className="mt-3 flex flex-wrap gap-1" aria-label="28 derniers jours">
          {cells.map((on, i) => (
            <li
              key={i}
              title={on ? "Geste ce jour-là" : "Terre en jachère"}
              className={cn(
                "size-2 rounded-full sm:size-2.5",
                on
                  ? "bg-primary shadow-[0_0_6px_rgba(217,255,105,0.4)]"
                  : "bg-surface-2 ring-1 ring-border/70",
              )}
            />
          ))}
        </ul>
        <p className="mt-2 text-[11px] leading-5 text-subtle">
          Les trous ne sont pas un échec — terre en jachère. Un seul jour de
          parole rallume le fil.
        </p>
      </section>

      <OrganismMineralsPanel minerals={minerals} growthEvents={growthEvents} />

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <Surface className="!p-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-subtle">
            Langue
          </p>
          <p className="mt-2 font-display text-2xl tracking-tight">
            {learner.targetLanguage} · {learner.level}
          </p>
          <p className="mt-1 text-sm text-muted">
            {learner.nativeLanguage} · {learner.creole}
          </p>
        </Surface>
        <Surface className="!p-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-subtle">
            BLOSSOM
          </p>
          <p className="mt-2 font-display text-2xl tracking-tight">
            {journey.stage.label}
          </p>
          <p className="mt-1 text-sm tabular-nums text-muted">
            {journey.points} points · {enrolled.length} parcours
          </p>
        </Surface>
      </div>

      <Surface className="mt-4">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <CalendarClock className="size-4" />
          </span>
          <div>
            <Eyebrow>Planning</Eyebrow>
            <h2 className="mt-1 font-display text-2xl tracking-tight">Vos prochaines séances</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
              Dates réellement programmées par votre enseignant. Une programmation
              n’est pas une preuve de présence.
            </p>
          </div>
        </div>
        {sessionsLoading ? (
          <p className="mt-4 text-sm text-muted">Lecture du planning…</p>
        ) : sessions.length === 0 ? (
          <p className="mt-4 text-sm text-subtle">Aucune séance programmée pour le moment.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {sessions.slice(0, 6).map((session) => (
              <li key={session.id} className="rounded-xl border border-border bg-surface-2/30 p-4">
                <p className="font-medium">{session.title}</p>
                <p className="mt-1 text-xs text-muted">
                  {new Date(session.startsAt).toLocaleString("fr-FR", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })} · {session.durationMinutes} min · {session.teacherName}
                </p>
                <button
                  type="button"
                  onClick={() => downloadSessionCalendar(session)}
                  className="mt-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary hover:underline"
                >
                  Ajouter au calendrier
                </button>
              </li>
            ))}
          </ul>
        )}
      </Surface>

      <div className="mt-4">
        <LanguageSettings />
      </div>

      <MoiSettings />

      <EvidenceTimeline
        title="Toutes vos preuves, au même endroit"
        description="Le même fil rassemble vos gestes, productions, observations et engagements. Chaque ligne reste reliée à sa porte quand une porte existe."
        limit={40}
      />

      <LearnerFeedback />

      <ConversationInbox
        selectedId={selectedConversationId}
        onSelect={(id, summary) => {
          setSelectedConversationId(id);
          if (summary) {
            setSelectedConversationKind(summary.kind);
            setSelectedConversationPeerId(summary.peerUserId);
            setSelectedConversationPeerName(summary.peerName);
          } else {
            setSelectedConversationKind("support");
            setSelectedConversationPeerId(null);
            setSelectedConversationPeerName("K’Osez");
          }
        }}
      />

      {selectedConversationId ? (
        <ConversationPanel
          kind={selectedConversationKind}
          partnerUserId={selectedConversationPeerId ?? undefined}
          partnerName={selectedConversationPeerName ?? undefined}
          conversationId={selectedConversationId}
        />
      ) : null}

      {memoryOn ? (
        <Surface className="mt-4 !p-5 sm:!p-6">
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <Sparkles className="size-4" strokeWidth={1.7} />
            </span>
            <div className="min-w-0 flex-1">
              <Eyebrow>Ce que Léo retient</Eyebrow>
              <p className="mt-2 text-sm leading-7 text-fg">{memory.leoNote}</p>
            </div>
          </div>
          <Separator className="my-5" />
          <div className="grid gap-5 sm:grid-cols-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-subtle">
                Hésitation
              </p>
              <p className="mt-2 text-sm leading-6">{memory.hesitation}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-subtle">
                Structure évitée
              </p>
              <p className="mt-2 text-sm leading-6">{memory.avoided}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-subtle">
                Là où ça tient
              </p>
              <p className="mt-2 text-sm leading-6">{memory.confidence}</p>
            </div>
          </div>
        </Surface>
      ) : (
        <Surface className="mt-4 !p-5">
          <Eyebrow>Mémoire Léo</Eyebrow>
          <p className="mt-3 text-sm leading-7 text-muted">
            Sur Digital, Léo reste dans la séance. La mémoire longue —
            hésitations, structures évitées — s'ouvre avec Premium ou le
            centre.
          </p>
        </Surface>
      )}

      <Surface className="mt-4 !p-5 sm:!p-6">
        <Eyebrow>Objectif</Eyebrow>
        <p className="mt-3 text-sm leading-7">{learner.goal}</p>
        <Separator className="my-5" />
        <div className="grid gap-5 sm:grid-cols-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-subtle">
              Intérêts
            </p>
            <p className="mt-2 text-sm leading-6">
              {learner.interests.join(" · ")}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-subtle">
              Créneau
            </p>
            <p className="mt-2 text-sm leading-6">{learner.practiceWindow}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-subtle">
              Coach
            </p>
            <p className="mt-2 text-sm leading-6">
              {learner.coach} — {learner.coachVoice}
            </p>
          </div>
        </div>
      </Surface>

      <Surface className="mt-4 !p-5 sm:!p-6">
        <Eyebrow>Formule</Eyebrow>
        <p className="mt-3 text-sm leading-7 text-muted">
          Votre formule est gérée par K’Osez. Les fonctions Premium et les
          droits d’accès viennent du serveur ; cette page ne peut pas
          s’auto-attribuer un abonnement.
        </p>
        <div className="mt-5 rounded-xl border border-border bg-surface-2/50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-subtle">
            Niveau d’accès actuel
          </p>
          <p className="mt-2 font-display text-xl">
            {plan === "premium" ? "Premium" : plan === "centre" ? "Centre" : "Digital"}
          </p>
          <p className="mt-1 text-xs leading-5 text-muted">
            Les changements d’abonnement et paiements nécessitent un workflow
            serveur dédié et une confirmation côté K’Osez.
          </p>
        </div>
      </Surface>

      {homework.length > 0 && (
        <Surface className="mt-4 !p-5">
          <div className="flex items-center gap-2">
            <BookOpen className="size-4 text-primary" strokeWidth={1.7} />
            <Eyebrow>Devoir reçu</Eyebrow>
          </div>
          {homework.map((h) => (
            <div key={h.id} className="mt-4">
              <p className="font-medium">{h.title}</p>
              <p className="mt-1 text-sm leading-6 text-muted">{h.body}</p>
              {h.status === "done" ? (
                <p className="mt-3 text-sm text-primary">Fait. Vous progressez.</p>
              ) : (
                <Button
                  size="sm"
                  className="mt-3"
                  onClick={() => {
                    completeHomework(h.id);
                    toast("Devoir noté. Léo s'en souvient.");
                  }}
                >
                  Marquer fait
                </Button>
              )}
            </div>
          ))}
        </Surface>
      )}

      {latestLetter ? (
        <div className="mt-4">
          <LeoLetterCard letter={latestLetter} onRead={() => markLeoLetterRead(latestLetter.id)} />
        </div>
      ) : null}

      {vocab.length > 0 && (
        <Surface className="mt-4 !p-5">
          <Eyebrow>Mots sauvés</Eyebrow>
          <ul className="mt-3 divide-y divide-border/60">
            {vocab.slice(0, 12).map((v) => (
              <li key={v.word} className="flex justify-between gap-3 py-2 text-sm">
                <span className="font-medium">{v.word}</span>
                <span className="text-muted">{v.gloss}</span>
              </li>
            ))}
          </ul>
        </Surface>
      )}

      {calendar.length > 0 && (
        <Surface className="mt-4 !p-5">
          <div className="flex items-center gap-2">
            <Calendar className="size-4 text-primary" strokeWidth={1.7} />
            <Eyebrow>Événements rejoints</Eyebrow>
          </div>
          <ul className="mt-3 space-y-2">
            {calendar.map((c) => (
              <li key={c.id} className="text-sm">
                <span className="font-medium">{c.title}</span>
                <span className="mt-0.5 block text-xs text-muted">{c.when}</span>
              </li>
            ))}
          </ul>
        </Surface>
      )}

      {proof.ready && (
        <Surface className="mt-4 !p-5">
          <Eyebrow>Attestation</Eyebrow>
          <p className="mt-2 font-display text-xl">{proof.title}</p>
          <ul className="mt-2 space-y-1 text-sm text-muted">
            {proof.lines.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </Surface>
      )}

      <Surface className="mt-4 !p-5">
        <Eyebrow>Espaces de rôle</Eyebrow>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => setParentMode(true)}>
            Parent
          </Button>
          <Button size="sm" variant="outline" onClick={() => setTeacherMode(true)}>
            Enseignant
          </Button>
          <Button size="sm" variant="outline" onClick={() => setOrgMode(true)}>
            Organisation
          </Button>
          {access.isAdmin && (
            <Button size="sm" variant="outline" onClick={() => setAdminMode(true)}>
              Admin
            </Button>
          )}
          {access.isChild && (
            <Button size="sm" variant="outline" onClick={() => setChildMode(true)}>
              Enfant
            </Button>
          )}
        </div>
      </Surface>

      <Surface className="mt-4 !p-5 border-destructive/20">
        <Eyebrow>Zone de risque</Eyebrow>
        <p className="mt-2 text-sm text-muted">
          Réinitialiser le parcours efface les preuves locales de cette machine.
        </p>
        <Button
          size="sm"
          variant="outline"
          className="mt-3 text-destructive"
          onClick={() => {
            if (window.confirm("Réinitialiser le parcours local ?")) {
              resetJourney();
              toast("Parcours réinitialisé.");
            }
          }}
        >
          Réinitialiser le parcours
        </Button>
      </Surface>

      <nav className="mt-8 mb-4" aria-label="Raccourcis">
        <ul className="flex flex-wrap gap-3 text-sm">
          <li>
            <Link to="/plant" className="text-primary hover:underline">
              Végétal
            </Link>
          </li>
          <li>
            <Link to="/mission" className="text-primary hover:underline">
              Mission
            </Link>
          </li>
          <li>
            <Link to="/osez" className="text-primary hover:underline">
              Osez
            </Link>
          </li>
        </ul>
      </nav>
    </Page>
  );
}
