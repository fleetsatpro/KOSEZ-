import assert from "node:assert/strict";
import { describe, it, afterEach } from "node:test";
import { bootstrapAdminEmails, isBootstrapAdminEmail } from "./admin-bootstrap.ts";

const ORIGINAL_DB = process.env.DATABASE_URL;
const ORIGINAL_BOOT = process.env.ADMIN_BOOTSTRAP_EMAILS;

afterEach(() => {
  if (ORIGINAL_DB === undefined) delete process.env.DATABASE_URL;
  else process.env.DATABASE_URL = ORIGINAL_DB;
  if (ORIGINAL_BOOT === undefined) delete process.env.ADMIN_BOOTSTRAP_EMAILS;
  else process.env.ADMIN_BOOTSTRAP_EMAILS = ORIGINAL_BOOT;
});

describe("admin bootstrap fail-closed", () => {
  it("uses defaults only when no DATABASE_URL and no env list", () => {
    delete process.env.DATABASE_URL;
    delete process.env.ADMIN_BOOTSTRAP_EMAILS;
    const emails = bootstrapAdminEmails();
    assert.ok(emails.includes("admin@kosez.app"));
  });

  it("returns empty list on real database without ADMIN_BOOTSTRAP_EMAILS", () => {
    process.env.DATABASE_URL = "postgres://example.invalid/db";
    delete process.env.ADMIN_BOOTSTRAP_EMAILS;
    assert.deepEqual(bootstrapAdminEmails(), []);
    assert.equal(isBootstrapAdminEmail("admin@kosez.app"), false);
  });

  it("honours explicit ADMIN_BOOTSTRAP_EMAILS on real database", () => {
    process.env.DATABASE_URL = "postgres://example.invalid/db";
    process.env.ADMIN_BOOTSTRAP_EMAILS = "ops@example.com, Admin@Kosez.App ";
    const emails = bootstrapAdminEmails();
    assert.deepEqual(emails, ["ops@example.com", "admin@kosez.app"]);
    assert.equal(isBootstrapAdminEmail("OPS@example.com"), true);
  });
});
