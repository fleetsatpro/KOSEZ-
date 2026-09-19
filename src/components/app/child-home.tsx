import { Volume2 } from "lucide-react";
import { CHILD } from "@/lib/blossom/data";
import { useBlossom } from "@/lib/blossom/store";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Eyebrow, Page, Surface } from "./primitives";

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
  const done = useBlossom((s) => s.childMissionDone);
  const complete = useBlossom((s) => s.completeChildMission);
  const words = useBlossom((s) => s.childWords);
  const markWord = useBlossom((s) => s.markChildWord);
  const progress = ((done ? 1 : 0) + words.length) / (1 + CHILD.words.length);

  return (
    <Page className="max-w-lg">
      <Eyebrow>Parcours enfant</Eyebrow>
      <h1 className="mt-2 font-display text-4xl tracking-tight">
        Bonjour, {CHILD.firstName}
      </h1>
      <p className="mt-2 text-base leading-relaxed text-muted">
        Une plante, une mission, trois mots. C'est assez pour aujourd'hui.
      </p>

      <div className="mt-8 overflow-hidden rounded-2xl">
        <img
          src="/images/vanilla.jpg"
          alt=""
          className="aspect-hero w-full object-cover"
        />
        <div className="bg-surface px-5 py-4 shadow-[var(--shadow-border)]">
          <p className="text-xs uppercase tracking-[0.16em] text-muted">
            Ton BLOSSOM
          </p>
          <p className="mt-1 font-display text-2xl">{CHILD.stageLabel}</p>
        </div>
      </div>

      <Surface className="mt-5">
        <Eyebrow>Mission d'aujourd'hui</Eyebrow>
        <p className="mt-3 font-display text-2xl">{CHILD.mission.title}</p>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          {CHILD.mission.prompt}
        </p>
        {done ? (
          <p className="mt-5 text-sm text-primary">C'est noté. Tu progresses.</p>
        ) : (
          <Button className="mt-5 w-full" onClick={complete}>
            J'ai parlé
          </Button>
        )}
      </Surface>

      <Surface className="mt-4">
        <Eyebrow>Trois mots</Eyebrow>
        <ul className="mt-4 space-y-3">
          {CHILD.words.map((item) => {
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
        <p className="mt-3 text-xs text-muted">{CHILD.words[2]?.tip}</p>
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
        Revenir à l'espace parent
      </Button>
    </Page>
  );
}
