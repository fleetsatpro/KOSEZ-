/**
 * Local email/password sign-in (this app's Better Auth DB — not the broker).
 *
 * Enabled for production when Grok broker client credentials are unavailable.
 * Google/X remain available when GROK_AUTH_* is configured.
 *
 * Do NOT edit `server.ts` for this — that file is frozen pre-wired config.
 */
export const emailAndPasswordEnabled = true;
