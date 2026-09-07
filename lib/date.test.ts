import { expect, test } from "vitest";
import { todayLocal, monthOf } from "./date";

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
