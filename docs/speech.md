# Speech evidence (OSEZ + Pron’Lab)

## Honesty

Without STT keys, attempts are **capture-only**: duration is stored, **no transcript and no phonetic score**.

With STT configured, transcription may appear; scores remain **0** until a real pronunciation engine is wired.

## Shared client API

```ts
import { resolveSpeechEvidence, speechAttemptNote } from "@/lib/blossom/speech-stt";

const evidence = await resolveSpeechEvidence(recordResult, { fileName: "turn.webm" });
```

Used by:

- `src/routes/_app/osez.$id.tsx`
- `src/routes/_app/pronlab.$setId.tsx`

Server: `transcribeSpeakTurn` → `speech-server.server.ts` (Whisper-compatible cascade).

## Env (optional STT)

| Variable | Role |
|----------|------|
| `OPENAI_API_KEY` or `SPEAK_STT_API_KEY` | Primary Whisper-compatible key |
| `OPENAI_BASE_URL` or `SPEAK_STT_URL` | Optional custom base URL |
| `SPEAK_STT_MODEL` | Default `whisper-1` |
| `GROQ_API_KEY` | Fallback cascade |
| `GROQ_STT_MODEL` | Default `whisper-large-v3` |

## TTS

`src/lib/blossom/tts.ts` — `speakModel()` / `langForPronlab()` for model lines (browser synthesis).

## Mastery without scores

`summarisePronlabItem` treats repeated captures (≥2 attempts with ≥2s, or 3 attempts totaling ≥6s) as practice mastery when no scored engine exists.
