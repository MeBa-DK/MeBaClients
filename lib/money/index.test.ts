import { expect, test } from "vitest";
import { toDkk, normalizeToMonthly, sum } from "./index";

test("toDkk rounds half away from zero for a positive amount", () => {
  expect(toDkk(3, 0.5)).toBe(2);
});

test("toDkk rounds half away from zero for a negative amount", () => {
  expect(toDkk(-3, 0.5)).toBe(-2);
});

test("toDkk throws on a zero fxRate", () => {
  expect(() => toDkk(100, 0)).toThrow(/fxRate must be positive/);
});

test("toDkk throws on a negative fxRate", () => {
  expect(() => toDkk(100, -1)).toThrow(/fxRate must be positive/);
});

test("normalizeToMonthly divides quarterly amounts by 3", () => {
  expect(normalizeToMonthly(300, "quarterly")).toBe(100);
});

test("normalizeToMonthly divides yearly amounts by 12", () => {
  expect(normalizeToMonthly(1200, "yearly")).toBe(100);
});

test("normalizeToMonthly leaves monthly amounts unchanged", () => {
  expect(normalizeToMonthly(100, "monthly")).toBe(100);
});

test("sum of an empty array is 0", () => {
  expect(sum([])).toBe(0);
});
