/**
 * Online LLM bridge for Speak Rooms.
 * Supports OpenAI-compatible endpoints (Ollama, vLLM, OpenRouter, Groq…).
 * Falls back to pure offline swarm when offline or unset.
 */

import type { LivingRoom, GenerateInput } from "./speak-engine.ts";
import { generateLivingRoom, roomBriefForLlm } from "./speak-engine.ts";

export type TopicRequest = {
  topic: string;
  level?: string;
  firstName?: string;
  friction?: string | null;
  interests?: string[];
};

const TOPIC_ARCHETYPE_HINTS: Array<{ keys: string[]; archetype: string }> = [
  { keys: ["café", "cafe", "coffee", "coffee shop", "barista", "latte"], archetype: "cafe" },
  { keys: ["marché", "market", "vanille", "vanilla", "fruit", "épicerie"], archetype: "market" },
  { keys: ["aéroport", "airport", "vol", "flight", "boarding", "passeport"], archetype: "airport" },
  { keys: ["hôtel", "hotel", "réception", "check-in", "chambre", "room"], archetype: "hotel" },
  { keys: ["bureau", "office", "travail", "work", "réunion", "meeting", "collègue"], archetype: "office" },
  { keys: ["université", "campus", "cours", "seminar", "bibliothèque", "student"], archetype: "campus" },
  { keys: ["plage", "mer", "coast", "seafront", "promenade", "océan"], archetype: "coast" },
  { keys: ["ami", "friend", "soirée", "party", "conversation", "social"], archetype: "social" },
  { keys: ["magasin", "shop", "boutique", "vêtement", "acheter"], archetype: "shop" },
  { keys: ["bus", "taxi", "transport", "trajet", "direction"], archetype: "transit" },
  { keys: ["pharmacie", "doctor", "clinique", "santé", "médicament"], archetype: "clinic" },
  { keys: ["entretien", "interview", "job", "embauche"], archetype: "office" },
];

export function inferArchetypeFromTopic(topic: string): string | undefined {
  const t = topic.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");
  for (const row of TOPIC_ARCHETYPE_HINTS) {
    if (row.keys.some((k) => t.includes(k))) return row.archetype;
  }
  return undefined;
}

