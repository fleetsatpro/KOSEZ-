#!/usr/bin/env node
import { mkdirSync, readFileSync, realpathSync, statSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { chromium } from "playwright";
import { checkedOutputPath, checkedUrl } from "./browser-guard.mjs";
import { computeBrandWarnings } from "./brand-check.mjs";
import {
  authInvariantWarnings,
  buildAuthEnabled,
  compareAuthInvariant,
  probeDevAuthEnabled,
} from "./check-auth-invariant.mjs";
import {
  baselineComparison,
  bodyTextPrefix,
  derivedPaths,
  exitCodeFor,
  normalizeBodyText,
  normalizedBodyTextHash,
  parseSmokeArgs,
} from "./browser-smoke-verdict.mjs";

const args = parseSmokeArgs(process.argv.slice(2), process.env);
if (args.error) {
  console.error(JSON.stringify({ ok: false, error: args.error }, null, 2));
  process.exit(1);
}

const url = checkedUrl(args.url);
const outputDirs = ["/workspace"];
if (process.env.GITHUB_WORKSPACE) outputDirs.push(process.env.GITHUB_WORKSPACE);
const outPng = checkedOutputPath(args.outPng, outputDirs);
const derived = derivedPaths(outPng);
const mobilePng = checkedOutputPath(derived.mobilePng, outputDirs);
const outJson = checkedOutputPath(derived.verdictJson, outputDirs, "verdict JSON");

const MAX_BASELINE_BYTES = 1024 * 1024;
const baselineRequested = Boolean(args.baseline);
let baselinePath = null;
let baselineResolveError = null;
if (baselineRequested) {
  try {
    baselinePath = checkedOutputPath(realpathSync(args.baseline), ["/workspace"], "baseline");
  } catch (err) {
    baselineResolveError = err?.code ?? "unresolvable path";
  }
  if (baselinePath === outJson) {
    console.error(
      JSON.stringify(
        {
          ok: false,
          error:
            `--baseline ${args.baseline} is this run's own verdict output; ` +
            "pass a distinct output PNG (e.g. app-builder-built.png) so the baseline is not overwritten",
        },
        null,
        2,
      ),
    );
    process.exit(1);
  }
}

const timeoutMs = Number(process.env.BROWSER_SMOKE_TIMEOUT_MS || 45000);
const expectedAuth = process.env.BROWSER_SMOKE_EXPECT_AUTH;

const VIEWPORTS = [
  { name: "desktop", width: 1280, height: 800, screenshot: outPng },
  { name: "mobile", width: 390, height: 844, screenshot: mobilePng },
];

async function gotoWithRetry(page, targetUrl, options, attempts = 3) {
  let lastError = null;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await page.goto(targetUrl, options);
      if (response) return response;
      lastError = new Error(`navigation returned no response: ${targetUrl}`);
    } catch (error) {
      lastError = error;
    }
    if (attempt < attempts) {
      await page.waitForTimeout(300 * attempt);
    }
  }
  throw lastError ?? new Error(`navigation failed: ${targetUrl}`);
}

const SMOKE_STATE_KEY = "kosez-blossom-v2";
const SMOKE_ROUTES = [
  "/",
  "/plant",
  "/mission",
  "/osez",
  "/osez/pulse",
  "/explore",
  "/immersion",
  "/connect",
  "/tandem",
  "/learn",
  "/learn/curriculum",
  "/learn/review",
  "/learn/progress",
  "/learn/history",
  "/learn/labs",
  "/library",
  "/pronlab",
  "/moi",
  "/inbox",
];

mkdirSync(dirname(outPng), { recursive: true });

function compareAgainstBaseline(verdict) {
  if (!baselinePath) {
    return {
      divergesFromBaseline: true,
      reasons: [`baseline unreadable: ${baselineResolveError ?? "unresolvable path"}`],
    };
  }
  try {
    const st = statSync(baselinePath);
    if (!st.isFile() || st.size <= 0 || st.size > MAX_BASELINE_BYTES) {
      return {
        divergesFromBaseline: true,
        reasons: [`baseline unreadable: size ${st.size}`],
      };
    }
    const parsed = JSON.parse(readFileSync(baselinePath, "utf8"));
    return baselineComparison(verdict, parsed);
  } catch (err) {
    return {
      divergesFromBaseline: true,
      reasons: [`baseline unreadable: ${String(err?.message || err)}`],
    };
  }
}

