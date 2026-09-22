import { Mic2, Users } from "lucide-react";
import type {
  MissionChallenge,
  MissionMode,
  MissionStep ,
  MissionReflection,
} from "@/lib/blossom/mission";

export const STEPS: Array<{ id: MissionStep; label: string }> = [
  { id: "brief", label: "Entrer" },
  { id: "prepare", label: "Préparer" },
  { id: "execute", label: "Oser" },
  { id: "reflect", label: "Ancrer" },
];

export const MODES: Record<
  MissionMode,
  { title: string; kicker: string; body: string; icon: typeof Users }
> = {
  "real-world": {
    title: "Terrain",
    kicker: "Dans la vraie vie",
    body: "Faites la scène avec une personne réelle, puis consignez ce qui s'est réellement passé.",
    icon: Users,
  },
  practice: {
    title: "Studio",
    kicker: "Répétition guidée",
    body: "Parlez ici. Le micro mesure uniquement la durée de votre prise.",
    icon: Mic2,
  },
};

export const CHALLENGES: Record<
  MissionChallenge,
  { title: string; kicker: string; body: string }
> = {
  core: {
    title: "Fondation",
    kicker: "Le geste essentiel",
    body: "Une ouverture puis un choix. Rien de plus à porter aujourd'hui.",
  },
  stretch: {
    title: "Extension",
    kicker: "Quand le geste tient",
    body: "Même scène, avec une petite relance seulement si elle vient naturellement.",
  },
};

export const DEFAULT_REFLECTION: MissionReflection = {
  objectiveAchieved: true,
  stayedInTargetLanguage: "partly",
  confidence: 3,
  friction: "hesitation",
  supportUsed: false,
};

export type SceneBeat = {
  id: string;
  label: string;
  phrase: string;
  detail: string;
  relancePhrase?: string;
};

export function deriveSceneBeats(
  objective: ReturnType<typeof import("@/lib/blossom/mission").missionObjective>,
): SceneBeat[] {
  const kit = objective.scene?.languageKit ?? [];
  const turns = objective.scene?.conversationTurns ?? [];

  return [
    {
      id: "opening",
      label: "Ouverture",
      phrase: kit[0]?.phrase ?? objective.supportPhrase,
      detail: turns[0]?.goal ?? "Créer l'ouverture sans attendre la phrase parfaite.",
      relancePhrase: kit[1]?.phrase,
    },
    {
      id: "choice",
      label: "Choix",
      phrase: kit[1]?.phrase ?? objective.supportPhrase,
      detail: turns[1]?.goal ?? "Faire un choix simple et continuer l'échange.",
      relancePhrase: kit[2]?.phrase,
    },
    {
      id: "close",
      label: "Clôture",
      phrase: kit[2]?.phrase ?? "Sounds good, thank you.",
      detail: turns[2]?.goal ?? "Fermer l'échange naturellement.",
      relancePhrase: kit[3]?.phrase,
    },
  ];
}

export function formatDuration(seconds: number) {
  if (seconds < 60) return `${seconds} s`;
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes} min${remainder ? ` ${remainder} s` : ""}`;
}

export function speakModel(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-GB";
  utterance.rate = 0.88;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}
