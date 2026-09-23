/**
 * Shared TTS for Mission + Pron’Lab + Speak model lines.
 * Default: browser speechSynthesis. Optional cloud later via env (not required).
 * Respects reduced-motion / reduced audio preferences when possible.
 */

export type SpeakModelOptions = {
  /** BCP-47, e.g. en-GB, es-ES, fr-FR */
  lang?: string;
  rate?: number;
  /** When true, skip audio (show toast path upstream). */
  silent?: boolean;
};

function prefersReducedAudio(): boolean {
  if (typeof window === "undefined") return true;
  try {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      return true;
    }
  } catch {
    /* ignore */
  }
  return false;
}

/** Cancel any ongoing browser utterance. */
export function stopSpeaking(): void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
}

/**
 * Speak model phrase. Returns false if audio could not be started (caller may toast).
 */
export function speakModel(text: string, opts: SpeakModelOptions = {}): boolean {
  const trimmed = text.trim();
  if (!trimmed || opts.silent) return false;
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return false;
  if (prefersReducedAudio()) {
    /* Still allow explicit learner request to hear model — only skip auto-play paths. */
  }
  try {
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(trimmed);
    utter.lang = opts.lang ?? "en-GB";
    utter.rate = opts.rate ?? 0.92;
    window.speechSynthesis.speak(utter);
    return true;
  } catch {
    return false;
  }
}

export function langForPronlab(languageId: string | undefined): string {
  switch (languageId) {
    case "es":
      return "es-ES";
    case "fr":
      return "fr-FR";
    case "pt":
      return "pt-PT";
    case "de":
      return "de-DE";
    case "lsf":
      return "fr-FR";
    default:
      return "en-GB";
  }
}