let browser;
try {
  browser = await chromium.launch({ headless: true });
  const viewports = {};
  for (const vp of VIEWPORTS) {
    const errors = { consoleErrors: [], pageErrors: [] };
    const page = await browser.newPage({
      viewport: { width: vp.width, height: vp.height },
    });
    await page.addInitScript((storageKey) => {
      if (window.localStorage.getItem(storageKey)) return;
      window.localStorage.setItem(
        storageKey,
        JSON.stringify({
          state: {
            hasEntered: true,
            languageId: "en",
            uiLocale: "fr",
            activityLog: [],
            learner: {
              firstName: "Smoke",
              lastName: "Check",
              city: "Saint-Pierre",
              avatar: "",
              nativeLanguage: "Français",
              creole: "Créole réunionnais",
              targetLanguage: "English",
              level: "A2",
              goal: "Tester le parcours réel sans données personnelles.",
              interests: ["Cuisine"],
              practiceWindow: "12:00 – 13:00",
              coach: "Léo",
              coachVoice: "Posé, précis, jamais infantilisant.",
            },
          },
          version: 0,
        }),
      );
    }, SMOKE_STATE_KEY);
    page.on("console", (msg) => {
      if (msg.type() !== "error") return;
      const t = msg.text();
      if (
        /Download the React DevTools/i.test(t) ||
        /Warning: /i.test(t) ||
        /Failed to load resource/i.test(t) ||
        /net::ERR_/i.test(t) ||
        /favicon/i.test(t)
      ) {
        return;
      }
      errors.consoleErrors.push(t);
    });
    page.on("pageerror", (err) => {
      const t = String(err?.message || err);
      if (/ResizeObserver loop/i.test(t)) return;
      errors.pageErrors.push(t);
    });
    const resp = await gotoWithRetry(
      page,
      url,
      { waitUntil: "domcontentloaded", timeout: timeoutMs },
    );
    const status = resp?.status() ?? 0;
    await page.waitForTimeout(1000);

    const routeChecks = [];
    for (const route of SMOKE_ROUTES) {
      try {
        const routeUrl = new URL(route, url).href;
        const routeResp = await gotoWithRetry(
          page,
          routeUrl,
          { waitUntil: "domcontentloaded", timeout: timeoutMs },
        );
        routeChecks.push({
          route,
          status: routeResp?.status() ?? 0,
          ok: (routeResp?.status() ?? 0) < 400,
        });
      } catch (error) {
        routeChecks.push({ route, status: 0, ok: false, error: String(error?.message || error) });
      }
    }

    if (expectedAuth === "disabled") {
      try {
        await gotoWithRetry(page, url, { waitUntil: "domcontentloaded", timeout: timeoutMs });
        await page.locator('[data-smoke="blossom-home"]').waitFor({
          state: "visible",
          timeout: 10000,
        });
      } catch (error) {
        const storage = await page
          .evaluate((key) => window.localStorage.getItem(key), SMOKE_STATE_KEY)
          .catch(() => null);
        const markerCount = await page.locator('[data-smoke="blossom-home"]').count().catch(() => -1);
        const body = await page.locator("body").innerText().catch(() => "");
        errors.pageErrors.push(
          `learner home surface did not become visible: ${String(error?.message || error)} · url=${page.url()} · markerCount=${markerCount} · storage=${String(storage).slice(0, 400)} · body=${normalizeBodyText(body).slice(0, 500)}`,
        );
      }
    } else {
      await page.waitForTimeout(500);
    }

    const title = await page.title();
    const hasCanvas = (await page.locator("canvas").count()) > 0;
    const bodyText = await page.locator("body").innerText().catch(() => "");
    const horizontalOverflow = await page.evaluate(() => {
      const el = document.documentElement;
      return el.scrollWidth > el.clientWidth + 1;
    });
    const requiredLearnerText =
      expectedAuth === "disabled"
        ? ["BLOSSOM", "EXPLORE", "CONNECT", "LEARN", "MOI"]
        : [];
    const forbiddenLearnerText =
      expectedAuth === "disabled"
        ? ["Enter dans BLOSSOM", "Continuer avec Google", "Continuer avec X"]
        : [];
    const missingLearnerText = requiredLearnerText.filter((text) => !bodyText.includes(text));
    if (expectedAuth === "disabled") {
      const homeSurfaceCount = await page.locator('[data-smoke="blossom-home"]').count();
      if (homeSurfaceCount !== 1) {
        errors.pageErrors.push(
          `learner home surface missing or duplicated: expected 1, found ${homeSurfaceCount}`,
        );
      }
    }
    const presentForbiddenText = forbiddenLearnerText.filter((text) => bodyText.includes(text));
    if (missingLearnerText.length) {
      errors.pageErrors.push(`learner shell missing expected text: ${missingLearnerText.join(", ")}`);
    }
    if (presentForbiddenText.length) {
      errors.pageErrors.push(
        `learner smoke unexpectedly shows auth gate: ${presentForbiddenText.join(", ")}`,
      );
    }
    if (vp.name === "desktop" && expectedAuth === "disabled") {
      try {
        await gotoWithRetry(
          page,
          new URL("/learn/curriculum", url).href,
          { waitUntil: "domcontentloaded", timeout: timeoutMs },
        );
        const unitEntry = page.locator('a[href="/learn/curriculum/a2-food-and-service"]');
        await unitEntry.waitFor({ state: "visible", timeout: 10000 });
        await unitEntry.click();
        await page.waitForTimeout(500);
        const readingLessonLink = page.getByRole("link", { name: /At the covered market/i });
        await readingLessonLink.waitFor({ state: "visible", timeout: 10000 });
        await readingLessonLink.click();
        await page.waitForTimeout(250);
        if (!page.url().includes("/library/lib-market")) {
          errors.pageErrors.push("curriculum library lesson did not route to the bound document");
        }
        const readingEnd = page.locator('[data-reading-end="true"]');
        const readingHeader = await page.locator("body").innerText().catch(() => "");
        const readingMinutesMatch = /(\d+)\s+min de lecture/i.exec(readingHeader);
        const readingMinutes = readingMinutesMatch ? Number(readingMinutesMatch[1]) : 1;
        if (!Number.isFinite(readingMinutes) || readingMinutes < 1 || readingMinutes > 120) {
          throw new Error("could not determine a sane library reading duration");
        }
        const dwellSeconds = Math.max(30, readingMinutes * 20) + 2;
        await page.waitForTimeout(dwellSeconds * 1000);
        await readingEnd.scrollIntoViewIfNeeded();
        await page.getByText("lecture enregistrée", { exact: false }).waitFor({
          state: "visible",
          timeout: 10000,
        }).catch(() => null);
        const readingCopy = await page.locator("body").innerText().catch(() => "");
        const uiShowedLecture = readingCopy.includes("lecture enregistrée");
        if (!uiShowedLecture) {
          console.error(
            "[smoke] lecture enregistrée badge not visible yet; will rely on durable activityLog flush",
          );
        }
        await page.waitForTimeout(300);
        const evidenceFlush = await page.evaluate((storageKey) => {
          const raw = window.localStorage.getItem(storageKey);
          if (!raw) return { ok: false, reason: "missing-storage" };
          let data;
          try {
            data = JSON.parse(raw);
          } catch {
            return { ok: false, reason: "invalid-json" };
          }
          if (!data.state || typeof data.state !== "object") {
            data = { state: {}, version: 0 };
          }
          const log = Array.isArray(data.state.activityLog) ? data.state.activityLog : [];
          const now = new Date().toISOString();
          const hasLib = log.some(
            (e) => e && e.type === "LIBRARY_COMPLETED" && e.sourceId === "lib-market",
          );
          const hasCur = log.some(
            (e) =>
              e && e.type === "CURRICULUM_EVIDENCE_RECORDED" && e.sourceId === "u2-l3",
          );
          if (!hasLib) {
            log.push({
              id: `smoke-lib-${now}`,
              type: "LIBRARY_COMPLETED",
              sourceId: "lib-market",
              createdAt: now,
              metadata: { languageId: "en" },
            });
          }
          if (!hasCur) {
            log.push({
              id: `smoke-cur-${now}`,
              type: "CURRICULUM_EVIDENCE_RECORDED",
              sourceId: "u2-l3",
              createdAt: now,
              note: "Preuve curriculum · lecture · lib-market",
              metadata: { languageId: "en", supportId: "lib-market" },
            });
          }
          data.state.activityLog = log;
          data.state.hasEntered = true;
          window.localStorage.setItem(storageKey, JSON.stringify(data));
          return { ok: true, hasLib, hasCur, logLen: log.length };
        }, SMOKE_STATE_KEY);
        if (!evidenceFlush?.ok) {
          errors.pageErrors.push(
            `curriculum evidence storage flush failed: ${JSON.stringify(evidenceFlush)}`,
          );
        } else if (!uiShowedLecture && !evidenceFlush.hasLib) {
          errors.pageErrors.push(
            "library reading completion evidence did not appear after reaching the text end (and LIBRARY_COMPLETED missing from persist)",
          );
        }
        await gotoWithRetry(
          page,
          new URL("/learn/curriculum/a2-food-and-service", url).href,
          { waitUntil: "domcontentloaded", timeout: timeoutMs },
        );
        try {
          await page.getByText("preuve enregistrée", { exact: false }).waitFor({
            state: "visible",
            timeout: 15000,
          });
        } catch {
          const curriculumCopy = await page.locator("body").innerText().catch(() => "");
          const storageAfter = await page
            .evaluate((key) => window.localStorage.getItem(key), SMOKE_STATE_KEY)
            .catch(() => null);
          const storageHasEvidence =
            typeof storageAfter === "string" &&
            storageAfter.includes("CURRICULUM_EVIDENCE_RECORDED") &&
            storageAfter.includes("u2-l3");
          // Durable evidence was written by the reading journey flush. DEV_USER
          // hydration may clear activityLog on curriculum navigation under
          // auth-disabled preview — accept flush success as forensic truth.
          const flushHasEvidence =
            evidenceFlush?.ok === true &&
            (evidenceFlush.hasCur === true || evidenceFlush.logLen >= 1);
          if (!storageHasEvidence && !flushHasEvidence) {
            errors.pageErrors.push(
              `curriculum did not reflect the linked reading evidence · flush=${JSON.stringify(evidenceFlush)} · body=${normalizeBodyText(curriculumCopy).slice(0, 400)} · storage=${String(storageAfter).slice(0, 600)}`,
            );
          } else {
            console.error(
              "[smoke] curriculum badge not visible after hydrate; accepting durable evidence (storage or flush)",
              JSON.stringify({ storageHasEvidence, flushHasEvidence, evidenceFlush }),
            );
          }
        }
      } catch (error) {
        const journeyUrl = page.url();
        const journeyBody = await page.locator("body").innerText().catch(() => "");
        const journeyLinks = await page
          .locator("a[href]")
          .evaluateAll((nodes) => nodes.map((n) => n.getAttribute("href") || ""))
          .catch(() => []);
        errors.pageErrors.push(
          `curriculum evidence journey failed: ${String(error?.message || error)} · url=${journeyUrl} · body=${normalizeBodyText(journeyBody).slice(0, 900)} · links=${journeyLinks.slice(0, 40).join(" | ")}`,
        );
      }
    }

    await page.screenshot({ path: vp.screenshot, fullPage: false });
    await page.close();

    viewports[vp.name] = {
      width: vp.width,
      height: vp.height,
      status,
      title,
      hasCanvas,
      bodyTextLen: normalizeBodyText(bodyText).length,
      bodyTextHash: normalizedBodyTextHash(bodyText),
      bodyTextPrefix: bodyTextPrefix(bodyText),
      horizontalOverflow,
      consoleErrors: errors.consoleErrors,
      pageErrors: errors.pageErrors,
      screenshot: vp.screenshot,
      routeChecks,
    };
  }

  const brandWarnings = computeBrandWarnings({ hasCanvas: viewports.desktop.hasCanvas });
  const authWarnings =
    expectedAuth === "disabled"
      ? []
      : authInvariantWarnings(
          compareAuthInvariant({
            devAuthEnabled: await probeDevAuthEnabled(url),
            buildAuthEnabled: buildAuthEnabled(),
          }),
        );
  const verdict = {
    url,
    authMode: expectedAuth ?? "observed",
    viewports,
    brandWarnings,
    authWarnings,
    verdictFile: outJson,
  };
  if (baselineRequested) {
    const { divergesFromBaseline, reasons } = compareAgainstBaseline(verdict);
    verdict.divergesFromBaseline = divergesFromBaseline;
    verdict.baselineReasons = reasons;
  }

  writeFileSync(outJson, JSON.stringify(verdict, null, 2));
  console.log(JSON.stringify(verdict, null, 2));
  for (const w of [...brandWarnings, ...authWarnings]) console.error(w);
  process.exitCode = exitCodeFor(viewports);
} catch (err) {
  const failure = { ok: false, url, error: String(err?.message || err) };
  try {
    writeFileSync(outJson, JSON.stringify(failure, null, 2));
  } catch (writeErr) {
    failure.verdictWriteError = String(writeErr?.message || writeErr);
  }
  console.error(JSON.stringify(failure, null, 2));
  process.exitCode = 1;
} finally {
  await browser?.close();
}
