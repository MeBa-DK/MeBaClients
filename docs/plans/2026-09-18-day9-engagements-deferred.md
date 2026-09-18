# Day 9 — Engagements in the UI: deferred

**Date:** 2026-09-18

## The question

`engagements` has existed in the schema since Day 3 of the original
14-day plan (a client relationship, with a name/start date/end date/
status, that income and outlays can optionally attach to via
`engagementId`). It has never had any UI. Today's task was to decide
whether that's still fine, and either build the UI or document why not.

## What the evidence shows

- **Zero UI references anywhere in `app/`.** No page reads, creates,
  edits, or filters by engagement.
- **Zero real engagement rows exist** in the database — `SELECT count(*)
  FROM engagements` returns 0.
- **Every income and outlay form creates rows with `engagementId: null`**
  — the add-income/add-outlay forms don't even expose the field.
- Nothing in the margin math, the aging report, or any page has needed
  to distinguish more than one engagement per client. The client itself
  has functioned as the unit of "what's this money for" throughout every
  day of this build.

## Decision

**Defer.** Building UI for a concept with no demonstrated need and zero
live usage would be speculative — exactly what both this plan and the
project's own working rules (CLAUDE.md: "do what has been asked; nothing
more") warn against. A single implicit engagement per client (the client
relationship itself) has been sufficient for every day of this build so
far, including real usage.

The schema and data layer (`lib/data/engagements.ts`) stay as they are —
removing them would be more churn than leaving unused, correctly-scoped
code in place, and a real future need (e.g. a client with genuinely
separate concurrent projects that need separate profitability views)
can build on top of what's already there rather than starting over.

## What would justify revisiting this

- A real MeBa client with two or more genuinely separate concurrent
  projects/retainers whose profitability needs to be seen apart, not
  just as one combined number.
- A need to end one relationship with a client while starting another,
  where mixing their income/outlay history together would be
  misleading.

Until one of those is an actual, current need — not a hypothetical —
this stays deferred.
