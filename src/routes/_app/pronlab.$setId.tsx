import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Volume2 } from "lucide-react";
import { RecordControl } from "@/components/app/record-control";
import { Eyebrow, Page, Sparkline, DualWave, Surface } from "@/components/app/primitives";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { findPronlabSet } from "@/lib/blossom/data";
import { summarisePronlabItem, type PronlabAttempt } from "@/lib/blossom/engine";
import { isSetUnlocked, useBlossom } from "@/lib/blossom/store";
import { toast } from "sonner";

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

function PronlabSetPage() {
  const { setId } = Route.useParams();
  const setDef = findPronlabSet(setId);
  const attempts = useBlossom((s) => s.pronlabAttempts);
  const assigned = useBlossom((s) => s.assignedSetIds);
  const record = useBlossom((s) => s.recordPronlabAttempt);
  const consent = useBlossom((s) => s.exportConsent);
  const setConsent = useBlossom((s) => s.setExportConsent);
  const [index, setIndex] = useState(0);
  const [heard, setHeard] = useState(false);
  const [lastAttempt, setLastAttempt] = useState<PronlabAttempt | null>(null);

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

  const unlocked = isSetUnlocked(setDef.id, attempts, assigned);
  const item = setDef.items[index]!;
  const summary = summarisePronlabItem(item.id, attempts);
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
    utter.lang = setDef?.language === "es" ? "es-ES" : "en-GB";
    utter.rate = 0.92;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
  }

  if (!unlocked) {
    return (
      <Page className="max-w-xl">
        <p className="font-display text-2xl">Pas encore.</p>
        <p className="mt-2 text-sm text-muted">
          Ce set s'ouvre après le précédent, ou si Léa l'assigne.
        </p>
        <Button asChild className="mt-6">
          <Link to="/pronlab">Les sets</Link>
        </Button>
      </Page>
    );
  }

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
        {summary.mastered && <Badge>Maîtrisé</Badge>}
      </div>

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
              }}
              className={`rounded-full px-3 py-1 text-xs ${
                i === index
                  ? "bg-primary text-primary-foreground"
                  : "bg-surface-2 text-muted"
              }`}
            >
              {s.mastered ? "●" : "○"} {i + 1}
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
            onFinished={(seconds) => {
              const attempt = record(item.id, seconds ?? 2);
              if (attempt) {
                setLastAttempt(attempt);
                toast("Prise enregistrée. L’analyse viendra avec un vrai moteur phonétique.");
              }
            }}
          />
        ) : (
          <div className="text-center">
            {lastAttempt.metadata?.assessment === "capture-only" ? (
              <>
                <p className="text-xs uppercase tracking-[0.16em] text-subtle">
                  Prise enregistrée
                </p>
                <p className="mt-2 font-display text-3xl tracking-tight">
                  {lastAttempt.seconds}s de parole
                </p>
                <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-muted">
                  Votre voix a bien été capturée, mais K’Osez ne fabrique pas
                  de note en l’absence d’un moteur phonétique connecté.
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
              <Button variant="outline" onClick={() => setLastAttempt(null)}>
                Réessayer
              </Button>
              {index < setDef.items.length - 1 && (
                <Button
                  onClick={() => {
                    setIndex((n) => n + 1);
                    setHeard(false);
                    setLastAttempt(null);
                  }}
                >
                  Item suivant
                </Button>
              )}
            </div>
          </div>
        )}
      </Surface>

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
                  {a.metadata?.assessment === "capture-only" ? `Capture · ${a.seconds}s` : `${a.score} · score`}
                </button>
              </li>
            ))}
          </ul>
        )}
      </Surface>

      {summary.attemptCount >= 2 && (
        <Surface className="mt-4">
          <Eyebrow>Avant / après</Eyebrow>
          <p className="mt-3 text-sm tabular-nums">
            Premier {summary.scores[0]} → dernier {summary.lastScore}
          </p>
          <label className="mt-4 flex items-center gap-3 text-sm">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="size-4 accent-primary"
            />
            J'autorise un clip de 20 s, uniquement mon audio.
          </label>
          <Button
            variant="secondary"
            className="mt-4 w-full"
            disabled={!consent}
            onClick={() => {
              const first = summary.scores[0] ?? 0;
              const last = summary.lastScore;
              const html = `<!doctype html><meta charset="utf-8"><title>K'Osez BLOSSOM — avant / après</title><body style="font-family:Georgia,serif;background:#F3EEE4;color:#1C2B26;padding:48px;max-width:40rem"><p style="letter-spacing:.2em;font-size:11px;text-transform:uppercase">Pron'Lab</p><h1>${item.phrase}</h1><p>Premier passage ${first} · dernier ${last}</p><p style="color:#5E6E68">Clip 20 s — audio personnel, non publié. ${new Date().toLocaleDateString("fr-FR")} · Saint-Pierre</p></body>`;
              const blob = new Blob([html], { type: "text/html;charset=utf-8" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `kosez-pronlab-${item.id}-resume.html`;
              a.click();
              URL.revokeObjectURL(url);
              toast("Résumé Pron’Lab téléchargé.");
            }}
          >
            Télécharger le clip
          </Button>
        </Surface>
      )}
    </Page>
  );
}
