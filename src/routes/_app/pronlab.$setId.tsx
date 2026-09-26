import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Leaf, Target, Volume2 } from "lucide-react";
import { RecordControl } from "@/components/app/record-control";
import { Eyebrow, Page, Sparkline, DualWave, Surface } from "@/components/app/primitives";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { findPronlabSet, LEARNER_MEMORY, PRONLAB_SETS, setsForLanguage } from "@/lib/blossom/data";
import { summarisePronlabItem, type PronlabAttempt } from "@/lib/blossom/engine";
import { influenceFromState } from "@/lib/blossom/influence";
import { isSetUnlocked, useBlossom } from "@/lib/blossom/store";
import { toast } from "sonner";
import {
  clearCurriculumLessonContext,
  readCurriculumLessonContext,
} from "@/lib/blossom/curriculum-context";
import { transcribeSpeakTurn } from "@/lib/blossom/speech.api";
import { blobToBase64, captureOnlyEvidence } from "@/lib/blossom/speech-stt";
import { learnLanguageDef } from "@/lib/i18n";

export const Route = createFileRoute("/_app/pronlab/$setId")({
  component: PronlabSetPage,
});

function highlight(phrase: string, segment: string) {
  if (!segment) return phrase;
  const idx = phrase.toLowerCase().indexOf(segment.toLowerCase());
  if (idx < 0) return phrase;
  return (
    <>
      {phrase.slice(0, idx)}
      <span className="text-clay underline decoration-clay/40 underline-offset-4">
        {phrase.slice(idx, idx + segment.length)}
      </span>
      {phrase.slice(idx + segment.length)}
    </>
  );
}

/** Explicit path to mastery — zero ambiguity. */
function masteryPath(summary: ReturnType<typeof summarisePronlabItem>): {
  label: string;
  detail: string;
  pct: number;
} {
  if (summary.mastered) {
    return {
      label: "Maîtrisé",
      detail: summary.verifiedMastered
        ? "Score tenu (≥90 ou 3× ≥75). Une feuille s'ouvre sur BLOSSOM."
        : "Pratique tenue (2 captures ≥2s ou 3 passages ≥6s). Une feuille s'ouvre.",
      pct: 100,
    };
  }
  if (summary.struggling) {
    return {
      label: "Son qui résiste",
      detail: "Best < 60 après ≥2 analyses. Mission, OSEZ et Pulse reçoivent ce frottement.",
      pct: Math.min(40, summary.attemptCount * 10),
    };
  }
  if (summary.attemptCount === 0) {
    return {
      label: "Pas encore touché",
      detail: "Premier passage : écrit un minéral pron. Deux captures ≥2s = maîtrise pratique.",
      pct: 0,
    };
  }
  const need = Math.max(0, 2 - summary.attemptCount);
  return {
    label: `${summary.attemptCount} passage${summary.attemptCount > 1 ? "s" : ""}`,
    detail:
      need > 0
        ? `Encore ${need} capture${need > 1 ? "s" : ""} claire${need > 1 ? "s" : ""} (≥2s) pour la maîtrise pratique — ou un score ≥90.`
        : "Proche de la maîtrise. Un passage net suffit encore.",
    pct: Math.min(90, summary.attemptCount * 35),
  };
}

