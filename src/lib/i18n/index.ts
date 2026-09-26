import { useEffect } from "react";
import { useBlossom } from "@/lib/blossom/store";
import {
  isUiLocaleId,
  learnLanguageDef,
  uiLocaleDef,
  type UiLocaleId,
} from "./locales";
import { MESSAGES, type MessageTree } from "./messages";

export * from "./locales";
export type { MessageTree } from "./messages";

export function messagesFor(locale: string): MessageTree {
  const id = isUiLocaleId(locale) ? locale : "fr";
  return MESSAGES[id] ?? MESSAGES.fr;
}

/** Typed access — prefer this over raw MESSAGES. */
export function t(locale: string): MessageTree {
  return messagesFor(locale);
}

/** Zustand-friendly: current UI locale from store (defaults fr). */
export function useUiLocale(): UiLocaleId {
  const raw = useBlossom((s) => s.uiLocale);
  return isUiLocaleId(raw) ? raw : "fr";
}

export function useMessages(): MessageTree {
  return t(useUiLocale());
}

/** Sync <html lang> + dir when uiLocale changes. */
export function useDocumentLocale(): void {
  const locale = useUiLocale();
  useEffect(() => {
    const def = uiLocaleDef(locale);
    if (typeof document === "undefined") return;
    document.documentElement.lang = def.bcp47;
    document.documentElement.dir = def.dir;
  }, [locale]);
}

export function describeLearnLanguage(languageId: string, uiLocale: string) {
  const learn = learnLanguageDef(languageId);
  const ui = isUiLocaleId(uiLocale) ? uiLocale : "fr";
  return {
    def: learn,
    label: learn.nameIn[ui] ?? learn.nativeName,
    blurb: learn.blurb[ui] ?? learn.blurb.fr,
  };
}

export function describeUiLocale(localeId: string, uiLocale: string) {
  const def = uiLocaleDef(localeId);
  const ui = isUiLocaleId(uiLocale) ? uiLocale : "fr";
  return {
    def,
    label: def.nameIn[ui] ?? def.nativeName,
    note: def.note[ui] ?? def.note.fr,
  };
}
