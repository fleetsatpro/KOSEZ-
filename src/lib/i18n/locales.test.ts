import assert from "node:assert/strict";
import { test } from "node:test";
import { isLearnSurfaceAvailable, learnLanguageDef } from "./locales.ts";

test("learning surface coverage is explicit", () => {
  assert.equal(isLearnSurfaceAvailable("en", "mission"), true);
  assert.equal(isLearnSurfaceAvailable("en", "osez"), true);
  assert.equal(isLearnSurfaceAvailable("es", "pronlab"), true);
  assert.equal(isLearnSurfaceAvailable("es", "mission"), false);
  assert.equal(isLearnSurfaceAvailable("pt", "osez"), false);
  assert.equal(isLearnSurfaceAvailable("cr", "mission"), false);
  assert.equal(isLearnSurfaceAvailable("lsf", "pronlab"), true);
  assert.equal(isLearnSurfaceAvailable("lsf", "library"), false);
});

test("unsupported surface metadata stays truthful", () => {
  assert.deepEqual(learnLanguageDef("fr").contentPacks, []);
  assert.deepEqual(learnLanguageDef("pt").contentPacks, []);
  assert.deepEqual(learnLanguageDef("fr").surfaces, ["pulse"]);
  assert.deepEqual(learnLanguageDef("pt").surfaces, ["pulse"]);
});
