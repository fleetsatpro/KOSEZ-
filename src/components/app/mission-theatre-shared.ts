import { Mic2, Users } from "lucide-react";
import type {
  MissionChallenge,
  MissionMode,
  MissionStep,
  MissionReflection,
} from "@/lib/blossom/mission";

export const STEPS: Array<{ id: MissionStep; label: string }> = [
  { id: "brief", label: "Entrer" },
  { id: "prepare", label: "Préparer" },
  { id: "execute", label: "Oser" },
  { id: "reflect", label: "Ancrer" },
];

export const MODES: Record<MissionMode, {
  title: string;
  kicker: string;
  body: string;
  icon: typeof Users;
}> = {
  "real-world": {
    title: "Terrain",
    kicker: "Dans la vraie vie",
    body: "Faites la scène avec une personne réelle, puis consignez ce qui s'est réellement passé.",
    icon: Users,
  },
  practice: {
    title: "Studio",
    kicker: "Répétition guidée",
    body: "Parlez ici. Le micro mesure uniquement la durée de votre prise de parole.",
    icon: Mic2,
  },
};

export const CHALLENGES: Record<MissionChallenge, {
  title: string;
  kicker: string;
  body: string;
}> = {
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
  stayedInTargetLanguage: "partly" as const,
  confidence: 3 as const,
  friction: "hesitation" as const,
};

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
