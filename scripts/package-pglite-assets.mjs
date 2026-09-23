#!/usr/bin/env node
/**
 * Copy PGlite's runtime WASM/data assets next to the bundled server module.
 *
 * Nitro/Vercel bundles @electric-sql/pglite into a server function, while
 * PGlite resolves its runtime assets relative to that bundled module. Generic
 * JS bundlers do not reliably preserve new URL("./pglite.data", import.meta.url)
 * for these binary assets, so the final server artifact must contain them
 * explicitly.
 */
import { copyFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const PGLITE_DIST = join(ROOT, "node_modules", "@electric-sql", "pglite", "dist");
const FUNCTIONS_DIR = join(ROOT, ".vercel", "output", "functions");
const ASSETS = ["pglite.wasm", "initdb.wasm", "pglite.data"];

function findPgliteTargets(dir, found = []) {
  if (!existsSync(dir)) return found;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      findPgliteTargets(path, found);
    } else if (entry.isFile() && entry.name === "electric-sql__pglite.mjs") {
      found.push(dirname(path));
    }
  }
  return found;
}

function main() {
  const missing = ASSETS.filter((asset) => !existsSync(join(PGLITE_DIST, asset)));
  if (missing.length > 0) {
    throw new Error(
      `[pglite-assets] package is missing runtime assets: ${missing.join(", ")}`,
    );
  }

  const targets = findPgliteTargets(FUNCTIONS_DIR);
  if (targets.length === 0) {
    throw new Error(
      "[pglite-assets] no bundled @electric-sql/pglite server module found under .vercel/output/functions",
    );
  }

  const copied = new Set();
  for (const target of targets) {
    for (const asset of ASSETS) {
      copyFileSync(join(PGLITE_DIST, asset), join(target, asset));
      copied.add(join(target, asset));
    }
  }

  console.log(
    `[pglite-assets] packaged ${ASSETS.length} asset(s) into ${targets.length} server function target(s) (${copied.size} file(s)).`,
  );
}

try {
  main();
} catch (error) {
  console.error("[pglite-assets] failed:", error?.message || error);
  process.exit(1);
}
