/**
 * Server STT cascade for Speak / Pron'Lab.
 * Providers optional — always returns honest capture-only when unset or failed.
 */

import type { SpeechTurnEvidence } from "./speech-stt.ts";

type SttSlot = {
  id: string;
  url: string;
  model: string;
  apiKey?: string;
  timeoutMs: number;
};

function env(key: string): string | undefined {
  const value = process.env[key]?.trim();
  return value || undefined;
}

function resolveSttCascade(): SttSlot[] {
  const slots: SttSlot[] = [];

  const primaryUrl = env("SPEAK_STT_URL") ?? env("OPENAI_BASE_URL");
  const primaryKey = env("SPEAK_STT_API_KEY") ?? env("OPENAI_API_KEY");
  if (primaryUrl && primaryKey) {
    slots.push({
      id: "primary",
      url: primaryUrl.replace(/\/$/, ""),
      model: env("SPEAK_STT_MODEL") ?? "whisper-1",
      apiKey: primaryKey,
      timeoutMs: 28_000,
    });
  } else if (primaryKey) {
    slots.push({
      id: "openai",
      url: "https://api.openai.com/v1",
      model: env("SPEAK_STT_MODEL") ?? "whisper-1",
      apiKey: primaryKey,
      timeoutMs: 28_000,
    });
  }

  const groqKey = env("GROQ_API_KEY");
  if (groqKey && !slots.some((s) => s.url.includes("groq.com"))) {
    slots.push({
      id: "groq",
      url: "https://api.groq.com/openai/v1",
      model: env("GROQ_STT_MODEL") ?? "whisper-large-v3",
      apiKey: groqKey,
      timeoutMs: 25_000,
    });
  }

  return slots;
}

export function isSttConfigured(): boolean {
  return resolveSttCascade().length > 0;
}

async function callWhisperCompatible(
  slot: SttSlot,
  bytes: Uint8Array,
  mimeType: string,
  fileName: string,
): Promise<{ text: string; language?: string } | null> {
  const endpoint = slot.url.includes("/audio/transcriptions")
    ? slot.url
    : `${slot.url}/audio/transcriptions`;

  const form = new FormData();
  const audioBuffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(audioBuffer).set(bytes);
  const blob = new Blob([audioBuffer], { type: mimeType || "audio/webm" });
  form.append("file", blob, fileName || "speak.webm");
  form.append("model", slot.model);
  form.append("response_format", "json");

  const headers: Record<string, string> = {};
  if (slot.apiKey) headers.Authorization = `Bearer ${slot.apiKey}`;

  const res = await fetch(endpoint, {
    method: "POST",
    headers,
    body: form,
    signal: AbortSignal.timeout(slot.timeoutMs),
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { text?: string; language?: string };
  const text = data.text?.trim();
  if (!text) return null;
  return { text: text.slice(0, 500), language: data.language };
}

export async function transcribeSpeechAudio(input: {
  audioBase64: string;
  mimeType?: string;
  seconds?: number;
  fileName?: string;
}): Promise<SpeechTurnEvidence> {
  const seconds = Math.max(0, Math.round(input.seconds ?? 0));
  const at = new Date().toISOString();

  if (!input.audioBase64 || input.audioBase64.length < 32) {
    return { seconds, assessment: "capture-only", at };
  }

  let bytes: Uint8Array;
  try {
    const raw = Buffer.from(input.audioBase64, "base64");
    if (raw.byteLength < 64 || raw.byteLength > 1_500_000) {
      return { seconds, assessment: "capture-only", at };
    }
    bytes = new Uint8Array(raw);
  } catch {
    return { seconds, assessment: "error", at };
  }

  const cascade = resolveSttCascade();
  if (!cascade.length) {
    return { seconds, assessment: "capture-only", at };
  }

  const mime = input.mimeType || "audio/webm";
  const fileName = input.fileName || "speak.webm";

  for (const slot of cascade) {
    try {
      const result = await callWhisperCompatible(slot, bytes, mime, fileName);
      if (result?.text) {
        return {
          seconds,
          assessment: "transcript",
          transcript: result.text,
          language: result.language,
          providerId: slot.id,
          at,
        };
      }
    } catch {
      /* try next */
    }
  }

  return { seconds, assessment: "capture-only", at };
}
