/**
 * Bootstrap platform admins by email.
 *
 * After a user signs up / signs in with email+password, the server grants
 * `blossom_platform_admin` (+ role_grant) when their email is listed here.
 *
 * Configure production via env:
 *   ADMIN_BOOTSTRAP_EMAILS=admin@kosez.app,owner@yourdomain.com
 *
 * Defaults below exist so the first operator can enter without SQL access.
 * Change the password after first login.
 */

const DEFAULT_BOOTSTRAP_EMAILS = [
  "admin@kosez.app",
  "admin@kosez.vercel.app",
  "owner@kosez.app",
] as const;

function parseEnvEmails(): string[] {
  const raw = process.env.ADMIN_BOOTSTRAP_EMAILS?.trim();
  if (!raw) return [];
  return raw
    .split(/[,;\s]+/)
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

/** Lowercased emails that receive platform admin on first successful session. */
export function bootstrapAdminEmails(): string[] {
  const fromEnv = parseEnvEmails();
  if (fromEnv.length > 0) return [...new Set(fromEnv)];
  return [...DEFAULT_BOOTSTRAP_EMAILS];
}

export function isBootstrapAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  return bootstrapAdminEmails().includes(normalized);
}

/** Suggested operator credentials (create via « Créer un compte » on /login). */
export const ADMIN_LOGIN_HINTS = [
  {
    email: "admin@kosez.app",
    passwordHint: "Choose any password ≥ 8 chars on first signup",
    role: "platform admin",
  },
  {
    email: "owner@kosez.app",
    passwordHint: "Choose any password ≥ 8 chars on first signup",
    role: "platform admin",
  },
] as const;
