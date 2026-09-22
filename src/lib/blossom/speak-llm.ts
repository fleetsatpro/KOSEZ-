import type { LivingRoom, GenerateInput } from "./speak-engine.ts";
import { generateLivingRoom } from "./speak-engine.ts";

export type TopicRequest = {
  topic: string;
  level?: string;
  firstName?: string;
  friction?: string | null;
  interests?: string[];
};

const TOPIC_ARCHETYPE_HINTS: Array<{ keys: string[]; archetype: string }> = [
  { keys: ["cafe", "coffee", "coffee shop", "barista", "latte"], archetype: "cafe" },
  { keys: ["marche", "market", "vanille", "vanilla", "fruit", "epicerie"], archetype: "market" },
  { keys: ["aeroport", "airport", "vol", "flight", "boarding", "passeport"], archetype: "airport" },
  { keys: ["hotel", "reception", "check-in", "chambre", "room"], archetype: "hotel" },
  { keys: ["bureau", "office", "travail", "work", "reunion", "meeting", "collegue"], archetype: "office" },
  { keys: ["universite", "campus", "cours", "seminar", "bibliotheque", "student"], archetype: "campus" },
  { keys: ["plage", "mer", "coast", "seafront", "promenade", "ocean"], archetype: "coast" },
  { keys: ["ami", "friend", "soiree", "party", "conversation", "social"], archetype: "social" },
  { keys: ["magasin", "shop", "boutique", "vetement", "acheter"], archetype: "shop" },
  { keys: ["bus", "taxi", "transport", "trajet", "direction"], archetype: "transit" },
  { keys: ["pharmacie", "doctor", "clinique", "sante", "medicament"], archetype: "clinic" },
  { keys: ["entretien", "interview", "job", "embauche"], archetype: "office" },
];

export function inferArchetypeFromTopic(topic: string): string | undefined {
  const normalized = topic.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");
  return TOPIC_ARCHETYPE_HINTS.find((row) =>
    row.keys.some((key) => normalized.includes(key)),
  )?.archetype;
}

export function generateFromTopicOffline(
  topic: string,
  input: GenerateInput = {},
): LivingRoom {
  const clean = topic.trim().slice(0, 120);
  const archetype = input.archetype ?? inferArchetypeFromTopic(clean);
  const room = generateLivingRoom({
    ...input,
    archetype,
    entropy: `topic:${clean.toLowerCase()}|${input.entropy ?? ""}`,
  });

  room.title = `${room.titleFr} · ${clean}`;
  room.protocol = [
    ...room.protocol.slice(0, 2),
    `Sujet libre : « ${clean} » — l'échange tourne autour de cela.`,
    room.protocol[room.protocol.length - 1] ?? "Le bilan arrive après.",
  ];

  room.turns = room.turns.map((turn, index) => {
    if (turn.speaker === "you" && index < 4) {
      return { ...turn, hint: `${turn.hint} (sujet : ${clean})` };
    }
    if (turn.speaker === "ai" && turn.line && index === 2) {
      return { ...turn, line: `${turn.line} — and about ${clean}?` };
    }
    return turn;
  });

  room.culturalNote = `Vous avez choisi le sujet « ${clean} ». ${room.culturalNote}`;
  room.debrief = {
    ...room.debrief,
    model: room.debrief.model.includes(clean)
      ? room.debrief.model
      : `About ${clean} — what do you think?`,
  };
  return room;
}

export function isLlmAvailable(): boolean {
  return import.meta.env.VITE_SPEAK_LLM_ENABLED === "true";
}

export async function buildSpeakRoom(
  opts: TopicRequest & { archetype?: string; entropy?: string },
): Promise<{ room: LivingRoom; source: "llm" | "swarm"; modelId?: string }> {
  const topic = opts.topic?.trim();
  if (!topic) {
    return {
      room: generateLivingRoom({
        archetype: opts.archetype,
        level: opts.level,
        firstName: opts.firstName,
        friction: opts.friction,
        interests: opts.interests,
        entropy: opts.entropy,
      }),
      source: "swarm",
    };
  }

  try {
    const { generateSpeakRoom } = await import("./speak.api.ts");
    return await generateSpeakRoom({
      data: {
        topic,
        level: opts.level,
        firstName: opts.firstName,
        friction: opts.friction,
        interests: opts.interests,
        archetype: opts.archetype,
        entropy: opts.entropy,
      },
    });
  } catch {
    return {
      room: generateFromTopicOffline(topic, opts),
      source: "swarm",
    };
  }
}