function PronlabSetPage() {
  const { setId } = Route.useParams();
  const setDef = findPronlabSet(setId);
  const languageId = useBlossom((s) => s.languageId);
  const attempts = useBlossom((s) => s.pronlabAttempts);
  const assigned = useBlossom((s) => s.assignedSetIds);
  const record = useBlossom((s) => s.recordPronlabAttempt);
  const log = useBlossom((s) => s.activityLog);
  const growthEvents = useBlossom((s) => s.growthEvents);
  const phonemeLeaves = useBlossom((s) => s.phonemeLeaves);
  const missionSessions = useBlossom((s) => s.missionSessions);
  const minerals = useBlossom((s) => s.mineralSnapshot);
  const [index, setIndex] = useState(0);
  const [heard, setHeard] = useState(false);
  const [curriculumLessonId] = useState<string | null>(() => readCurriculumLessonContext());
  useEffect(() => {
    if (curriculumLessonId) clearCurriculumLessonContext();
  }, [curriculumLessonId]);
  const [lastAttempt, setLastAttempt] = useState<PronlabAttempt | null>(null);
  const [justMastered, setJustMastered] = useState(false);

  const influence = useMemo(
    () =>
      influenceFromState({
        activityLog: log,
        pronlabAttempts: attempts,
        growthEvents,
        phonemeLeaves,
        missionSessions,
        allItems: PRONLAB_SETS.filter((s) => !s.language || s.language === "English" || s.language === languageId).flatMap((s) => s.items),
        memory: LEARNER_MEMORY,
        memoryOn: true,
        languageId,
      }),
    [log, attempts, growthEvents, phonemeLeaves, missionSessions, languageId],
  );

  if (!setDef) {
    return (
      <Page>
        <p className="font-display text-2xl">Set introuvable</p>
        <Button asChild className="mt-4">
          <Link to="/pronlab">Retour</Link>
        </Button>
      </Page>
    );
  }
  if (setDef && !setsForLanguage(languageId).some((set) => set.id === setId)) {
    return (
      <Page className="max-w-xl">
        <p className="font-display text-2xl">Set indisponible dans la langue apprise</p>
        <p className="mt-2 text-sm text-muted">Ce set appartient à une autre langue cible. Changez la langue apprise dans MOI ou choisissez un set disponible.</p>
        <Button asChild className="mt-4"><Link to="/pronlab">Retour</Link></Button>
      </Page>
    );
  }


  const unlocked = isSetUnlocked(setDef.id, attempts, assigned);
  const item = setDef.items[index]!;
  const summary = summarisePronlabItem(item.id, attempts);
  const path = masteryPath(summary);
  const history = attempts
    .filter((a) => a.itemId === item.id)
    .slice(-10)
    .reverse();

  function speak(text: string) {
    if (setDef?.language === "lsf") {
      toast(text);
      return;
    }
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const utter = new SpeechSynthesisUtterance(text);
    const speechLanguage = setDef?.language === "English" || !setDef?.language ? "en" : setDef.language;
    utter.lang = learnLanguageDef(speechLanguage).speechLocale;
    utter.rate = 0.92;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
  }

  if (!unlocked) {
    return (
      <Page className="max-w-xl">
        <p className="font-display text-2xl">Pas encore.</p>
        <p className="mt-2 text-sm text-muted">
          Ce set s'ouvre après le précédent dans votre parcours.
        </p>
        <Button asChild className="mt-6">
          <Link to="/pronlab">Les sets</Link>
        </Button>
      </Page>
    );
  }

  const impactReasons = [
    ...influence.mission.reasons,
    ...influence.speak.reasons,
    ...influence.pulse.reasons,
    ...influence.tandem.reasons,
  ].filter((r) => r.code !== "balanced");

  return (
    <Page className="max-w-xl">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link to="/pronlab">
          <ArrowLeft className="size-4" />
          Pron'Lab
        </Link>
      </Button>

      <Eyebrow className="mt-6">{setDef.title}</Eyebrow>
      <div className="mt-2 flex items-center justify-between gap-3">
        <h1 className="font-display text-3xl tracking-tight">
          {index + 1} / {setDef.items.length}
        </h1>
        {summary.mastered ? (
          <Badge>Maîtrisé</Badge>
        ) : summary.struggling ? (
          <Badge variant="outline" className="border-primary/40 text-primary">
            Résiste
          </Badge>
        ) : null}
      </div>

      {/* Mastery path — zero ambiguity */}
      <section
        className="mt-4 rounded-2xl border border-border/70 bg-surface/80 p-4"
        aria-label="Chemin vers la maîtrise"
      >
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-subtle">
            Chemin · {path.label}
          </p>
          <p className="text-xs tabular-nums text-muted">{path.pct}%</p>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-2">
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-500"
            style={{ width: `${path.pct}%` }}
          />
        </div>
        <p className="mt-2 text-xs leading-5 text-muted">{path.detail}</p>
        <p className="mt-2 text-[11px] text-subtle">
          Minéral pron · {minerals.pron}/100 · {phonemeLeaves.length} feuille
          {phonemeLeaves.length !== 1 ? "s" : ""} ouverte
          {phonemeLeaves.length !== 1 ? "s" : ""}
        </p>
      </section>

      <div className="mt-4 flex flex-wrap gap-2">
        {setDef.items.map((it, i) => {
          const s = summarisePronlabItem(it.id, attempts);
          return (
            <button
              key={it.id}
              type="button"
              onClick={() => {
                setIndex(i);
                setHeard(false);
                setLastAttempt(null);
                setJustMastered(false);
              }}
              className={`rounded-full px-3 py-1 text-xs ${
                i === index
                  ? "bg-primary text-primary-foreground"
                  : "bg-surface-2 text-muted"
              }`}
            >
              {s.mastered ? "●" : s.struggling ? "◎" : "○"} {i + 1}
            </button>
          );
        })}
      </div>

      <Surface className="mt-8 text-center">
        <p className="text-xs uppercase tracking-[0.16em] text-muted">
          {item.kind} · {item.focus}
        </p>
        <p className="mt-3 font-display text-2xl leading-snug">
          {highlight(item.phrase, item.problemSegment)}
        </p>
        {item.ipa ? (
          <p className="mt-3 text-xs tracking-wide text-subtle">{item.ipa}</p>
        ) : null}
        <Button
          variant="secondary"
          className="mt-6"
          onClick={() => {
            setHeard(true);
            speak(item.model);
          }}
        >
          <Volume2 className="size-4" />
          Écouter le modèle
        </Button>
        <p className="mt-4 text-sm text-muted">{item.hint}</p>
      </Surface>

      <Surface className="mt-4 py-8">
        {lastAttempt === null ? (
          <RecordControl
            cta={heard ? "Maintenir pour dire" : "Écoutez, ou tentez"}
            onFinished={async ({ seconds, blob, mimeType }) => {
              const beforeMastered = summarisePronlabItem(item.id, useBlossom.getState().pronlabAttempts).mastered;
              let evidence = captureOnlyEvidence(seconds);
              if (blob) {
                try {
                  const audioBase64 = await blobToBase64(blob);
                  if (audioBase64) {
                    evidence = await transcribeSpeakTurn({
                      data: {
                        audioBase64,
                        mimeType,
                        seconds,
                        fileName: `kosez-pronlab-${item.id}.webm`,
                      },
                    });
                  }
                } catch {
                  evidence = captureOnlyEvidence(seconds);
                }
              }
              const attempt = record(item.id, seconds, {
                assessment: evidence.assessment,
                provider: evidence.providerId ?? "speech-evidence",
                language: evidence.language ?? "",
                transcript: evidence.transcript ?? "",
              });
              if (attempt) {
                if (curriculumLessonId) {
                  const linked = useBlossom.getState().activityLog.some(
                    (event) =>
                      event.type === "CURRICULUM_EVIDENCE_RECORDED" &&
                      event.sourceId === curriculumLessonId,
                  );
                  if (!linked) {
                    useBlossom.getState().completeActivity(
                      "CURRICULUM_EVIDENCE_RECORDED",
                      curriculumLessonId,
                      `Preuve curriculum · Pron'Lab · ${item.id}`,
                      { supportId: item.id },
                    );
                  }
                }
                const afterMastered = summarisePronlabItem(
                  item.id,
                  useBlossom.getState().pronlabAttempts,
                ).mastered;
                setJustMastered(!beforeMastered && afterMastered);
                setLastAttempt(attempt);
                toast(
                  !beforeMastered && afterMastered
                    ? "Maîtrise. Une feuille s'ouvre sur BLOSSOM."
                    : evidence.assessment === "transcript"
                      ? "Prise transcrite. Aucune note phonétique n'est inventée."
                      : "Prise enregistrée. K'Osez n'invente pas de note sans moteur phonétique.",
                );
              }
            }}
          />
        ) : (
          <div className="text-center">
            {justMastered ? (
              <div className="mb-6 rounded-2xl border border-primary/25 bg-primary/8 p-4 text-left">
                <div className="flex items-start gap-2">
                  <Leaf className="mt-0.5 size-4 shrink-0 text-primary" />
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary/80">
                      Feuille ouverte
                    </p>
                    <p className="mt-1 text-sm leading-6 text-fg">
                      « {item.focus || item.phrase} » tient. Le minéral pron monte. Mission, OSEZ et Pulse n'injectent plus ce son comme friction.
                    </p>
                  </div>
                </div>
              </div>
            ) : null}

            {lastAttempt.metadata?.assessment === "capture-only" ? (
              <>
                <p className="text-xs uppercase tracking-[0.16em] text-subtle">
                  Prise enregistrée
                </p>
                <p className="mt-2 font-display text-3xl tracking-tight">
                  {lastAttempt.seconds}s de parole
                </p>
                <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-muted">
                  Voix capturée. Pas de note inventée sans moteur phonétique. La
                  maîtrise pratique compte les captures ≥2s.
                </p>
                <div className="mt-5 rounded-2xl border border-border bg-surface-2/50 p-4 text-left">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-subtle">
                    Léo · repère
                  </p>
                  <p className="mt-2 text-sm leading-6">{item.tip}</p>
                </div>
                <p className="mt-4 font-display text-lg">{item.model}</p>
              </>
            ) : (
              <>
                <p className="text-xs uppercase tracking-[0.16em] text-subtle">
                  Analyse phonétique
                </p>
                <p className="mt-1 font-display text-4xl tabular-nums">{lastAttempt.score}</p>
                <p className="mt-4 text-sm leading-relaxed">{item.strength}</p>
                <p className="mt-3 text-sm text-muted">Léo : {item.tip}</p>
                <p className="mt-3 font-display text-lg">{item.model}</p>
                <div className="mt-5">
                  <DualWave
                    leftLabel="Modèle"
                    rightLabel="Vous"
                    match={lastAttempt.score / 100}
                  />
                </div>
              </>
            )}
            <div className="mt-6 flex flex-col gap-2">
              <Button variant="outline" onClick={() => { setLastAttempt(null); setJustMastered(false); }}>
                Réessayer
              </Button>
              {index < setDef.items.length - 1 && (
                <Button
                  onClick={() => {
                    setIndex((n) => n + 1);
                    setHeard(false);
                    setLastAttempt(null);
                    setJustMastered(false);
                  }}
                >
                  Item suivant
                </Button>
              )}
            </div>
          </div>
        )}
      </Surface>

      {/* Organism impact — what other doors receive */}
      {(lastAttempt || summary.struggling || summary.mastered) && (
        <section
          className="mt-4 rounded-2xl border border-primary/20 bg-primary/5 p-4 sm:p-5"
          aria-label="Impact sur l'organisme"
        >
          <div className="flex items-start gap-2">
            <Target className="mt-0.5 size-4 shrink-0 text-primary" />
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary/80">
                Organisme · conséquences
              </p>
              <p className="mt-1 text-sm leading-6 text-fg">
                {summary.mastered
                  ? "Ce son ne bloque plus Mission ni OSEZ. Il peut entrer dans le kit comme outil."
                  : summary.struggling
                    ? "Ce son traverse Mission (phrase d'appui), OSEZ (kit + pression douce), Pulse (dare recalibré) et Tandem (prompt d'ouverture)."
                    : "Chaque passage nourrit le minéral pron. La maîtrise ouvre une feuille."}
              </p>
              {impactReasons.length > 0 ? (
                <ul className="mt-3 space-y-1.5">
                  {impactReasons.slice(0, 4).map((r) => (
                    <li key={r.code + r.line} className="text-xs leading-5 text-muted">
                      <span className="font-medium text-primary/90">{r.code}</span>
                      {" · "}
                      {r.line}
                    </li>
                  ))}
                </ul>
              ) : null}
              <div className="mt-4 flex flex-wrap gap-2">
                {summary.struggling ? (
                  <>
                    <Button asChild size="sm" variant="secondary">
                      <Link to="/mission">
                        Mission
                        <ArrowRight className="size-3.5" />
                      </Link>
                    </Button>
                    <Button asChild size="sm" variant="ghost">
                      <Link to="/osez">OSEZ</Link>
                    </Button>
                  </>
                ) : summary.mastered ? (
                  <Button asChild size="sm" variant="secondary">
                    <Link to="/osez">
                      Utiliser dans une room
                      <ArrowRight className="size-3.5" />
                    </Link>
                  </Button>
                ) : null}
              </div>
            </div>
          </div>
        </section>
      )}

      <Surface className="mt-4">
        <Eyebrow>Historique</Eyebrow>
        <div className="mt-4">
          <Sparkline values={summary.scores} />
        </div>
        {history.length === 0 ? (
          <p className="mt-3 text-sm text-muted">Pas encore de passage.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {history.map((a) => (
              <li
                key={a.id}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-muted">
                  {new Date(a.createdAt).toLocaleDateString("fr-FR")}
                </span>
                <button
                  type="button"
                  className="tabular-nums text-primary"
                  onClick={() => speak(item.model)}
                >
                  {a.metadata?.assessment === "capture-only"
                    ? `Capture · ${a.seconds}s`
                    : `${a.score} · score`}
                </button>
              </li>
            ))}
          </ul>
        )}
      </Surface>
    </Page>
  );
}
