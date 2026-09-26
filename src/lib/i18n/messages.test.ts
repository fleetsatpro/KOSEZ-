import assert from "node:assert/strict";
import { test } from "node:test";
import { MESSAGES } from "./messages.ts";

const locales = ["fr", "en", "es", "pt", "de", "it"] as const;

function flatten(value: unknown, path = "") {
  if (typeof value === "string") return [[path, value]];
  if (Array.isArray(value)) return value.flatMap((item, index) => flatten(item, path + "[" + index + "]"));
  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([key, child]) =>
      flatten(child, path ? path + "." + key : key),
    );
  }
  return [];
}

test("all UI locale message trees keep one identical shape", () => {
  const source = flatten(MESSAGES.en);
  for (const locale of locales) {
    const target = flatten(MESSAGES[locale]);
    assert.deepEqual(
      target.map(([path]) => path),
      source.map(([path]) => path),
      "message shape drifted for " + locale,
    );
  }
  assert.notEqual(MESSAGES.es.nav.blossomDesc, MESSAGES.en.nav.blossomDesc);
  assert.notEqual(MESSAGES.pt.languages.sectionUi, MESSAGES.en.languages.sectionUi);
  assert.notEqual(MESSAGES.de.welcome.firstName, MESSAGES.en.welcome.firstName);
  assert.notEqual(MESSAGES.it.sync.syncing, MESSAGES.en.sync.syncing);
});
