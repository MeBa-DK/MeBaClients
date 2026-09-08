import { expect, test } from "vitest";
import { formatProfitMarginPercent } from "./format";

test("matches the worked example: 46,000 profit on 50,000 revenue is 92%", () => {
  expect(formatProfitMarginPercent(4600000, 5000000)).toBe("92%");
});

test("zero revenue has no meaningful margin", () => {
  expect(formatProfitMarginPercent(0, 0)).toBe("—");
});

test("a loss renders as a negative percentage", () => {
  expect(formatProfitMarginPercent(-100000, 1000000)).toBe("-10%");
});
