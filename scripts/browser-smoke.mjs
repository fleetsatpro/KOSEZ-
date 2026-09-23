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
    if (statSync(baselinePath).size > MAX_BASELINE_BYTES) {
      return { divergesFromBaseline: true, reasons: ["baseline unreadable: too large"] };
    }
    return baselineComparison(verdict, readFileSync(baselinePath, "utf8"));
  } catch (err) {
    return {
      divergesFromBaseline: true,
      reasons: [`baseline unreadable: ${err?.code ?? "read error"}`],
    };
  }
}

let browser = null;
try {
  browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });

  const viewports = {};
  for (const vp of VIEWPORTS) {
    const errors = { consoleErrors: [], pageErrors: [] };
    const page = await browser.newPage({
      viewport: { width: vp.width, height: vp.height },
    });
    await page.addInitScript((storageKey) => {
      window.localStorage.setItem(
        storageKey,
        JSON.stringify({
          state: {
            hasEntered: true,
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
      if (msg.type() === "error") errors.consoleErrors.push(msg.text());
    });
    page.on("pageerror", (err) => errors.pageErrors.push(String(err?.message || err)));
    // `domcontentloaded`, not `networkidle`: Vite keeps an HMR websocket open, so
    // networkidle never settles and would burn the whole timeout.
    const resp = await gotoWithRetry(
      page,
      url,
      { waitUntil: "domcontentloaded", timeout: timeoutMs },
    );
    const status = resp?.status() ?? 0;
    await page.waitForTimeout(1000);

    const routeChecks = [];
    for (const route of SMOKE_ROUTES) {
      const response = route === "/"
        ? resp
        : await gotoWithRetry(
            page,
            new URL(route, url).href,
            { waitUntil: "domcontentloaded", timeout: timeoutMs },
          );
      const routeStatus = response?.status() ?? 0;
      routeChecks.push({
        route,
        status: routeStatus,
        url: new URL(route, url).href,
      });
      if (routeStatus === 0 || routeStatus >= 400) {
        errors.pageErrors.push(`route ${route} returned HTTP ${routeStatus}`);
      }
      await page.waitForTimeout(250);
    }
    await gotoWithRetry(
      page,
      url,
      { waitUntil: "domcontentloaded", timeout: timeoutMs },
    );
    await page.waitForTimeout(500);

    const title = await page.title();
    const hasCanvas = (await page.locator("canvas").count()) > 0;
    const bodyText = await page
      .locator("body")
      .innerText()
      .catch(() => "");
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
    const missingLearnerText = requiredLearnerText.filter(
      (text) => !bodyText.includes(text),
    );
    if (expectedAuth === "disabled") {
      const homeSurfaceCount = await page.locator('[data-smoke="blossom-home"]').count();
      if (homeSurfaceCount !== 1) {
        errors.pageErrors.push(
          `learner home surface missing or duplicated: expected 1, found ${homeSurfaceCount}`,
        );
      }
    }
    const presentForbiddenText = forbiddenLearnerText.filter(
      (text) => bodyText.includes(text),
    );
    if (missingLearnerText.length) {
      errors.pageErrors.push(
        `learner shell missing expected text: ${missingLearnerText.join(", ")}`,
      );
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
          new URL("/learn/curriculum/a2-food-and-service", url).href,
          { waitUntil: "domcontentloaded", timeout: timeoutMs },
        );
        await page.waitForTimeout(750);
        const readingLessonLink = page.getByRole("link", { name: /At the covered market/i });
        await readingLessonLink.waitFor({ state: "visible", timeout: 10000 });
        await readingLessonLink.click();
        await page.waitForTimeout(250);
        if (!page.url().includes("/library/lib-market")) {
          errors.pageErrors.push("curriculum library lesson did not route to the bound document");
        }
        await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: "instant" }));
        await page.waitForTimeout(350);
        const readingCopy = await page.locator("body").innerText().catch(() => "");
        if (!readingCopy.includes("lecture enregistrée")) {
          errors.pageErrors.push("library reading completion evidence did not appear after reaching the text end");
        }
        await gotoWithRetry(
          page,
          new URL("/learn/curriculum/a2-food-and-service", url).href,
          { waitUntil: "domcontentloaded", timeout: timeoutMs },
        );
        await page.waitForTimeout(350);
        const curriculumCopy = await page.locator("body").innerText().catch(() => "");
        if (!curriculumCopy.includes("preuve enregistrée")) {
          errors.pageErrors.push("curriculum did not reflect the linked reading evidence");
        }
      } catch (error) {
        const journeyUrl = page.url();
        const journeyBody = await page.locator("body").innerText().catch(() => "");
        const journeyLinks = await page.locator("a").allTextContents().catch(() => []);
        errors.pageErrors.push(
          `curriculum evidence journey failed: ${String(error?.message || error)} · url=${journeyUrl} · body=${normalizeBodyText(journeyBody).slice(0, 900)} · links=${journeyLinks.slice(0, 40).join(" | ")}`,
        );
      }
      await gotoWithRetry(page, url, { waitUntil: "domcontentloaded", timeout: timeoutMs });
      await page.waitForTimeout(250);
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
  // The CI learner smoke intentionally runs on an auth-disabled isolated server
  // so it can inspect the actual learner UI. Auth correctness is checked
  // separately against the production-mode auth-on server.
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
  // Set the code rather than aborting the process so the `finally` browser
  // teardown always runs (agents typically smoke twice per turn; leaking
  // Chromium accumulates across retries).
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
