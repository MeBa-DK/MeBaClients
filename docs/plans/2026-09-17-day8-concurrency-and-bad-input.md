# Day 8 — Stress test: concurrency and bad input

**Date:** 2026-09-17

## 1. Two rapid rebill transitions on the same outlay

**Found a genuine defect.** `transitionOutlay` read the current row, computed
the next state in application code via `applyTransition`, then wrote it back
— with the `UPDATE`'s `WHERE` clause only matching on `id`/`orgId`, not on
the state it had just read. Two truly concurrent callers (two tabs; two
requests that each read before either wrote) could each independently
compute a legal-looking transition from the same starting state and both
"succeed" — the second write silently overwriting the first with no error
to either caller, landing the row in a state that was never actually
validated against what was really current at write time.

Reproduced directly: forced both reads to happen before either write, then
both writes landed — `internal` then `rebilled` — with no error, even
though `internal → rebilled` isn't a legal transition. Confirmed via a
`Promise.all` race too, though that path is less reliable at reproducing it
since Node/postgres.js's own scheduling tends to serialize the two calls.

**Fixed:** the `UPDATE` in `lib/data/outlays.ts:transitionOutlay` now also
requires `rebillStatus` to still match what was just read (optimistic
concurrency). If the row changed in between, zero rows match, `updated` is
undefined, and the function throws instead of overwriting — the caller
re-fetches and retries with the current state.

Regression test: `tests/concurrency/rebill-race.test.ts` — forces the exact
interleaving that corrupted state before the fix and asserts only one of
the two guarded writes can ever match a row.

## 2. Very long strings

`vendor`, `description`, `name`, and `notes` had no length cap — a 50,000
character vendor name round-tripped through Postgres `text` (unbounded)
without error, and would have rendered as a single unbroken line in a
table that scrolls sideways forever (`white-space: nowrap`).

**Fixed:** added sane max lengths in `lib/validation/schemas.ts` — 200
characters for short identifying fields (vendor, client name), 2000 for
free-text fields (description, notes). Not a technical necessity (the
database has no such limit) but a sanity bound: no legitimate vendor name
or client name is anywhere near 200 characters.

## 3. Unicode / emoji

Round-trips correctly — verified directly against the database (not just
Zod) with Japanese, accented Latin, and emoji in both a vendor name and a
client name. Postgres `text` is UTF-8 native; no issue found.

## 4. Rapid form double-submit

Two scenarios:

- **Through the real UI** (double-clicking "Add income"): the submit
  button already carries `disabled={isPending}` from earlier days' work.
  Verified live in the browser — a genuine rapid double-click created
  exactly one row.
- **Bypassing the UI** (two identical `createIncome`/`createOutlay` calls
  fired concurrently, e.g. a scripted retry): no deduplication exists:
  both calls succeed and both rows are created.

**Decision: not fixed, documented instead.** Building real request
idempotency (an idempotency key, a short-window duplicate-content check)
is meaningfully more than this stress-test day calls for, and the
realistic attack surface — a person clicking a button twice — is already
covered by the disabled-button guard. If this becomes a real problem
(e.g. once real network retries are in play, or once auth introduces
actual multi-actor concurrency), revisit with a real case in hand.

## Summary

| Scenario | Outcome |
|---|---|
| Concurrent rebill transitions | **Real bug found and fixed** — optimistic concurrency check added |
| Very long strings | **Real gap found and fixed** — max-length validation added |
| Unicode / emoji | No issue — verified round-trips correctly |
| Double-submit (UI) | No issue — `disabled={isPending}` already prevents it, verified live |
| Double-submit (bypassing UI) | No dedup exists — deliberate decision not to build it now |

9 new tests (3 concurrency, 6 validation). 70/70 total tests pass.
