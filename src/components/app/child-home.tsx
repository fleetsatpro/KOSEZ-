import { Volume2 } from "lucide-react";
import { LANGUAGE_MODULES } from "@/lib/blossom/data";
import { useBlossom, useJourney } from "@/lib/blossom/store";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Eyebrow, Page, Surface } from "./primitives";

const CHILD_WORDS = [
  { id: "child-hello", word: "hello", ipa: "/həˈləʊ/", tip: "Le H est un souffle. Pas « ello »." },
  { id: "child-please", word: "please", ipa: "/pliːz/", tip: "Please est long. Le S vibre." },
  { id: "child-thank-you", word: "thank you", ipa: "/θæŋk ju/", tip: "Thank commence avec un souffle entre les dents." },
] as const;

function speak(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = "en-GB";
  utter.rate = 0.85;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utter);
}

export function ChildHome() {
  const setChildMode = useBlossom((s) => s.setChildMode);
  const setParentMode = useBlossom((s) => s.setParentMode);
  const learner = useBlossom((s) => s.learner);
  const languageId = useBlossom((s) => s.languageId);
  const done = useBlossom((s) => s.childMissionDone);
  const completeChild = useBlossom((s) => s.completeChildMission);
  const completeActivity = useBlossom((s) => s.completeActivity);
  const words = useBlossom((s) => s.childWords);
  const markWord = useBlossom((s) => s.markChildWord);
  const journey = useJourney();
  const language = LANGUAGE_MODULES.find((item) => item.id === languageId)?.name ?? languageId;
  const progress = ((done ? 1 : 0) + words.length) / (1 + CHILD_WORDS.length);

  function completeMission() {
    if (done) return;
    const result = completeActivity("MISSION_COMPLETED", "child-mission");
    if (result.ok) completeChild();
  }

  return (
    <Page className="max-w-lg">
      <Eyebrow>Parcours enfant</Eyebrow>
      <h1 className="mt-2 font-display text-4xl tracking-tight">
        Bonjour{learner.firstName ? `, ${learner.firstName}` : ""}.
      </h1>
      <p className="mt-2 text-base leading-relaxed text-muted">
        Une plante, une mission, trois mots. C’est assez pour aujourd’hui.
      </p>

      <div className="mt-8 overflow-hidden rounded-2xl">
        <img
          src="/images/vanilla.jpg"
          alt=""
          className="aspect-hero w-full object-cover"
        />
        <div className="bg-surface px-5 py-4 shadow-[var(--shadow-border)]">
          <p className="text-xs uppercase tracking-[0.16em] text-muted">Ton BLOSSOM</p>
          <div className="mt-1 flex items-end justify-between gap-3">
            <p className="font-display text-2xl">{journey.stage.label}</p>
            <p className="text-xs text-subtle">{language} · {learner.level}</p>
          </div>
        </div>
      </div>

      <Surface className="mt-5">
        <Eyebrow>Mission d’aujourd’hui</Eyebrow>
        <p className="mt-3 font-display text-2xl">Hello, my name is…</p>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Dis ton prénom, ton âge et un aliment que tu aimes — en anglais.
          Une minute suffit.
        </p>
        {done ? (
          <p className="mt-5 text-sm text-primary">C’est noté dans ton BLOSSOM.</p>
        ) : (
          <Button className="mt-5 w-full" onClick={completeMission}>
            J’ai parlé
          </Button>
        )}
      </Surface>

      <Surface className="mt-4">
        <Eyebrow>Trois mots</Eyebrow>
        <ul className="mt-4 space-y-3">
          {CHILD_WORDS.map((item) => {
            const heard = words.includes(item.id);
            return (
              <li
                key={item.id}
                className="flex items-center justify-between gap-3 rounded-md bg-surface-2 px-3 py-3"
              >
                <div>
                  <p className="font-display text-xl">{item.word}</p>
                  <p className="text-xs text-subtle">{item.ipa}</p>
                </div>
                <Button
                  size="sm"
                  variant={heard ? "secondary" : "default"}
                  onClick={() => {
                    speak(item.word);
                    markWord(item.id);
                  }}
                >
                  <Volume2 className="size-4" />
                  {heard ? "Encore" : "Écouter"}
                </Button>
              </li>
            );
          })}
        </ul>
        <p className="mt-3 text-xs text-muted">
          {CHILD_WORDS[words.length % CHILD_WORDS.length]?.tip}
        </p>
      </Surface>

      <Progress className="mt-6" value={progress * 100} />
      <p className="mt-2 text-center text-xs text-subtle">
        Un adulte voit la semaine. Il ne peut pas parler à ta place.
      </p>

      <Button
        variant="secondary"
        className="mt-8 w-full"
        onClick={() => {
          setChildMode(false);
          setParentMode(true);
        }}
      >
        Revenir à l’espace parent
      </Button>
    </Page>
  );
}
