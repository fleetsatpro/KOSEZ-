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
