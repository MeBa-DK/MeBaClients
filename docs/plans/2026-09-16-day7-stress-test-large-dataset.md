# Day 7 — Stress test: large dataset

**Date:** 2026-09-16

## Method

Seeded a dedicated "Stress Test Client" (removed afterward — never left
in the database) with 550 income rows and 550 outlay rows spread across
~12 months, then timed repeated loads of its client detail page — the
heaviest page in the app, since it renders every income and outlay row
for the client as an HTML table (no pagination or windowing).

## Results

| Scenario | Median request time |
|---|---|
| Client detail, 1,100 total rows (550 income + 550 outlay), `next dev` | ~310ms |
| Client detail, 1,100 total rows, production build (`next start`) | **~50ms** |
| Client detail, 5,050 total rows (5,000 income + 550 outlay), production | ~195ms |
| Portfolio / Clients list / Unrecovered, with the stress client present | 1–13ms |

Raw DB query time for 550 rows with the client's existing index
(`income_org_client_date_idx`, `outlays_org_client_date_idx`): **~5ms
per query.** The rest of the request time is React rendering the row
set as HTML, not the database.

## Conclusion

**No fix needed.** 550 rows per client — already generous for a full
year of a real client's activity — loads in ~50ms in production. The
4x slowdown only shows up at 5,000+ rows for a single client in one
view, which is far beyond what a realistic MeBa client would
accumulate; a client doing a few invoices and outlays a month would
need roughly 400+ years to reach that row count in a single client
record.

**Decision: no pagination.** Per the plan's own instruction not to add
it speculatively — the page is fast enough at any realistic scale. If
a client's history does eventually grow into the thousands of rows
(e.g. imported historical data, or many years of monthly retainers),
revisit then with a real number in hand rather than guessing now.

## What would be worth doing if this ever becomes real

Not built, since it isn't needed yet — noted for later if the 5,000+
row case actually arrives:

- Scope the client detail page's income/outlay tables to the selected
  month only (the summary card already is) rather than rendering the
  client's entire history on every load.
- If "all-time" view is still wanted, paginate or virtualize the table
  rather than rendering every row.
