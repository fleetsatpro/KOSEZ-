import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useState } from "react";
import {
  Leaf,
  Shield,
  BookOpen,
  Calendar,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import { Eyebrow, Page, Surface } from "@/components/app/primitives";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  attendanceProof,
  EVENTS,
  LANGUAGE_MODULES,
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
import { getProofTimelineOnServer } from "@/lib/blossom/domain.api";
import { EvidenceTimeline } from "@/components/app/evidence-timeline";
import { ConversationPanel } from "@/components/app/conversation-panel";
import { ConversationInbox } from "@/components/app/conversation-inbox";
import { LearnerFeedback } from "@/components/app/learner-feedback";

export const Route = createFileRoute("/_app/moi")({
  component: MoiPage,
});

/**
 * MOI is not a settings dump.
 * Identity stage · Léo's private memory · preuves · courage atmosphere.
 */
function MoiPage() {
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
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
  const languageId = useBlossom((s) => s.languageId);
  const setLanguage = useBlossom((s) => s.setLanguage);
  const attempts = useBlossom((s) => s.pronlabAttempts);
  const minerals = useBlossom((s) => s.mineralSnapshot);
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
      {/* —— Identity stage —— */}
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

      {/* Courage ribbon */}
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

      {/* Language + BLOSSOM snapshot */}
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

      {/* Léo memory — denser */}
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

      {/* Objectif & coach */}
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

      {/* Formule */}
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
      {/* Homework */}
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
                    toast("Devoir noté. Léa reste l'autorité ; vous avez agi.");
                  }}
                >
                  J'ai fait
                </Button>
              )}
            </div>
          ))}
        </Surface>
      )}

      {/* Unified proof timeline */}
      <Surface className="mt-4 !p-5 sm:!p-6">
        <div className="flex items-end justify-between gap-3">
          <div>
            <Eyebrow>Fil de preuves</Eyebrow>
            <h2 className="mt-1 font-display text-2xl tracking-tight">
              Ce qui est réellement arrivé
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
              Une seule chronologie relie vos traces d’apprentissage, de parole,
              de Pron’Lab, de tandem et de terrain. Les liens reviennent à la
              porte qui a produit la trace.
            </p>
          </div>
          <Shield className="size-4 shrink-0 text-primary" strokeWidth={1.7} />
        </div>

        {proofTimelineLoading ? (
          <p className="mt-5 text-sm text-muted">Lecture des traces enregistrées…</p>
        ) : proofTimeline.length === 0 ? (
          <p className="mt-5 text-sm text-subtle">
            Aucune preuve serveur disponible pour le moment. Vos actions locales
            restent visibles dans les surfaces qui les produisent.
          </p>
        ) : (
          <ol className="mt-5 space-y-2">
            {proofTimeline.map((item) => (
              <li key={item.id}>
                <Link
                  to={item.href as never}
                  className="group flex items-start gap-3 rounded-xl border border-border/70 bg-surface-2/30 p-3 transition hover:bg-surface-2/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                >
                  <span className="mt-1 size-2 shrink-0 rounded-full bg-primary/80" aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-baseline justify-between gap-2">
                      <span className="font-medium">{item.label}</span>
                      <span className="text-[10px] text-subtle">
                        {formatShortDate(item.occurredAt.slice(0, 10))}
                      </span>
                    </span>
                    {item.detail ? (
                      <span className="mt-1 block text-xs leading-5 text-muted">
                        {item.detail}
                      </span>
                    ) : null}
                    {item.sourceId ? (
                      <span className="mt-1 block text-[10px] text-subtle">
                        Trace · {item.sourceId}
                      </span>
                    ) : null}
                  </span>
                  <ChevronRight className="mt-1 size-4 shrink-0 text-subtle transition group-hover:translate-x-0.5 group-hover:text-primary" />
                </Link>
              </li>
            ))}
          </ol>
        )}
      </Surface>

      {/* Calendar denser */}
      <Surface className="mt-4 !p-5 sm:!p-6">
        <div className="flex items-center gap-2">
          <Calendar className="size-4 text-primary" strokeWidth={1.7} />
          <Eyebrow>Calendrier</Eyebrow>
        </div>
        {calendar.length === 0 ? (
          <p className="mt-3 text-sm text-muted">Rien de noté pour l'instant.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {calendar.map((item) => (
              <li
                key={item.id}
                className="flex items-start justify-between gap-3 rounded-lg bg-surface-2/80 px-3 py-3 text-sm"
              >
                <div className="min-w-0">
                  <p className="font-medium leading-5">{item.title}</p>
                  <p className="mt-0.5 text-xs text-subtle">
                    Événement
                  </p>
                </div>
                <span className="shrink-0 text-xs tabular-nums text-muted">
                  {item.when}
                </span>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-4 text-xs text-subtle">
          {enrolled.length} parcours · {vocab.length} mots gardés
        </p>
      </Surface>

      {/* Preuves */}
      <Surface className="mt-4 !p-5 sm:!p-6">
        <div className="flex items-center gap-2">
          <Shield className="size-4 text-primary" strokeWidth={1.7} />
          <Eyebrow>Preuves</Eyebrow>
        </div>
        <p className="mt-3 font-display text-2xl tracking-tight">{proof.title}</p>
        <p className="mt-2 text-sm leading-6 text-muted">{proof.note}</p>
        <ul className="mt-4 space-y-2">
          {proof.lines.map((line) => (
            <li
              key={line}
              className="flex items-center gap-2 text-sm tabular-nums text-fg"
            >
              <Leaf className="size-3.5 shrink-0 text-primary/80" />
              {line}
            </li>
          ))}
        </ul>
        <div className="mt-5 rounded-xl border border-border bg-surface-2/50 p-4">
          <p className="text-sm font-medium">
            {proof.ready ? "Cycle prêt à être vérifié" : "Cycle encore ouvert"}
          </p>
          <p className="mt-1 text-xs leading-5 text-muted">
            L’émission d’une attestation officielle reste une opération du centre.
            K’Osez n’affiche pas de faux certificat comme s’il avait été signé.
          </p>
        </div>
      </Surface>
      {/* Languages */}
      <Surface className="mt-4 !p-5">
        <Eyebrow>Langues du centre</Eyebrow>
        <ul className="mt-3 divide-y divide-border/60">
          {LANGUAGE_MODULES.map((lang) => {
            const active = languageId === lang.id;
            return (
              <li key={lang.id}>
                <button
                  type="button"
                  onClick={() => setLanguage(lang.id)}
                  className="flex w-full items-center justify-between gap-3 py-3 text-left text-sm transition-colors hover:text-primary"
                >
                  <span className={cn(active && "font-medium text-primary")}>
                    {lang.name}
                  </span>
                  <span className="inline-flex items-center gap-1 text-muted">
                    {active ? "En cours" : lang.status}
                    <ChevronRight className="size-3.5 opacity-40" />
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </Surface>

      <LeoLetterCard
        letter={latestLetter}
        onRead={
          latestLetter
            ? () => markLeoLetterRead(latestLetter.id)
            : undefined
        }
        className="mt-8"
      />

      {/* Verified workspace doors */}
      {!accessPending && (access.isTeacher || access.isOrgStaff || access.isGuardian) ? (
        <div className="mt-8 space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-subtle">
            Espaces autorisés
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {access.isTeacher ? (
              <Button
                variant="secondary"
                className="justify-start"
                onClick={() => setTeacherMode(true)}
              >
                Studio enseignant
              </Button>
            ) : null}
            {access.isOrgStaff ? (
              <Button
                variant="secondary"
                className="justify-start"
                onClick={() => setOrgMode(true)}
              >
                Espace entreprise
              </Button>
            ) : null}
            {access.isAdmin ? (
              <Button
                variant="secondary"
                className="justify-start"
                onClick={() => setAdminMode(true)}
              >
                Centre opérationnel Admin
              </Button>
            ) : null}
            {access.isGuardian ? (
              <Button
                variant="secondary"
                className="justify-start"
                onClick={() => setParentMode(true)}
              >
                Espace parent
              </Button>
            ) : null}
            {access.isChild ? (
              <Button
                variant="secondary"
                className="justify-start"
                onClick={() => setChildMode(true)}
              >
                Ouvrir le parcours enfant
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="mt-8">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-subtle">
          Données locales
        </p>
        <Button
          variant="ghost"
          className="mt-2 w-full text-muted"
          onClick={() => {
            if (window.confirm("Revenir à l'état initial du voyage sur cet appareil ?")) {
              resetJourney();
            }
          }}
        >
          Réinitialiser ce voyage
        </Button>
      </div>

      <nav className="mt-10 border-t border-border/60 pt-6" aria-label="Portes">
        <ul className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm">
          <li>
            <Link to="/" className="text-muted transition-colors hover:text-primary">
              Accueil
            </Link>
          </li>
          <li className="text-border" aria-hidden>·</li>
          <li>
            <Link to="/plant" className="text-muted transition-colors hover:text-primary">
              Végétal
            </Link>
          </li>
          <li className="text-border" aria-hidden>·</li>
          <li>
            <Link to="/osez" className="text-muted transition-colors hover:text-primary">
              Osez
            </Link>
          </li>
        </ul>
      </nav>
    </Page>
  );
}
