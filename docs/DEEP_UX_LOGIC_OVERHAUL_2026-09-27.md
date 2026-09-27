
# K’Osez BLOSSOM — Deep UX + Logic Overhaul Prompt
Date: 2026-09-27
Branch: hardening/codebase-deep-green-2026-09-27

MISSION
Perform a release-grade, root-cause overhaul of the K’Osez BLOSSOM codebase. Do not stop at lint, typecheck, or build. Treat the product as an evidence-driven learning organism whose UI, local state, server state, persistence, language model, role access, and feedback must tell the same truth.

Primary invariant:
ACTION → EVIDENCE → SERVER VALIDATION → CONFIRMED RECORD → ORGANISM DERIVATION → NEXT USEFUL GESTURE.

A UI may show a local pending action, but it must never present an unconfirmed server-authoritative reward/progression as settled fact.

NON-NEGOTIABLE PRODUCT PRINCIPLES
1. French is the current primary UI locale; learning language is a separate domain value.
2. Learning-language state must never leak across languages.
3. No false evidence: no fabricated speech scores, mastery, attendance, mission completion, tandem completion, or social proof.
4. Offline-first behavior is allowed only when the UI clearly distinguishes local/pending from confirmed server state.
5. Server authority wins on all durable rewards and security-sensitive state.
6. One dominant next gesture per screen. Secondary diagnostics remain secondary.
7. Organism/mineral language should explain cause, not become a disguised leaderboard.
8. Adult, warm, precise UX. No streak anxiety, shame language, or gamified coercion.
9. Preserve deep links and existing product data unless a migration explicitly normalizes old state.
10. Prefer deterministic state machines and pure derivation over duplicated route-local logic.
11. Any unsupported learning-language surface must be honestly gated; never render English content under another language label.
12. Every mutation needs an explicit lifecycle: pending → confirmed/applied, rejected, or conflict.

P0 — STATE TRUTH AND REWARD AUTHORITY

P0.1 Replace optimistic reward mutation with explicit authority semantics.
The current store completeActivity() immediately appends activity, points, growth events, mineral changes, and Léo state before the server has validated the event. This is unsafe for server-only event types and can produce temporary false success.

Implement a normalized lifecycle:
- pending: local command exists, but contributes zero points, zero stage progression, zero mineral deltas, zero growth events, zero courage, zero influence
- confirmed: server-authoritative event exists and may contribute to organism derivations
- rejected: command removed; all derived organism state recomputed from surviving confirmed/pending-safe data
- conflict: conflict metadata retained; never silently treated as success

Preferred model:
- durable confirmed activity
- outbox/pending commands
- pure selectors for points, minerals, stage, courage, influence

At minimum every rejection must recompute:
activityLog, growthEvents, mineralSnapshot, phonemeLeaves, Léo letters/status, journey/stage/progress, recent-growth chips, causal recommendations.

Never delete one activity row while leaving derived organism state stale.

P0.2 Create authoritative completion paths for server-only activities.
Audit every event type in activity-integrity.server.ts.

For each server-only activity, create a genuine server-backed evidence path.

SPEAK_COMPLETED:
The OSEZ flow currently calls completeActivity("SPEAK_COMPLETED", ...) while the server rejects this event as server-only. This is a design contradiction.

Implement a real Speak session lifecycle:
- start session server-side
- bind session to user, learning language, and room/version
- record valid turn evidence or server-observable timing
- end session server-side
- calculate authoritative duration/evidence server-side
- only then create SPEAK_COMPLETED
- idempotency required
- replay safe
- cancellation/expiry safe
- wrong-language completion rejected
- zero-evidence completion rejected
- client-supplied scores never trusted as proof

The client may render local speaking progress, but it must be pending until server confirmation.

Audit and implement the same authority contract for:
PRONLAB_MASTERY, DIAGNOSTIC_COMPLETED, REAL_WORLD_BONUS, LESSON_COMPLETED, CLASS_ATTENDED and any future server-only event.

