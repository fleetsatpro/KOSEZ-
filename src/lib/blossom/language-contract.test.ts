import assert from "node:assert/strict";
import { test } from "node:test";
import { setsForLanguage } from "./data.ts";
import { LEARN_LANGUAGES, isLearnLanguageId, learnLanguageDef } from "../i18n/locales.ts";

test("PronLab selection is strictly target-language scoped", () => {
  for (const id of ["en", "es", "fr", "pt", "it", "de", "cr", "lsf"]) {
    const sets = setsForLanguage(id);
    for (const set of sets) {
      const canonical = !set.language || set.language === "English" ? "en" : set.language;
      assert.equal(canonical, id, "cross-language set leaked for " + id);
    }
  }
});

test("English and Spanish local catalogs remain independently addressable", () => {
  const en = setsForLanguage("en");
  const es = setsForLanguage("es");
  const lsf = setsForLanguage("lsf");
  assert.ok(en.length > 0);
  assert.ok(es.length > 0);
  assert.ok(lsf.length > 0);
  assert.equal(en.every((set) => !set.language || set.language === "English"), true);
  assert.equal(es.every((set) => set.language === "es"), true);
  assert.equal(lsf.every((set) => set.language === "lsf"), true);
});

test("canUseLearningSurface gates by language pack surfaces", () => {
  function canUse(languageId: string, surface: string): boolean {
    if (!isLearnLanguageId(languageId)) return false;
    const def = learnLanguageDef(languageId);
    if (surface === "learn") {
      return def.surfaces.some(
        (s) => s === "pronlab" || s === "mission" || s === "library" || s === "pulse",
      );
    }
    if (surface === "explore") return true;
    return (def.surfaces as string[]).includes(surface);
  }
  assert.equal(canUse("en", "mission"), true);
  assert.equal(canUse("en", "osez"), true);
  assert.equal(canUse("en", "pronlab"), true);
  assert.equal(canUse("de", "pulse"), true);
  assert.equal(canUse("de", "mission"), false);
  assert.equal(canUse("de", "pronlab"), false);
  assert.equal(canUse("unknown-lang", "mission"), false);
  assert.equal(canUse("en", "explore"), true);
});
