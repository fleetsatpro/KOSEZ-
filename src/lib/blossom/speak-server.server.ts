import type { GenerateInput, LivingRoom } from "./speak-engine.ts";
import { generateLivingRoom, roomBriefForLlm } from "./speak-engine.ts";

type ServerTopicRequest = {
  topic: string;
  level?: string;
  firstName?: string;
  friction?: string | null;
  interests?: string[];
  archetype?: string;
  entropy?: string;
};

type SpeakModelSlot = {
  id: string;
  url: string;
  model: string;
  apiKey?: string;
  timeoutMs: number;
};

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

const REQUEST_WINDOW_MS = 60_000;
const REQUEST_LIMIT = 12;
const userWindows = new Map<string, number[]>();

function env(key: string): string | undefined {
  const value = process.env[key]?.trim();
  return value || undefined;
}

function csv(key: string): string[] {
  return (env(key) ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

function resolveModelCascade(): SpeakModelSlot[] {
  const slots: SpeakModelSlot[] = [];
  const primaryUrl = env("SPEAK_LLM_URL");
  if (primaryUrl) {
    slots.push({
      id: "primary",
      url: primaryUrl.replace(/\/$/, ""),
      model: env("SPEAK_LLM_MODEL") ?? "llama-3.1-8b-instruct",
      apiKey: env("SPEAK_LLM_API_KEY"),
      timeoutMs: 22_000,
    });
  }

  const urls = csv("SPEAK_LLM_FALLBACK_URLS");
  const models = csv("SPEAK_LLM_FALLBACK_MODELS");
  const keys = csv("SPEAK_LLM_FALLBACK_KEYS");
  urls.forEach((url, index) => {
    slots.push({
      id: `fallback-${index + 1}`,
      url: url.replace(/\/$/, ""),
      model: models[index] ?? slots[0]?.model ?? "llama-3.1-8b-instruct",
      apiKey: keys[index],
      timeoutMs: 18_000,
    });
  });

  const groqKey = env("GROQ_API_KEY");
  if (groqKey && !slots.some((slot) => slot.url.includes("groq.com"))) {
    slots.push({
      id: "groq",
      url: "https://api.groq.com/openai/v1",
      model: env("GROQ_MODEL") ?? "llama-3.3-70b-versatile",
      apiKey: groqKey,
      timeoutMs: 20_000,
    });
  }

  const openRouterKey = env("OPENROUTER_API_KEY");
  if (openRouterKey && !slots.some((slot) => slot.url.includes("openrouter.ai"))) {
    slots.push({
      id: "openrouter",
      url: "https://openrouter.ai/api/v1",
      model: env("OPENROUTER_MODEL") ?? "meta-llama/llama-3.1-8b-instruct",
      apiKey: openRouterKey,
      timeoutMs: 25_000,
    });
  }

  const seen = new Set<string>();
  return slots.filter((slot) => {
    const key = `${slot.url}|${slot.model}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function assertRateLimit(userId: string) {
  const now = Date.now();
  const recent = (userWindows.get(userId) ?? []).filter(
    (stamp) => now - stamp < REQUEST_WINDOW_MS,
  );
  if (recent.length >= REQUEST_LIMIT) throw new Error("speak-rate-limit");
  recent.push(now);
  userWindows.set(userId, recent);
}

function mergeLlmIntoRoom(base: LivingRoom, payload: LlmRoomPayload): LivingRoom {
  const turns =
    payload.turns && payload.turns.length >= 4
      ? payload.turns.slice(0, 10).map((turn, index) => ({
          id: `llm-${index}`,
          speaker: turn.speaker,
          line: turn.line,
          hint: turn.hint,
          recovery: base.turns[index]?.recovery ?? [
            "Sorry, could you say that again?",
            "I mean…",
          ],
          beatId: base.turns[index]?.beatId ?? "llm",
          goal: base.turns[index]?.goal ?? "Échanger",
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
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (slot.apiKey) headers.Authorization = `Bearer ${slot.apiKey}`;
  const referer = env("SPEAK_LLM_REFERER");
  const title = env("SPEAK_LLM_TITLE");
  if (referer) headers["HTTP-Referer"] = referer;
  if (title) headers["X-Title"] = title;

  const response = await fetch(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: slot.model,
      temperature: 0.65,
      max_tokens: 1400,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
    signal: AbortSignal.timeout(slot.timeoutMs),
  });
  if (!response.ok) return null;
  const body = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  return extractJson(body.choices?.[0]?.message?.content ?? "");
}

export async function composeSpeakRoom(
  input: ServerTopicRequest,
  userId: string,
): Promise<{ room: LivingRoom; source: "llm" | "swarm"; modelId?: string }> {
  assertRateLimit(userId);

  const clean = input.topic.trim().slice(0, 120);
  const baseInput: GenerateInput = {
    archetype: input.archetype,
    level: input.level,
    firstName: input.firstName,
    friction: input.friction,
    interests: input.interests,
    entropy: input.entropy,
  };

  const base = generateLivingRoom(baseInput);
  if (!clean) return { room: base, source: "swarm" };

  base.title = `${base.titleFr} · ${clean}`;
  const cascade = resolveModelCascade();
  if (!cascade.length) {
    return {
      room: {
        ...base,
        culturalNote: `Vous avez choisi le sujet « ${clean} ». ${base.culturalNote}`,
      },
      source: "swarm",
    };
  }

  const brief = roomBriefForLlm(base);
  const system = [
    "Generate safe, concise language-practice scenes for adult A2-B1 learners.",
    "The learner's selected topic is the semantic anchor; do not introduce sensitive personal-data requests.",
    "Reply ONLY with valid JSON. No markdown.",
    JSON.stringify({
      title: "string",
      setting: "string",
      cast: { role: "string", name: "string", stance: "string" },
      pressure: { label: "string", description: "string" },
      turns: [
        { speaker: "ai", line: "short English line", hint: "French guidance" },
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
  ].join("\n");

  const user = [
    `Learner topic: ${clean}`,
    `Level: ${input.level ?? "A2"}`,
    `Learner first name: ${input.firstName ?? "Camille"}`,
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
      // Provider failures fall through to the next configured slot.
    }
  }

  return { room: base, source: "swarm" };
}
