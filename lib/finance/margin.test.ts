import { expect, test } from "vitest";
import { clientMargin } from "./margin";

const income = [
  { clientId: "c1", amountDkk: 2500000, status: "settled" as const, date: "2026-09-01" },
  { clientId: "c1", amountDkk: 500000, status: "expected" as const, date: "2026-09-15" },
];

const outlays = [
  { clientId: "c1", amountDkk: 20000, rebillStatus: "internal" as const, date: "2026-09-02" },
  { clientId: "c1", amountDkk: 100000, rebillStatus: "rebilled" as const, date: "2026-09-03" },
  { clientId: "c1", amountDkk: 50000, rebillStatus: "settled" as const, date: "2026-09-04" },
];

test("margin counts settled income, absorbs internal outlays, and tracks unrecovered", () => {
  const result = clientMargin("c1", income, outlays, "2026-09");
  expect(result).toEqual({
    incomeSettled: 2500000,
    incomeExpected: 500000,
    outlaysInternal: 20000,
    outlaysUnrecovered: 100000,
    outlaysRecovered: 50000,
    margin: 2380000,
  });
});

test("a client with no activity returns zeros, not NaN", () => {
  const result = clientMargin("ghost", income, outlays, "2026-09");
  expect(result.margin).toBe(0);
  expect(Object.is(result.margin, -0)).toBe(false);
});