If an event cannot currently be verified, do not render it as a durable reward.

P0.3 Mission anti-phantom-evidence.
Server mission completion must require actual execution evidence, not merely a reflection, open session, elapsed wall-clock time, or zero-second attempt.

Require:
- at least one mission attempt
- positive duration
- correct run/session binding
- valid capture semantics

Microphone mode:
- zero-second capture is not an execution attempt
- reflection cannot make an empty execution valid

Real-world/manual mode:
- require a real recorded interval and correct run identity

Add server tests for zero duration rejection, reflection-without-execution rejection, mismatched run/mission rejection, replay idempotency, and valid completion acceptance.

P0.4 Language-scoped mission state.
Mission sessions currently lack explicit language identity. Add languageId to persistent mission state with backward-compatible migration. Mission friction, latest outcome, history, influence, and resume state must be language-scoped.

P0.5 Centralize language scope.
Use one authoritative helper for current learning language and audit:
activity, points, stage, minerals, courage, Pron’Lab attempts, phoneme leaves, growthEvents, mission sessions, review queue, vocabulary, learning submissions, influence, tandem state where language matters.

Create mixed EN/FR/ES invariant tests proving no cross-language contamination.

P0.6 Language metadata must equal actual capability.
Create one truth table for:
- engine capability
- dedicated content packs
- surface availability
- speech capability
- sign capability
- UI locale coverage

Do not claim a route is available if the gate blocks it.

Audit contradictory metadata/copy such as partial UI coverage described as full, or unavailable mission/tandem surfaces described as generic active features.

P0.7 LSF/sign mode.
Audit all LSF surfaces:
- no audio-only affordances
- no spoken pronunciation grading claims
- no invented audio score
- visual/sign semantics explicit
- sign-appropriate feedback
Add route-level tests.

P0.8 Mutation state machine.
Every outbox mutation must have stable id, owner, device, monotone timestamp, operation, entity, expected revision when relevant, status, failure/conflict reason, and retry semantics.

Statuses:
pending, processing, applied, rejected, conflict, dead-letter.

“Synced” must mean confirmed enough to justify that wording, not merely “no current request in flight”.

P0.9 Rejection rollback.
Audit every optimistic mutation and matching rejection branch.

Known defect:
tandem.status rejection currently deletes status even if a prior status existed.

Persist previousStatus and restore it on rejection.

Audit:
event registration, booking, waitlist, tandem status, tandem reports, teacher notes, homework, homework completion, learning submissions, vocabulary, activity append, profile/language changes.

No rejection may destroy unrelated or confirmed state.

P0.10 Confirmed-vs-pending presentation.
Create reusable status semantics:
confirmed / syncing / offline-local / failed / conflict

Use consistently in SyncStatus, evidence timeline, teacher notes/homework, profile actions, event registration, tandem changes, vocabulary, activity completion.

P1 — INFORMATION ARCHITECTURE AND UX

P1.1 Single-source navigation architecture.
Current shell has six top-level destinations:
BLOSSOM, OSEZ, EXPLORE, CONNECT, LEARN, MOI
plus duplicated context navigation and repeated footer links.

Create one route/domain taxonomy. The intended conceptual domains are:
BLOSSOM / OSEZ / ATELIER / MOI.

Keep the capabilities of EXPLORE and CONNECT, but place them coherently inside the domain model rather than treating every capability as an independent top-level destination.

Acceptance:
- every route has one home domain
- no duplicate primary destinations
- context navigation never contradicts primary navigation
- mobile and desktop expose the same architecture
- deep links remain valid
- current location is always obvious

Do not perform a visual redesign merely for novelty.

P1.2 One dominant next action.
Audit Home, OSEZ, LEARN, CONNECT, EXPLORE, MOI.