/** Offline: swarm + topic woven into title, pressure, hints */
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

  // Weave topic into the living surface
  room.title = `${room.titleFr} · ${clean}`;
  room.protocol = [
    ...room.protocol.slice(0, 2),
    `Sujet libre : « ${clean} » — l'échange tourne autour de cela.`,
    room.protocol[room.protocol.length - 1] ?? "Le bilan arrive après.",
  ];

  // Inject topic into you-hints and one AI line
  room.turns = room.turns.map((turn, i) => {
    if (turn.speaker === "you" && i < 4) {
      return {
        ...turn,
        hint: `${turn.hint} (sujet : ${clean})`,
      };
    }
    if (turn.speaker === "ai" && turn.line && i === 2) {
      return {
        ...turn,
        line: `${turn.line} — and about ${clean}?`,
      };
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

/** One OpenAI-compatible endpoint + model slot */
export type LlmSlot = {
  id: string;
  url: string;
  model: string;
  apiKey?: string;
};

/**
 * Resolve ordered cascade of models from env.
 *
 * Priority (first available wins, then next on failure):
 *  1. VITE_SPEAK_LLM_URL + VITE_SPEAK_LLM_MODEL (+ KEY)
 *  2. VITE_SPEAK_LLM_2_URL + VITE_SPEAK_LLM_2_MODEL (+ KEY)   — secondary
 *  3. VITE_SPEAK_LLM_3_URL + VITE_SPEAK_LLM_3_MODEL (+ KEY)   — tertiary
 *  4. VITE_OPENAI_BASE_URL + VITE_OPENAI_MODEL (+ KEY)        — generic fallback
 *
 * Presets (optional shortcuts — set URL only):
 *  - Groq:    VITE_SPEAK_LLM_URL=https://api.groq.com/openai/v1
 *  - OpenRouter: VITE_SPEAK_LLM_URL=https://openrouter.ai/api/v1
 *  - Ollama:  VITE_SPEAK_LLM_URL=http://localhost:11434/v1
 *  - vLLM:    VITE_SPEAK_LLM_URL=http://host:8000/v1
 */
export function resolveModelCascade(): LlmSlot[] {
  if (typeof import.meta === "undefined") return [];
  const env = (import.meta as { env?: Record<string, string> }).env ?? {};
  const slots: LlmSlot[] = [];

  const push = (
    id: string,
    urlRaw: string | undefined,
    modelRaw: string | undefined,
    keyRaw: string | undefined,
    defaultModel: string,
  ) => {
    const url = (urlRaw ?? "").trim().replace(/\/$/, "");
    if (!url) return;
    slots.push({
      id,
      url,
      model: (modelRaw ?? "").trim() || defaultModel,
      apiKey: (keyRaw ?? "").trim() || undefined,
    });
  };

  push(
    "primary",
    env.VITE_SPEAK_LLM_URL,
    env.VITE_SPEAK_LLM_MODEL,
    env.VITE_SPEAK_LLM_KEY,
    "llama-3.1-8b-instant",
  );
  push(
    "secondary",
    env.VITE_SPEAK_LLM_2_URL,
    env.VITE_SPEAK_LLM_2_MODEL,
    env.VITE_SPEAK_LLM_2_KEY,
    "llama-3.1-8b-instant",
  );
  push(
    "tertiary",
    env.VITE_SPEAK_LLM_3_URL,
    env.VITE_SPEAK_LLM_3_MODEL,
    env.VITE_SPEAK_LLM_3_KEY,
    "gpt-4o-mini",
  );
  // Generic OpenAI-compatible fallback (only if not already added via primary)
  if (!env.VITE_SPEAK_LLM_URL && env.VITE_OPENAI_BASE_URL) {
    push(
      "openai",
      env.VITE_OPENAI_BASE_URL,
      env.VITE_OPENAI_MODEL,
      env.VITE_OPENAI_API_KEY,
      "gpt-4o-mini",
    );
  }

  return slots;
}

export function isLlmAvailable(): boolean {
  return resolveModelCascade().length > 0;
}

/** @deprecated use resolveModelCascade */
function getClientLlmConfig(): LlmSlot | null {
  return resolveModelCascade()[0] ?? null;
}

type LlmRoomPayload = {
  title?: string;
  setting?: string;
  cast?: { role: string; name: string; stance: string };
  pressure?: { label: string; description: string };
  turns?: Array<{ speaker: "ai" | "you"; line?: string; hint: string }>;
  debrief?: { strength: string; improvement: string; model: string };
  culturalNote?: string;
  kit?: Array<{ phrase: string; use: string }>;
};

function mergeLlmIntoRoom(base: LivingRoom, payload: LlmRoomPayload): LivingRoom {
  const turns =
    payload.turns && payload.turns.length >= 4
      ? payload.turns.map((t, i) => ({
          id: `llm-${i}`,
          speaker: t.speaker,
          line: t.line,
          hint: t.hint,
          recovery: base.turns[i]?.recovery ?? [
            "Sorry, could you say that again?",
            "I mean…",
          ],
          beatId: base.turns[i]?.beatId ?? "llm",
          goal: base.turns[i]?.goal ?? "Échanger",
        }))
      : base.turns;

  return {
    ...base,
    title: payload.title?.trim() || base.title,
    setting: payload.setting?.trim() || base.setting,
    cast: payload.cast ?? base.cast,
    pressure: payload.pressure
      ? {
          id: base.pressure.id,
          label: payload.pressure.label,
          description: payload.pressure.description,
        }
      : base.pressure,
    turns,
    debrief: payload.debrief ?? base.debrief,
    culturalNote: payload.culturalNote ?? base.culturalNote,
    kit: payload.kit?.length ? payload.kit.slice(0, 6) : base.kit,
    durationMin: Math.max(4, Math.round(turns.length * 0.9)),
  };
}

function extractJson(text: string): LlmRoomPayload | null {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    return JSON.parse(text.slice(start, end + 1)) as LlmRoomPayload;
  } catch {
    return null;
  }
}

/**
 * Online build: try each model in the cascade until one succeeds.
 * On total failure → offline topic generation (never blocks the learner).
 */
export async function generateFromTopicOnline(
  topic: string,
  input: GenerateInput = {},
): Promise<{ room: LivingRoom; source: "llm" | "swarm" }> {
  const clean = topic.trim().slice(0, 120);
  const base = generateFromTopicOffline(clean, input);
  const cascade = resolveModelCascade();
  if (!cascade.length || !clean) {
    return { room: base, source: "swarm" };
  }

  const brief = roomBriefForLlm(base);
  const system = [
    "You generate short English conversation practice scenes for A2–B1 adults on Réunion island.",
    "Reply with ONLY valid JSON matching this shape:",
    JSON.stringify({
      title: "string",
      setting: "string",
      cast: { role: "string", name: "string", stance: "string" },
      pressure: { label: "string", description: "string" },
      turns: [
        { speaker: "ai", line: "English line", hint: "French hint for learner" },
        { speaker: "you", hint: "French instruction" },
      ],
      debrief: {
        strength: "French",
        improvement: "French",
        model: "English model phrase",
      },
      culturalNote: "French",
      kit: [{ phrase: "English", use: "French" }],
    }),
    "6 to 10 turns alternating ai/you. Keep AI lines natural and short. No markdown.",
  ].join("\n");

  const user = [
    `Topic chosen by learner: ${clean}`,
    `Level: ${input.level ?? "A2"}`,
    `Name: ${input.firstName ?? "Camille"}`,
    brief,
  ].join("\n");

  for (const slot of cascade) {
    try {
      const endpoint = slot.url.includes("/chat/completions")
        ? slot.url
        : `${slot.url}/chat/completions`;
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (slot.apiKey) headers.Authorization = `Bearer ${slot.apiKey}`;

      const res = await fetch(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify({
          model: slot.model,
          temperature: 0.7,
          max_tokens: 1200,
          messages: [
            { role: "system", content: system },
            { role: "user", content: user },
          ],
        }),
        signal: AbortSignal.timeout(22000),
      });

      if (!res.ok) continue;
      const data = (await res.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const text = data.choices?.[0]?.message?.content ?? "";
      const payload = extractJson(text);
      if (!payload) continue;
      return { room: mergeLlmIntoRoom(base, payload), source: "llm" };
    } catch {
      /* try next slot */
    }
  }

  return { room: base, source: "swarm" };
}

/** Unified entry: tries online LLM, always returns a room */
export async function buildSpeakRoom(
  opts: TopicRequest & { archetype?: string; entropy?: string },
): Promise<{ room: LivingRoom; source: "llm" | "swarm" }> {
  const topic = opts.topic?.trim();
  if (topic) {
    return generateFromTopicOnline(topic, {
      archetype: opts.archetype,
      level: opts.level,
      firstName: opts.firstName,
      friction: opts.friction,
      interests: opts.interests,
      entropy: opts.entropy ?? `free:${Date.now()}`,
    });
  }
  const room = generateLivingRoom({
    archetype: opts.archetype,
    level: opts.level,
    firstName: opts.firstName,
    friction: opts.friction,
    interests: opts.interests,
    entropy: opts.entropy,
  });
  return { room, source: "swarm" };
}
