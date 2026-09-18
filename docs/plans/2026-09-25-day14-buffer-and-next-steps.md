# Day 14 — Buffer, README update, auth/deploy decision

**Date:** 2026-09-25

## Buffer / catch-up

No loose ends carried over from Days 1–13 — working tree was clean, all 14
commits are in place, `npm test` (91/91) and `npm run build` both pass
cleanly. Nothing needed fixing before writing this decision.

README's "Status" section was stale (still described aging, the security
pass, and real-data entry as "still ahead" — all three have been done since
Days 1, 2, and 13). Rewrote it to reflect what's actually built and to point
at this document instead of re-describing plan status inline.

## Decision: authentication

**Not yet — and that's fine for the current use case.**

Every data-layer function already takes an explicit `OrgContext` and every
query filters by `org_id` — the multi-tenant seam exists in the code. What's
missing is only the layer above it: every page and server action currently
resolves its org via `getDefaultOrgContext()` (`lib/data/org.ts`) instead of
a session. That's a deliberate simplification for solo, single-user local
use, not an oversight — Day 2's adversarial pass tested cross-org isolation
at the data layer (8 tests, still passing) precisely because that boundary
is the one that matters architecturally, independent of who's logged in.

**When to revisit:** the day a second person needs to open this dashboard,
or it needs to leave `localhost`. At that point, swap
`getDefaultOrgContext()` for a real session lookup (NextAuth or similar) —
every call site is already isolated to a handful of files
(`app/(dashboard)/**/page.tsx`, `**/client-actions.ts`, `**/*-actions.ts`),
so the change is mechanical, not architectural.

## Decision: deployment

**Not yet.** No `vercel.json`/`vercel.ts`, no deploy target configured, no
production database provisioned — this has only run against local Docker
Postgres. That's the right call while auth is still deferred: shipping a
public URL with no login in front of client financial data would be a real
exposure, not a convenience.

**What deploying would require, when it's time:**
1. The auth decision above, resolved first — deploying before that means a
   public, unauthenticated view of client revenue and costs.
2. A managed Postgres instance (the app already speaks vanilla Postgres via
   Drizzle, so this is provisioning, not a rewrite).
3. `DATABASE_URL` set as a deploy-time environment variable in place of
   `.env.local`.

None of the three are blocked on anything else in the codebase — the app
itself has no framework-level obstacle to deploying; the blocker is
specifically "not until there's a login in front of it."

## Verification

`npm test` — 91/91 passing. `npm run build` — succeeds, no type errors.
No functional code changed this day; README and this doc are the only
changes.
