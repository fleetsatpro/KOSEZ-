import test from "node:test";
import assert from "node:assert/strict";
import { productionEnvProblems } from "./verify-production-env.mjs";

const complete = {
  VERCEL: "1",
  VERCEL_ENV: "production",
  DATABASE_URL: "postgres://example.invalid/db",
  BETTER_AUTH_URL: "https://kosez.vercel.app",
  BETTER_AUTH_SECRET: "a".repeat(32),
  GROK_AUTH_ISSUER: "https://auth.example.invalid",
  GROK_AUTH_CLIENT_ID: "client-id",
  GROK_AUTH_CLIENT_SECRET: "client-secret",
};

test("non-production builds do not require production deployment secrets", () => {
  assert.deepEqual(productionEnvProblems({ ...complete, VERCEL_ENV: "preview" }), []);
  assert.deepEqual(productionEnvProblems({}), []);
});

test("complete Vercel production configuration passes", () => {
  assert.deepEqual(productionEnvProblems(complete), []);
});

test("Vercel production fails closed when durable/auth configuration is incomplete", () => {
  const problems = productionEnvProblems({
    ...complete,
    DATABASE_URL: "",
    BETTER_AUTH_SECRET: "",
    GROK_AUTH_CLIENT_SECRET: "",
    VITE_AUTH_ENABLED: "false",
    BETTER_AUTH_URL: "http://kosez.vercel.app",
  });

  assert.ok(problems.some((message) => message.includes("DATABASE_URL")));
  assert.ok(problems.some((message) => message.includes("BETTER_AUTH_SECRET")));
  assert.ok(problems.some((message) => message.includes("GROK_AUTH_CLIENT_SECRET")));
  assert.ok(problems.some((message) => message.includes("VITE_AUTH_ENABLED")));
  assert.ok(problems.some((message) => message.includes("https")));
});
