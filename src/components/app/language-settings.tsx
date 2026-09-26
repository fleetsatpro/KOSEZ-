import { Check } from "lucide-react";
import { toast } from "sonner";
import { Eyebrow, Surface } from "@/components/app/primitives";
import { Badge } from "@/components/ui/badge";
import {
  LEARN_LANGUAGES,
  UI_LOCALES,
  describeLearnLanguage,
  describeUiLocale,
  useMessages,
  useUiLocale,
  type LearnLanguageId,
  type UiLocaleId,
} from "@/lib/i18n";
import { useBlossom } from "@/lib/blossom/store";
import { cn } from "@/lib/utils";

/**
 * Dual language control:
 *  1) App language (uiLocale) — chrome only
 *  2) Learning language (languageId) — content engine
 * Zero ambiguity: each row shows coverage/engine, packs, speech locale, notes.
 */
export function LanguageSettings() {
  const m = useMessages();
  const uiLocale = useUiLocale();
  const languageId = useBlossom((s) => s.languageId);
  const setUiLocale = useBlossom((s) => s.setUiLocale);
  const setLanguage = useBlossom((s) => s.setLanguage);

  return (
    <div className="space-y-4">
      <Surface className="!p-5">
        <Eyebrow>{m.languages.sectionUi}</Eyebrow>
        <p className="mt-2 text-sm leading-6 text-muted">{m.languages.sectionUiLead}</p>
        <p className="mt-2 text-xs leading-5 text-subtle">{m.languages.independentNote}</p>
        <ul className="mt-4 divide-y divide-border/60">
          {UI_LOCALES.map((locale) => {
            const active = uiLocale === locale.id;
            const { label, note } = describeUiLocale(locale.id, uiLocale);
            const coverageLabel =
              locale.coverage === "full"
                ? m.languages.coverageFull
                : locale.coverage === "partial"
                  ? m.languages.coveragePartial
                  : m.languages.coveragePlanned;
            return (
              <li key={locale.id}>
                <button
                  type="button"
                  onClick={() => {
                    setUiLocale(locale.id as UiLocaleId);
                    toast(m.languages.changedUi);
                  }}
                  className={cn(
                    "flex w-full items-start gap-3 py-3.5 text-left transition-colors",
                    active ? "text-primary" : "text-fg hover:text-primary",
                  )}
                  aria-pressed={active}
                  aria-label={`${label} — ${coverageLabel}`}
                >
                  <span className="mt-0.5 text-lg" aria-hidden>
                    {locale.flag}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{label}</span>
                      <span className="text-xs text-subtle">{locale.nativeName}</span>
                      {active ? <Badge>{m.languages.active}</Badge> : null}
                    </span>
                    <span className="mt-1 block text-xs leading-5 text-muted">{note}</span>
                    <span className="mt-1.5 flex flex-wrap gap-2 text-[10px] uppercase tracking-[0.12em] text-subtle">
                      <span>{coverageLabel}</span>
                      <span aria-hidden>·</span>
                      <span>
                        {m.languages.htmlLang}: {locale.bcp47}
                      </span>
                      <span aria-hidden>·</span>
                      <span>{locale.dir.toUpperCase()}</span>
                    </span>
                  </span>
                  {active ? <Check className="mt-1 size-4 shrink-0 text-primary" /> : null}
                </button>
              </li>
            );
          })}
        </ul>
      </Surface>

      <Surface className="!p-5">
        <Eyebrow>{m.languages.sectionLearn}</Eyebrow>
        <p className="mt-2 text-sm leading-6 text-muted">{m.languages.sectionLearnLead}</p>
        <ul className="mt-4 divide-y divide-border/60">
          {LEARN_LANGUAGES.map((lang) => {
            const active = languageId === lang.id;
            const { label, blurb } = describeLearnLanguage(lang.id, uiLocale);
            const engineLabel =
              lang.engine === "active"
                ? m.languages.engineActive
                : lang.engine === "module"
                  ? m.languages.engineModule
                  : lang.engine === "sign"
                    ? m.languages.engineSign
                    : m.languages.engineSame;
            return (
              <li key={lang.id}>
                <button
                  type="button"
                  onClick={() => {
                    setLanguage(lang.id as LearnLanguageId);
                    toast(m.languages.changedLearn);
                  }}
                  className={cn(
                    "flex w-full items-start gap-3 py-3.5 text-left transition-colors",
                    active ? "text-primary" : "text-fg hover:text-primary",
                  )}
                  aria-pressed={active}
                  aria-label={`${label} — ${engineLabel}`}
                >
                  <span className="mt-0.5 text-lg" aria-hidden>
                    {lang.flag}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{label}</span>
                      <span className="text-xs text-subtle">{lang.nativeName}</span>
                      {active ? <Badge>{m.languages.active}</Badge> : null}
                    </span>
                    <span className="mt-1 block text-xs leading-5 text-muted">{blurb}</span>
                    <span className="mt-1.5 flex flex-wrap gap-2 text-[10px] uppercase tracking-[0.12em] text-subtle">
                      <span>{engineLabel}</span>
                      <span aria-hidden>·</span>
                      <span>
                        {m.languages.speech}: {lang.speechLocale}
                      </span>
                    </span>
                    <span className="mt-1 block text-[11px] leading-5 text-subtle">
                      {m.languages.packs}:{" "}
                      {lang.contentPacks.length > 0
                        ? lang.contentPacks.join(" · ")
                        : m.languages.packsEmpty}
                    </span>
                  </span>
                  {active ? <Check className="mt-1 size-4 shrink-0 text-primary" /> : null}
                </button>
              </li>
            );
          })}
        </ul>
      </Surface>
    </div>
  );
}
