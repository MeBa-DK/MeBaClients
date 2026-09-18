import { expect, test } from "vitest";
import { todayLocal, monthOf, monthsBetween } from "./date";

test("just after local midnight, the local date is already the new day", () => {
  const justAfterMidnightCph = new Date("2026-09-30T22:30:00Z");
  expect(todayLocal("Europe/Copenhagen", justAfterMidnightCph)).toBe("2026-10-01");
});

test("UTC would have reported the previous day", () => {
  const justAfterMidnightCph = new Date("2026-09-30T22:30:00Z");
  expect(justAfterMidnightCph.toISOString().slice(0, 10)).toBe("2026-09-30");
});

test("monthOf truncates to YYYY-MM", () => {
  expect(monthOf("2026-10-01")).toBe("2026-10");
});

test("monthsBetween within a single year", () => {
  expect(monthsBetween("2026-06-15", "2026-09-01")).toEqual([
    "2026-06", "2026-07", "2026-08", "2026-09",
  ]);
});

test("monthsBetween crossing a year boundary", () => {
  expect(monthsBetween("2025-11-01", "2026-02-01")).toEqual([
    "2025-11", "2025-12", "2026-01", "2026-02",
  ]);
});

test("monthsBetween with from === to returns a single month", () => {
  expect(monthsBetween("2026-09-05", "2026-09-28")).toEqual(["2026-09"]);
});

test("monthsBetween accepts already-truncated YYYY-MM inputs", () => {
  expect(monthsBetween("2026-01", "2026-03")).toEqual(["2026-01", "2026-02", "2026-03"]);
});