Home currently contains status, annotation, reasons, growth chips, struggle, courage ribbon, mission CTA, causal door, multiple secondary doors and generic links.

Target hierarchy:
1 dominant action
1 short reason
secondary evidence
optional detail

P1.3 Reduce repeated organism explanation.
Avoid repeatedly explaining:
- lowest mineral opens next door
- the earth remembers
- no score to protect

Create one stable explanatory contract and keep operational screens focused.

P1.4 Minerals must not feel like a hidden leaderboard.
Quantitative state is allowed, but default presentation should emphasize qualitative health/state and decision relevance. Avoid ranking language and performance framing.

P1.5 Growth ceremony.
Current ceremony auto-dismisses after a few seconds and parent callbacks may navigate immediately. It also declares aria-modal without robust focus handling.

Fix:
- no automatic navigation
- user controls exit/continue
- Escape support
- initial focus
- focus restoration
- aria-labelledby
- reduced-motion support
- critical content remains readable
- no surprise route change

P1.6 Empty is not error.
Known cases:
- CONNECT catch currently sets peers to [].
- MOI sessions catch currently sets sessions to [].

Every async screen needs distinct:
loading / success-empty / error / offline / retry.

P1.7 Explore provenance.
Explore uses local static fallback while fetching server content. Do not imply server-confirmed freshness when rendering fallback. Make stale/offline provenance subtle but visible.

P1.8 Evidence timeline.
Do not show raw internal source IDs to ordinary users. Map source IDs to human labels.

Reconcile timeline with pending activity:
- pending evidence may appear as pending
- only confirmed evidence is styled as confirmed

P1.9 Review session stability.
Derived review plan may change after a submission. During an active review session, do not reinitialize queue merely because derived plan data changed.

Reinitialize only on explicit new session or learning-language change.

Regression:
start review → answer → plan changes → current queue/session state remains stable.

P1.10 Review completion semantics.
Ensure one intended review completion per period, a real server-known submission exists before reward, curriculum evidence only follows its source, language scope is respected, and duplicate reward is impossible.

P1.11 OSEZ room identity.
Current deterministic regeneration improves hub links but may fail for historical rooms after date/state changes. Persist a room descriptor/session:
- room id
- seed
- language
- creation date
- content version
- generated payload where required

Deep links must resolve to the original room rather than silently falling back to another archetype.

P1.12 OSEZ timing.
Timer must measure only actual active session time:
- no time before Start
- stops at end
- reshuffle resets
- all intervals/timeouts cleaned up
- reward duration comes from valid evidence, not page lifetime

P1.13 Library reading completion.
Delayed timer + intersection logic must:
- cancel scheduled timeout on unmount
- distinguish local completion from server confirmation
- use document language for speech where relevant
- never dispatch completion after a page is gone without deliberate session continuity
Fix the known pluralization bug to use languageVocabulary.length.

P1.14 Tandem duration contract.
UI currently presents a 30 + 30 minute frame while server only requires a 2-minute minimum plus participation on both sides.

Pick one explicit contract:
- genuinely enforce the 30+30 product contract server-side
or
- allow early completion and tell the user the minimum valid exchange plus actual recorded duration

Never display one contract and enforce another silently.

P1.15 Tandem prompt logging.
Prompt logs must be idempotent, participant-bound, session-bound, and rejected after session closure.

P1.16 Tandem language matching.
Use canonical language IDs internally. Test English/Anglais, French/Français, Spanish/Español, Portuguese/Português and mixed UI/learning-language settings.

P1.17 Workspace modes.
Every role workspace must be server-authorized:
guardian/parent, teacher, organization, admin, child.

No workspace should render from a stale client boolean alone. Hide/disable unauthorized entry, clear stale mode state, and show a clear access message when appropriate.

P1.18 Teacher Studio persistence.
Teacher notes/homework are mutation-backed. Finish the UX contract with pending/confirmed status, contextual rejection handling, and preservation of typed drafts.

