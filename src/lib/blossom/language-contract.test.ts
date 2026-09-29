import assert from "node:assert/strict";
import { test } from "node:test";
import { setsForLanguage } from "./data.ts";

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

test("surface capabilities match the actual language contract", async () => {
  const { canUseLearningSurface } = await import("../i18n/locales.ts");
  assert.equal(canUseLearningSurface("en", "mission"), true);
  assert.equal(canUseLearningSurface("en", "osez"), true);
  assert.equal(canUseLearningSurface("en", "library"), true);
  assert.equal(canUseLearningSurface("fr", "mission"), false);
  assert.equal(canUseLearningSurface("fr", "osez"), false);
  assert.equal(canUseLearningSurface("fr", "pulse"), true);
  assert.equal(canUseLearningSurface("lsf", "mission"), false);
  assert.equal(canUseLearningSurface("lsf", "library"), false);
});


test("curriculum and labs capability is explicit", async () => {
  const { canUseLearningSurface } = await import("../i18n/locales.ts");
  assert.equal(canUseLearningSurface("en", "curriculum"), true);
  assert.equal(canUseLearningSurface("en", "labs"), true);
  assert.equal(canUseLearningSurface("fr", "curriculum"), false);
  assert.equal(canUseLearningSurface("fr", "labs"), false);
});
