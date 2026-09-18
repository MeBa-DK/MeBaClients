import { expect, test } from "vitest";
import { unpaidRecurringMonths, type RecurringIncomeRow } from "./recurring";

test("a monthly retainer with no other income rows is unpaid for every month except the current one", () => {
  const recurring: RecurringIncomeRow[] = [
    { id: "r1", clientId: "c1", description: "Retainer", recurringInterval: "monthly", date: "2026-06-01" },
  ];
  const allIncome = new Map<string, Set<string>>();

  const result = unpaidRecurringMonths(recurring, allIncome, "2026-09-15");

  expect(result.map((r) => r.month)).toEqual(["2026-06", "2026-07", "2026-08"]);
  // September (the current month) isn't flagged yet — it's not over.
});

test("a month with any income row for the client, even a one-off, counts as accounted for", () => {
  const recurring: RecurringIncomeRow[] = [
    { id: "r1", clientId: "c1", description: "Retainer", recurringInterval: "monthly", date: "2026-06-01" },
  ];
  const allIncome = new Map<string, Set<string>>([["c1", new Set(["2026-07"])]]);

  const result = unpaidRecurringMonths(recurring, allIncome, "2026-09-15");

  expect(result.map((r) => r.month)).toEqual(["2026-06", "2026-08"]);
});

test("quarterly steps from the row's own start month, not the calendar quarter", () => {
  const recurring: RecurringIncomeRow[] = [
    { id: "r1", clientId: "c1", description: "Quarterly", recurringInterval: "quarterly", date: "2026-02-01" },
  ];
  const allIncome = new Map<string, Set<string>>();

  // Feb, May, Aug, (Nov would be next but "through" stops in October).
  const result = unpaidRecurringMonths(recurring, allIncome, "2026-10-01");

  expect(result.map((r) => r.month)).toEqual(["2026-02", "2026-05", "2026-08"]);
});

test("yearly steps by 12 months", () => {
  const recurring: RecurringIncomeRow[] = [
    { id: "r1", clientId: "c1", description: "Annual", recurringInterval: "yearly", date: "2024-01-01" },
  ];
  const allIncome = new Map<string, Set<string>>();

  const result = unpaidRecurringMonths(recurring, allIncome, "2026-06-01");

  // 2024-01 and 2025-01 have both passed; 2026-01 has also already passed
  // relative to "through" = 2026-06, so it's flagged too.
  expect(result.map((r) => r.month)).toEqual(["2024-01", "2025-01", "2026-01"]);
});

test("yearly: a month clearly in the past is flagged even in the same year as 'through'", () => {
  const recurring: RecurringIncomeRow[] = [
    { id: "r1", clientId: "c1", description: "Annual", recurringInterval: "yearly", date: "2026-01-01" },
  ];
  const allIncome = new Map<string, Set<string>>();

  const result = unpaidRecurringMonths(recurring, allIncome, "2026-06-01");

  expect(result.map((r) => r.month)).toEqual(["2026-01"]);
});

test("a non-recurring income row is ignored entirely", () => {
  const recurring: RecurringIncomeRow[] = [
    { id: "r1", clientId: "c1", description: "One-off", recurringInterval: null, date: "2026-01-01" },
  ];
  const allIncome = new Map<string, Set<string>>();

  const result = unpaidRecurringMonths(recurring, allIncome, "2026-09-01");

  expect(result).toEqual([]);
});

test("results are sorted by month ascending across multiple recurring rows", () => {
  const recurring: RecurringIncomeRow[] = [
    { id: "r1", clientId: "c1", description: "Retainer A", recurringInterval: "monthly", date: "2026-07-01" },
    { id: "r2", clientId: "c2", description: "Retainer B", recurringInterval: "monthly", date: "2026-06-01" },
  ];
  const allIncome = new Map<string, Set<string>>();

  const result = unpaidRecurringMonths(recurring, allIncome, "2026-09-01");

  // Retainer A: July, August. Retainer B: June, July, August. Merged and
  // sorted by month, ties broken by original row order (A before B).
  expect(result.map((r) => `${r.month}:${r.incomeId}`)).toEqual([
    "2026-06:r2",
    "2026-07:r1",
    "2026-07:r2",
    "2026-08:r1",
    "2026-08:r2",
  ]);
});
