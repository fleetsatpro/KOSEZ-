/**
 * Upstream identity providers for OAuth sign-in.
 *
 * K'Osez is **email/password only**. No Google, X, or other social buttons.
 * Kept as an empty list so client/server share one source of truth without
 * pulling server-only Better Auth into the browser bundle.
 */
export type GrokProvider = {
  /** This app's local provider id; also the callback path segment. */
  providerId: string;
  /** Upstream hint the broker would forward to (Better Auth social id). */
  idp: string;
  /** Human label for the sign-in button. */
  label: string;
};

/** No social providers — email/password is the sole sign-in surface. */
export const GROK_PROVIDERS: readonly GrokProvider[] = [];
