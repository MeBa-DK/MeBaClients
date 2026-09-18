# Day 13 — Rigtige MeBa-data (mock)

**Date:** 2026-09-24

Real MeBa figures aren't available yet, so per instruction this day used
realistic mock data entered through the real UI instead of real numbers.

## Data setup

Cleared the two placeholder test clients ("Burak Ari", "Let's Meme") via the
app's own data-layer functions (not raw SQL), keeping "Test Customer"
untouched. Two new mock clients were created through `/clients/new` and
populated entirely through the live add-income/add-outlay forms:

- **Nordisk Café ApS** — "Website redesign + ongoing hosting, monthly
  retainer". One-off settled income (45.000 kr, website redesign) plus a
  monthly recurring expected income (1.500 kr, hosting retainer). Two
  outlays: Vercel hosting (200 kr, still `rebillable`) and Unsplash+ stock
  photos (50 kr, `internal`).
- **Fjeldstrup SaaS** — "Ongoing product development, monthly sprint
  retainer". One settled monthly recurring income (35.000 kr, sprint
  retainer). Two outlays: AWS hosting (800 kr), walked through the full
  rebill lifecycle to `settled (final)` via the UI transition buttons, and
  Figma seats (450 kr, `internal`).

## Acceptance check — from the dashboard alone

**Which client made the most money last month?**
Nordisk Café ApS — 44.750,00 kr profit (Portfolio page, sorted by revenue,
45.000,00 kr revenue received).

**How much money is currently sitting with clients who haven't paid back
yet?**
350,00 kr total, all in the 0–30 day bucket (Unrecovered page): 200,00 kr
owed by Nordisk Café ApS (Vercel, rebillable) and 150,00 kr owed by Test
Customer (Vercel, rebillable). Fjeldstrup SaaS has 0 kr outstanding — its
only rebillable outlay was carried through to `settled`.

## Portfolio (2026-09)

| Client | Revenue received | Costs to recover | Profit |
|---|---|---|---|
| Nordisk Café ApS | 45.000,00 kr. | 200,00 kr. | 44.750,00 kr. |
| Fjeldstrup SaaS | 35.000,00 kr. | 0,00 kr. | 34.550,00 kr. |
| Test Customer | 30.000,00 kr. | 150,00 kr. | 29.820,00 kr. |
| **Total** | **110.000,00 kr.** | **350,00 kr.** | **109.120,00 kr.** |

## Verification

No code changes this day (pure data entry through existing UI/data layer).
91/91 tests pass, `npm run build` succeeds with no type errors.
