import { Check, Layers, Mic2, Target, Users, BookOpen, Zap } from "lucide-react";
import { toast } from "sonner";
import { Eyebrow, Surface } from "@/components/app/primitives";
import { Badge } from "@/components/ui/badge";
import {
  LEARN_LANGUAGES,
  UI_LOCALES,
  describeLearnLanguage,
  describeUiLocale,
  learnLanguageDef,
  useMessages,
  useUiLocale,
  type LearnLanguageId,
  type UiLocaleId,
} from "@/lib/i18n";
import { useBlossom } from "@/lib/blossom/store";
import { cn } from "@/lib/utils";

const SURFACE_ICON: Record<string, typeof Mic2> = {
  pronlab: Mic2,
  mission: Target,
  osez: Zap,
  tandem: Users,
  library: BookOpen,
  pulse: Zap,
};

/**
 * Dual language control — comprehensive to the tiniest detail:
 *  1) App language (uiLocale) — chrome only (menus, toasts, html lang)
 *  2) Learning language (languageId) — content engine
 *
 * Zero ambiguity: each row shows coverage/engine, packs, speech locale,
 * surfaces touched, CEFR levels, cultural anchor, and exact switch impact.
 * The two axes are fully independent.
 */
export function LanguageSettings() {
  const m = useMessages();
  const uiLocale = useUiLocale();
  const languageId = useBlossom((s) => s.languageId);
  const setUiLocale = useBlossom((s) => s.setUiLocale);
  const setLanguage = useBlossom((s) => s.setLanguage);
  const activeLearn = learnLanguageDef(languageId);

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
                    if (active) return;
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
        <p className="mt-1 text-[11px] leading-5 text-subtle">{m.languages.nativeHint}</p>
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
            const ui = uiLocale;
            const cultural = lang.culturalAnchor?.[ui] ?? lang.culturalAnchor?.fr ?? "";
            const impact = lang.switchImpact?.[ui] ?? lang.switchImpact?.fr ?? "";
            return (
              <li key={lang.id}>
                <button
                  type="button"
                  onClick={() => {
                    if (active) return;
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
                      {lang.levels ? (
                        <>
                          <span aria-hidden>·</span>
                          <span>
                            {m.languages.levels}: {lang.levels.join(" · ")}
                          </span>
                        </>
                      ) : null}
                    </span>
                    <span className="mt-1 block text-[11px] leading-5 text-subtle">
                      {m.languages.packs}:{" "}
                      {lang.contentPacks.length > 0
                        ? lang.contentPacks.join(" · ")
                        : m.languages.packsEmpty}
                    </span>
                    {cultural ? (
                      <span className="mt-1 block text-[11px] leading-5 text-subtle">
                        {m.languages.cultural}: {cultural}
                      </span>
                    ) : null}
                    {lang.surfaces && lang.surfaces.length > 0 ? (
                      <span className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] uppercase tracking-[0.12em] text-subtle">
                          {m.languages.surfaces}:
                        </span>
                        {lang.surfaces.map((s) => {
                          const Icon = SURFACE_ICON[s] ?? Layers;
                          return (
                            <span
                              key={s}
                              className="inline-flex items-center gap-1 rounded-full border border-border/50 px-2 py-0.5 text-[10px] text-muted"
                            >
                              <Icon className="size-2.5" aria-hidden />
                              {s}
                            </span>
                          );
                        })}
                      </span>
                    ) : null}
                    {!active && impact ? (
                      <span className="mt-2 block rounded-md border border-border/40 bg-bg/40 px-2.5 py-1.5 text-[11px] leading-5 text-muted">
                        <span className="font-medium text-fg/80">{m.languages.impactTitle}:</span>{" "}
                        {impact}
                      </span>
                    ) : null}
                  </span>
                  {active ? <Check className="mt-1 size-4 shrink-0 text-primary" /> : null}
                </button>
              </li>
            );
          })}
        </ul>
      </Surface>

      <Surface className="!p-5 border-primary/20">
        <Eyebrow>{m.languages.impactTitle}</Eyebrow>
        <p className="mt-2 text-sm leading-6 text-muted">{m.languages.impactLead}</p>
        <ul className="mt-4 space-y-2.5 text-xs leading-5 text-muted">
          <li className="flex gap-2">
            <Mic2 className="mt-0.5 size-3.5 shrink-0 text-primary" aria-hidden />
            <span>
              {activeLearn.surfaces?.includes("pronlab")
                ? m.languages.impactPronlab
                : m.languages.impactNone}
            </span>
          </li>
          <li className="flex gap-2">
            <Target className="mt-0.5 size-3.5 shrink-0 text-primary" aria-hidden />
            <span>
              {activeLearn.surfaces?.includes("mission")
                ? m.languages.impactMission
                : m.languages.impactNone}
            </span>
          </li>
          <li className="flex gap-2">
            <Users className="mt-0.5 size-3.5 shrink-0 text-primary" aria-hidden />
            <span>
              {activeLearn.surfaces?.includes("tandem")
                ? m.languages.impactTandem
                : m.languages.impactNone}
            </span>
          </li>
          <li className="flex gap-2">
            <Zap className="mt-0.5 size-3.5 shrink-0 text-primary" aria-hidden />
            <span>
              {activeLearn.surfaces?.includes("osez") || activeLearn.surfaces?.includes("pulse")
                ? m.languages.impactOsez
                : m.languages.impactNone}
            </span>
          </li>
          <li className="flex gap-2">
            <Layers className="mt-0.5 size-3.5 shrink-0 text-primary" aria-hidden />
            <span>
              {m.languages.impactSpeech}: <code className="text-fg/80">{activeLearn.speechLocale}</code>
            </span>
          </li>
        </ul>
        <p className="mt-3 text-[11px] leading-5 text-subtle">
          {activeLearn.switchImpact?.[uiLocale] ?? activeLearn.switchImpact?.fr ?? ""}
        </p>
      </Surface>
    </div>
  );
}
