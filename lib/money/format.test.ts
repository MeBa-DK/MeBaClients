import { expect, test } from "vitest";
import { formatProfitMarginPercent, toDkkDecimalString } from "./format";

test("matches the worked example: 46,000 profit on 50,000 revenue is 92%", () => {
  expect(formatProfitMarginPercent(4600000, 5000000)).toBe("92%");
});

test("zero revenue has no meaningful margin", () => {
  expect(formatProfitMarginPercent(0, 0)).toBe("—");
});

test("a loss renders as a negative percentage", () => {
  expect(formatProfitMarginPercent(-100000, 1000000)).toBe("-10%");
});

test("toDkkDecimalString converts øre to a plain kroner decimal", () => {
  expect(toDkkDecimalString(2500000)).toBe("25000.00");
});

test("toDkkDecimalString always uses two decimal places, even for a round amount", () => {
  expect(toDkkDecimalString(10000)).toBe("100.00");
});

test("toDkkDecimalString has no thousands separator, regardless of locale", () => {
  expect(toDkkDecimalString(123456789)).toBe("1234567.89");
});

test("toDkkDecimalString handles a negative amount", () => {
  expect(toDkkDecimalString(-50000)).toBe("-500.00");
});
