/**
 * Bootstrap platform admins by email.
 *
 * After a user signs up / signs in with email+password, the server grants
 * `blossom_platform_admin` (+ role_grant) when their email is listed here.
 *
 * Production / real-database rule:
 *   ADMIN_BOOTSTRAP_EMAILS must be set explicitly.
 *   Built-in defaults are NEVER used when DATABASE_URL is present, so a
 *   stranger cannot claim admin@kosez.app on a live deployment.
 *
 * Local / preview (no DATABASE_URL):
 *   Defaults below remain available for first-operator setup.
 *
 *   ADMIN_BOOTSTRAP_EMAILS=admin@kosez.app,owner@yourdomain.com
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

function hasRealDatabase(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim());
}

/** Lowercased emails that receive platform admin on first successful session. */
export function bootstrapAdminEmails(): string[] {
  const fromEnv = parseEnvEmails();
  if (fromEnv.length > 0) return [...new Set(fromEnv)];
  // Fail closed on real databases: no implicit public admin emails.
  if (hasRealDatabase()) return [];
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
    passwordHint: "Choose any password ≥ 12 chars on first signup (local only unless listed in ADMIN_BOOTSTRAP_EMAILS)",
    role: "platform admin",
  },
  {
    email: "owner@kosez.app",
    passwordHint: "Choose any password ≥ 12 chars on first signup (local only unless listed in ADMIN_BOOTSTRAP_EMAILS)",
    role: "platform admin",
  },
] as const;
