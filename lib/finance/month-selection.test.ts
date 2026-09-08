import { expect, test } from "vitest";
import { resolveMonthSelection } from "./month-selection";
import { monthOf } from "@/lib/date";

test("with no requested month, defaults to the current month", () => {
  const result = resolveMonthSelection(
    { requestedMonth: undefined, currentMonth: "2026-09", recordDates: [] },
    monthOf,
  );
  expect(result.month).toBe("2026-09");
});

test("regression: income dated in a past month is invisible with no explanation", () => {
  // This is the exact bug reported: an income row dated 2026-04-12 while
  // today is in September made the summary read all-zero with nothing
  // indicating why — the row was there, just filtered to the wrong month.
  const result = resolveMonthSelection(
    {
      requestedMonth: undefined,
      currentMonth: "2026-09",
      recordDates: ["2026-04-12"],
    },
    monthOf,
  );
  expect(result.month).toBe("2026-09");
  expect(result.hasActivity).toBe(false);
  expect(result.availableMonths).toContain("2026-04");
});

test("selecting the month the record actually falls in shows it has activity", () => {
  const result = resolveMonthSelection(
    {
      requestedMonth: "2026-04",
      currentMonth: "2026-09",
      recordDates: ["2026-04-12"],
    },
    monthOf,
  );
  expect(result.month).toBe("2026-04");
  expect(result.hasActivity).toBe(true);
});

test("available months always include the current month even with no records", () => {
  const result = resolveMonthSelection(
    { requestedMonth: undefined, currentMonth: "2026-09", recordDates: [] },
    monthOf,
  );
  expect(result.availableMonths).toEqual(["2026-09"]);
});

test("available months are deduplicated and sorted newest first", () => {
  const result = resolveMonthSelection(
    {
      requestedMonth: undefined,
      currentMonth: "2026-09",
      recordDates: ["2026-04-12", "2026-04-30", "2026-07-01", "2026-09-01"],
    },
    monthOf,
  );
  expect(result.availableMonths).toEqual(["2026-09", "2026-07", "2026-04"]);
});

test("a malformed month param is ignored in favor of the current month", () => {
  const result = resolveMonthSelection(
    { requestedMonth: "not-a-month", currentMonth: "2026-09", recordDates: [] },
    monthOf,
  );
  expect(result.month).toBe("2026-09");
});
