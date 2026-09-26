import { readdir, readFile } from "node:fs/promises";
import { join, relative } from "node:path";
import { cwd } from "node:process";

const ROOT = cwd();
const SELF = "scripts/hardening-audit.mjs";
const SCAN_DIRS = ["src", "scripts", "server", "migrations", ".github"];
const SKIP = new Set(["node_modules", "dist", ".git", ".next", "coverage"]);
const TEXT_EXT = /\.(?:ts|tsx|js|mjs|mts|cjs|css|sql|json|yml|yaml)$/i;
const FORBIDDEN = [
  /\bFIXME\b/i,
  /\bTODO\b/i,
  /\bWIP\b/i,
  /\bTBD\b/i,
  /COMING\s+SOON/i,
  /minimal\s+valid\s+tree/i,
  /\b(?:temporary|sample|dummy|fake)\s+(?:data|implementation|content)\b/i,
  /NOT\s+IMPLEMENTED/i,
  /IMPLEMENT\s+(?:THIS|LATER)/i,
  /LOREM\s+IPSUM/i,
  /^<<<<<<<\s+HEAD/m,
  /^=======\s*$/m,
  /^>>>>>>>\s+/m,
];

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (SKIP.has(entry.name)) continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(path)));
    else if (TEXT_EXT.test(entry.name)) out.push(path);
  }
  return out;
}

const files = (await Promise.all(SCAN_DIRS.map((dir) => walk(join(ROOT, dir)))).then((rows) => rows.flat())).sort();
const findings = [];

for (const file of files) {
  const relativePath = relative(ROOT, file).replaceAll("\\", "/");
  const text = await readFile(file, "utf8");
  if (relativePath !== SELF) {
    for (const pattern of FORBIDDEN) {
      const match = text.match(pattern);
      if (match) findings.push({ file: relativePath, marker: match[0] });
    }
  }
  if (/^(?:<<<<<|=====|>>>>>)/m.test(text)) {
    findings.push({ file: relativePath, marker: "merge-conflict-marker" });
  }
}

const messagesSource = await readFile(join(ROOT, "src/lib/i18n/messages.ts"), "utf8");
if (/const\s+(?:es|pt|de|it)\s*=\s*\{\s*\.\.\.en/i.test(messagesSource)) {
  findings.push({ file: "src/lib/i18n/messages.ts", marker: "locale-inherits-en" });
}
if (/const\s+(?:es|pt|de|it)\s*=\s*\{\s*\.\.\.fr/i.test(messagesSource)) {
  findings.push({ file: "src/lib/i18n/messages.ts", marker: "locale-inherits-fr" });
}

if (findings.length) {
  console.error("K'Osez hardening audit FAILED");
  for (const finding of findings) console.error("- " + finding.file + ": " + finding.marker);
  process.exit(1);
}

console.log("K'Osez hardening audit PASSED — scanned " + files.length + " runtime text files.");