P1.19 Accessibility.
Audit every changed surface:
- accessible names
- keyboard reachability
- visible focus
- dialog focus management
- Escape behavior
- meaningful progressbar labels/values
- correct image alt semantics
- announced errors/loading
- mobile touch targets
- no hover-only action
- reduced motion

Test 360px, 412px, 768px, 1024px, 1440px.

P1.20 Date/time.
Audit all toISOString(), local date keys, week boundaries and calendar export.
Ensure learner/account timezone semantics are stable and ICS output represents the event zone correctly.

P1.21 Performance/resilience.
Audit:
- interval and timeout leaks
- event-listener leaks
- duplicated requests
- unstable dependencies
- excessive render-time derivation
- large-list sorting
- unnecessary server calls

Prefer bounded selectors, memoization where material, cleanup, pagination, and deterministic derivation.

P2 — COPY
Create a stable vocabulary for:
preuve, confirmé, en attente, hors ligne, synchronisation, croissance, minéral, prochaine action, apprentissage, rencontre, session.

Do not mix “score”, “points”, “minéral”, “priorité”, “performance” in ways that imply contradictory product models.

Review every fallback/error string for French quality, adult tone, no blame, and no false certainty.

REQUIRED TEST MATRIX

Pure logic:
- language isolation
- mission language isolation
- stage requirements
- points derivation
- mineral derivation
- courage local-date behavior
- tandem localized labels
- mission attempt validity
- review queue stability
- OSEZ room determinism
- next-gesture determinism

Server integrity:
- fake SPEAK_COMPLETED rejected
- valid server Speak completion accepted
- zero mission duration rejected
- zero mission attempt rejected
- mismatched language rejected
- mismatched session/run rejected
- replay idempotent
- forged Pron’Lab score cannot become server-trusted score
- server-only events cannot be minted from arbitrary activity.append
- unauthorized role access rejected
- tandem ownership enforced
- prompt logging after close rejected

Sync:
- optimistic pending state is represented correctly
- applied mutation removed
- rejected mutation rolls back only affected state
- prior tandem status restored
- activity rejection recomputes all organism derivatives
- conflict retry works
- owner isolation works
- user switch cannot inherit another user's mutations
- offline queue survives reload
- causal mutation ordering survives concurrency

UI integration:
- async error differs from empty
- unsupported language route is gated
- LSF hides audio-only affordances
- mobile nav is coherent
- role modes require confirmed access
- growth ceremony does not navigate without user intent
- review does not reset when derived plan changes

VERIFICATION LOOP

After every meaningful batch:
1. hardening audit
2. all script tests
3. all TypeScript tests
4. typecheck
5. lint with zero warnings
6. production build
7. browser smoke
8. bundle/dead-code regression check
9. server integrity tests
10. re-read changed code paths
11. repeat until two consecutive full verification passes show no new findings

Never call the code green while:
- CI is still running
- a test is skipped to hide a failure
- a warning is ignored
- Vercel failed because of a platform quota
- UI/server completion contracts disagree
- rejected optimistic state leaves stale organism state

When a test fails:
- identify root cause
- patch the correct abstraction
- add a regression test
- rerun relevant and full gates
- never suppress the failure

FINAL ACCEPTANCE
A. No known false-reward path.
B. No cross-language derived-state contamination.
C. No rejected optimistic mutation leaves stale organism state.
D. No role workspace renders without confirmed authorization.
E. No error state masquerades as empty.
F. No timer/listener leak in touched flows.
G. No critical modal auto-navigates without user intent.
H. No active review resets because derived data changed.
I. Copy matches actual feature availability.
J. UI and server expose the same completion contract.
K. Tests/typecheck/lint/build/browser smoke are green.
L. Final CI corresponds to the actual final commit.
M. The codebase is more coherent, not merely larger.

Do not add fake tests that assert only implementation trivia. Test the invariants a real learner experiences.
