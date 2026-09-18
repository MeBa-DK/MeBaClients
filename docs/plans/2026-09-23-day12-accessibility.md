# Day 12 — Accessibility pass

**Date:** 2026-09-23

## Keyboard-only walkthrough

Verified with a real keyboard walk (no mouse), pressing Tab from a clean
focus state and inspecting `document.activeElement` at each stop, then
confirmed visually with a screenshot at the first stop:

1. **Skip link** — "Skip to main content" is now genuinely the first
   focusable element on every page (added `app/(dashboard)/layout.tsx`:
   `<a href="#main-content" class="skip-link">`), fully visible with a
   clear focus ring when tabbed to. Previously didn't exist — every page
   load made a keyboard user tab through the same 3 nav links before
   reaching content.
2. Nav: Portfolio → Clients → Unrecovered, each a real `<Link>`
   (keyboard-focusable by default), `aria-current="page"` on the active one.
3. Client header: Edit/Archive buttons, both correctly announce **which
   client** ("Edit Test Customer", "Archive Test Customer") rather than
   just "Edit"/"Archive" with no context.
4. Month picker: `aria-label="Month"`, was already correct from Day 5.
5. Export link: visible text is its own accessible name, no label needed.
6. Income status dropdown: `aria-label="Status for Website design
   project"` — announces which row it belongs to, not just "combobox".
7. Add-income/add-outlay form fields: `aria-label` on every input/select
   that previously had only a `placeholder` (which isn't a substitute for
   an accessible name — it disappears on input and isn't reliably
   announced).
8. **Outlay rebill transition buttons** — the plan's own example of what
   to fix: `aria-label="Move Vercel outlay from rebillable to internal"`
   replaces what was only "→ internal" with no context. Confirmed live.

Everything reachable and announced meaningfully with the mouse untouched.

## Form labels

Every `<input>`/`<select>`/`<textarea>` in the app now has either a real
`<label htmlFor>` (the two-field forms: add-client, edit-client) or an
`aria-label` (the compact inline add-income/add-outlay forms, where a
visible label would undo the layout work from Days 4–6). Placeholders are
kept as visual hints but no longer stand in as the only accessible name
anywhere.

Also added: `role="alert"` on every form's error list (so a validation
failure is announced immediately, not just visually shown), and
`aria-label` on every "Edit" button naming what it edits.

## Color contrast (WCAG AA)

Computed actual contrast ratios (not eyeballed) for every text/background
pairing in both themes. Two real failures found and fixed:

1. **`.archived-badge`** used `--text-faint` (3.17:1 light / 3.68:1 dark)
   at a small font size (0.8em) — below the 4.5:1 normal-text threshold in
   both themes. Switched to `--text-muted` (5.98:1 / 6.87:1, passes).
   `--text-faint` is now unused anywhere in the stylesheet — no
   normal-size text uses a token that can't clear AA.
2. **Every primary button** (`button`, `.btn-link`, `.skip-link`) used
   `background: var(--accent); color: white`. In dark mode, `--accent`
   (`#7b93ff`, deliberately lighter there so link text reads against a
   dark surface) drops white-on-it to **2.82:1** — fails even the 3:1
   large-text/UI-component minimum, let alone 4.5:1 for the button's own
   label. Added a new `--accent-on-fill` token (`#3452eb`, same value in
   both themes — dark enough for white text, still reads as the accent
   colour against a dark surface) and pointed every filled-button
   background at it instead of `--accent`. Now 5.91:1 in both themes.

`--text-muted` (used for table headers, section labels, the summary
card's labels — including the one the plan specifically named) was
already correct at 5.98:1 / 6.87:1; no change needed there. The focus
ring (`--focus-ring`) clears the 3:1 UI-component minimum against both
`--surface` and `--bg` in both themes (5.56–6.71:1).

## Summary

| Area | Outcome |
|---|---|
| Skip link | Added — was missing entirely |
| Keyboard reachability | Full walkthrough completed, mouse untouched |
| Form labels | Every input/select/textarea now has a real accessible name |
| Rebill/status control names | Fixed exactly as the plan named ("→ rebilled" → "Move X outlay from Y to Z") |
| Archived badge contrast | Real failure (3.17:1) found and fixed (now 5.98:1) |
| Button contrast (dark mode) | Real failure (2.82:1) found and fixed (now 5.91:1) |
| Table headers / section labels | Already passing, no change needed |

91/91 tests pass (no logic changed — purely `aria-label`, `role`, and
CSS token additions).
