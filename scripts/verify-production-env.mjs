#!/usr/bin/env node

import { isMainModule } from "./with-app-env.mjs";

const REQUIRED_PRODUCTION_VARS = [
  "DATABASE_URL",
  "BETTER_AUTH_URL",
  "BETTER_AUTH_SECRET",
  "GROK_AUTH_ISSUER",
  "GROK_AUTH_CLIENT_ID",
  "GROK_AUTH_CLIENT_SECRET",
];

/** Return a trimmed env value, treating empty strings as unset. */
export function envValue(env, key) {
  const value = env?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

/**
 * Return deployment configuration errors without ever printing secret values.
 * Non-Vercel and non-production environments intentionally return no errors.
 */
export function productionEnvProblems(env = process.env) {
  const isVercelProduction =
    envValue(env, "VERCEL") === "1" &&
    envValue(env, "VERCEL_ENV") === "production";

  if (!isVercelProduction) return [];

  const problems = [];

  if (envValue(env, "VITE_AUTH_ENABLED") === "false") {
    problems.push("VITE_AUTH_ENABLED must not be false in Vercel production.");
  }

  for (const key of REQUIRED_PRODUCTION_VARS) {
    if (!envValue(env, key)) problems.push(`${key} is missing.`);
  }

  const baseURL = envValue(env, "BETTER_AUTH_URL");
  if (baseURL) {
    try {
      const parsed = new URL(baseURL);
      if (parsed.protocol !== "https:") {
        problems.push("BETTER_AUTH_URL must use https in Vercel production.");
      }
    } catch {
      problems.push("BETTER_AUTH_URL must be an absolute URL in Vercel production.");
    }
  }

  return problems;
}

if (isMainModule(import.meta.url)) {
  const problems = productionEnvProblems();
  if (problems.length) {
    for (const problem of problems) console.error(`[production-env] ${problem}`);
    process.exit(1);
  }
  console.log("[production-env] Vercel production configuration is complete.");
}
