import { apiFetch } from "@/lib/api-client";

export type SpeakSessionStatus = "active" | "completed" | "cancelled";

export type SpeakSessionRecord = {
  id: string;
  roomId: string;
  languageId: string;
  status: SpeakSessionStatus;
  startedAt: string;
  endedAt: string | null;
  durationSeconds: number | null;
};

export async function startSpeakSessionOnServer(input: {
  roomId: string;
  languageId: string;
}): Promise<SpeakSessionRecord> {
  const res = await apiFetch("/api/blossom/speak-session/start", {
    method: "POST",
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error ?? `startSpeakSession failed: ${res.status}`);
  }
  return res.json();
}

export async function endSpeakSessionOnServer(input: {
  sessionId: string;
  status: "completed" | "cancelled";
  durationSeconds?: number;
}): Promise<{ session: SpeakSessionRecord; rewarded: boolean }> {
  const res = await apiFetch("/api/blossom/speak-session/end", {
    method: "POST",
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error ?? `endSpeakSession failed: ${res.status}`);
  }
  return res.json();
}

export async function getActiveSpeakSessionOnServer(): Promise<SpeakSessionRecord | null> {
  const res = await apiFetch("/api/blossom/speak-session/active");
  if (!res.ok) return null;
  const data = await res.json();
  return data?.session ?? null;
}
