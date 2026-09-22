# K'Osez BLOSSOM

**Votre langue. Votre voyage. Votre BLOSSOM.**  
Language-learning product · Saint-Pierre, La Réunion

A practice workspace where learners make **one useful real-world language gesture** at a time. Progress is visible as a growing plant (seed → independent), not as empty streak anxiety.

## Product spine

| Surface | Role |
|---------|------|
| **Welcome** | First micro-commitment: preview today’s mission, then enter |
| **Home (BLOSSOM)** | One primary action (Focus du jour) + plant as emotional center |
| **Mission** | Brief → Prepare → Execute → Reflect (Terrain or Studio) |
| **Osez** | Speak now |
| **Atelier** | Learn · Pron’Lab · Library · Immersion |
| **Moi** | Profile, plan, role modes |

**Primary nav (4):** BLOSSOM · OSEZ · ATELIER · MOI

## Design system

- **Theme:** dark botanical / modern (`#0a0d0c` base, lime primary `#d9ff69`)
- **Type:** Instrument Sans (loaded in `__root.tsx`, tokens in `src/styles.css`)
- **Craft layer:** `.modern-ui` overrides for shell, home, mission, welcome
- **Motion:** plant-sway, stagger-in; respects `prefers-reduced-motion`

## Stack

- React 19 · TanStack Router/Start · Vite · TypeScript
- Tailwind CSS v4 · Radix / local UI primitives
- Zustand persist (`kosez-blossom-v2`) · domain in `src/lib/blossom/`

## Repo map

- `src/components/app/` — product UI (shell, onboarding, home, mission, plant, welcome, …)
- `src/lib/blossom/` — engine, mission sessions, data, store
- `src/routes/_app/` — app routes
- `src/styles.css` — tokens + modern-ui
- `.github/workflows/ci.yml` — test, typecheck, lint, production build

## Quality bar

- One primary CTA per screen
- Plant growth must feel causal after real gestures
- CI green: `npm test` · `npm run typecheck` · `npm run lint` · `npm run build`
- French UI copy; practice content often English for the demo learner

## North star

Every session should help the learner do **one honest thing** in the target language—and let them **see the plant grow** because of it.
