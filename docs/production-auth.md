# Production auth (Vercel)

## Minimum for email/password (recommended without Grok broker client)

Set in Vercel → Environment Variables (Production):

| Variable | Example |
|----------|---------|
| `DATABASE_URL` | `postgres://…` (Neon / Supabase) |
| `BETTER_AUTH_URL` | `https://kosez.vercel.app` |
| `BETTER_AUTH_SECRET` | random ≥ 32 chars |

Optional: `VITE_AUTH_ENABLED` must not be `false`.

Email/password is enabled in `src/lib/auth/email-password.ts`.

## Google (optional)

Requires Grok auth broker **per-app** credentials (not `grok_preview`):

- `GROK_AUTH_ISSUER=https://auth.grok.me`
- `GROK_AUTH_CLIENT_ID=…`
- `GROK_AUTH_CLIENT_SECRET=…`

Without these, the Google button will fail; email login works.

## After changing env

Redeploy the Vercel project so build + runtime pick up the new values.
