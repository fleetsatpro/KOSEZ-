/**
 * Speak Rooms — online composition bridge.
 * Multi-model cascade (OpenAI-compatible). Learner never sees provider names.
 * Final fallback: pure offline swarm — always returns a room.
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

/** Provider slot — ordered cascade. First success wins. */
export type SpeakModelSlot = {
  id: string;
  /** OpenAI-compatible base URL (…/v1 or full …/chat/completions) */
  url: string;
  model: string;
  apiKey?: string;
  /** Soft timeout ms */
  timeoutMs?: number;
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
  const t = topic.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");
  for (const row of TOPIC_ARCHETYPE_HINTS) {
    if (row.keys.some((k) => t.includes(k))) return row.archetype;
  }
  return undefined;
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

  room.turns = room.turns.map((turn, i) => {
    if (turn.speaker === "you" && i < 4) {
      return { ...turn, hint: `${turn.hint} (sujet : ${clean})` };
    }
    if (turn.speaker === "ai" && turn.line && i === 2) {
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

function env(): Record<string, string> {
  if (typeof import.meta === "undefined") return {};
  return ((import.meta as { env?: Record<string, string> }).env ?? {}) as Record<
    string,
    string
  >;
}

/**
 * Build ordered model cascade from env.
 *
 * Primary:
 *   VITE_SPEAK_LLM_URL + VITE_SPEAK_LLM_MODEL + VITE_SPEAK_LLM_KEY
 * Fallbacks (optional, comma-separated parallel lists):
 *   VITE_SPEAK_LLM_FALLBACK_URLS
 *   VITE_SPEAK_LLM_FALLBACK_MODELS
 *   VITE_SPEAK_LLM_FALLBACK_KEYS   (same length; empty slot = no key)
 *
 * Also accepts single-provider aliases:
 *   VITE_OPENAI_BASE_URL / VITE_OPENAI_MODEL / VITE_OPENAI_API_KEY
 *   VITE_GROQ_API_KEY → https://api.groq.com/openai/v1 + llama-3.3-70b-versatile
 *   VITE_OPENROUTER_API_KEY → https://openrouter.ai/api/v1 + meta-llama/llama-3.1-8b-instruct
 */
export function resolveModelCascade(): SpeakModelSlot[] {
  const e = env();
  const slots: SpeakModelSlot[] = [];

  const primaryUrl = (e.VITE_SPEAK_LLM_URL || e.VITE_OPENAI_BASE_URL || "").trim();
  if (primaryUrl) {
    slots.push({
      id: "primary",
      url: primaryUrl.replace(/\/$/, ""),
      model:
        e.VITE_SPEAK_LLM_MODEL ||
        e.VITE_OPENAI_MODEL ||
        "llama-3.1-8b-instruct",
      apiKey: e.VITE_SPEAK_LLM_KEY || e.VITE_OPENAI_API_KEY || undefined,
      timeoutMs: 22000,
    });
  }

  const fbUrls = (e.VITE_SPEAK_LLM_FALLBACK_URLS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const fbModels = (e.VITE_SPEAK_LLM_FALLBACK_MODELS || "")
    .split(",")
    .map((s) => s.trim());
  const fbKeys = (e.VITE_SPEAK_LLM_FALLBACK_KEYS || "")
    .split(",")
    .map((s) => s.trim());

  fbUrls.forEach((url, i) => {
    slots.push({
      id: `fallback-${i + 1}`,
      url: url.replace(/\/$/, ""),
      model: fbModels[i] || slots[0]?.model || "llama-3.1-8b-instruct",
      apiKey: fbKeys[i] || undefined,
      timeoutMs: 18000,
    });
  });

  // Convenience presets (only if not already listed)
  if (e.VITE_GROQ_API_KEY && !slots.some((s) => s.url.includes("groq.com"))) {
    slots.push({
      id: "groq",
      url: "https://api.groq.com/openai/v1",
      model: e.VITE_GROQ_MODEL || "llama-3.3-70b-versatile",
      apiKey: e.VITE_GROQ_API_KEY,
      timeoutMs: 20000,
    });
  }
  if (
    e.VITE_OPENROUTER_API_KEY &&
    !slots.some((s) => s.url.includes("openrouter.ai"))
  ) {
    slots.push({
      id: "openrouter",
      url: "https://openrouter.ai/api/v1",
      model:
        e.VITE_OPENROUTER_MODEL || "meta-llama/llama-3.1-8b-instruct",
      apiKey: e.VITE_OPENROUTER_API_KEY,
      timeoutMs: 25000,
    });
  }

  // Dedupe by url+model
  const seen = new Set<string>();
  return slots.filter((s) => {
    const k = `${s.url}|${s.model}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

/** True if at least one online slot is configured (not shown to learners). */
export function isLlmAvailable(): boolean {
  return resolveModelCascade().length > 0;
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

async function callSlot(
  slot: SpeakModelSlot,
  system: string,
  user: string,
): Promise<LlmRoomPayload | null> {
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
    signal: AbortSignal.timeout(slot.timeoutMs ?? 20000),
  });

  if (!res.ok) return null;
  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const text = data.choices?.[0]?.message?.content ?? "";
  return extractJson(text);
}

export async function generateFromTopicOnline(
  topic: string,
  input: GenerateInput = {},
): Promise<{ room: LivingRoom; source: "llm" | "swarm"; modelId?: string }> {
  const clean = topic.trim().slice(0, 120);
  const base = generateFromTopicOffline(clean, input);
  const cascade = resolveModelCascade();
  if (!cascade.length || !clean) {
    return { room: base, source: "swarm" };
  }

  const brief = roomBriefForLlm(base);
  const system = [
    "You generate short English conversation practice scenes for A2-B1 adults on Reunion island.",
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
      const payload = await callSlot(slot, system, user);
      if (payload) {
        return {
          room: mergeLlmIntoRoom(base, payload),
          source: "llm",
          modelId: slot.id,
        };
      }
    } catch {
      // try next slot
    }
  }

  return { room: base, source: "swarm" };
}

export async function buildSpeakRoom(
  opts: TopicRequest & { archetype?: string; entropy?: string },
): Promise<{ room: LivingRoom; source: "llm" | "swarm"; modelId?: string }> {
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
