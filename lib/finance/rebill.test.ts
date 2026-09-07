import { expect, test } from "vitest";
import { canTransition, applyTransition } from "./rebill";

test("a rebillable outlay can be marked rebilled", () => {
  expect(canTransition("rebillable", "rebilled")).toBe(true);
});

test("an internal outlay cannot jump straight to settled", () => {
  expect(canTransition("internal", "settled")).toBe(false);
});

test("an outlay cannot be settled before it is rebilled", () => {
  expect(canTransition("rebillable", "settled")).toBe(false);
});

test("marking rebilled stamps the date and leaves settledAt null", () => {
  const result = applyTransition(
    { rebillStatus: "rebillable", rebilledAt: null, settledAt: null },
    "rebilled",
    "2026-09-07",
  );
  expect(result).toEqual({
    rebillStatus: "rebilled",
    rebilledAt: "2026-09-07",
    settledAt: null,
  });
});

test("an illegal transition throws rather than silently doing nothing", () => {
  expect(() =>
    applyTransition(
      { rebillStatus: "internal", rebilledAt: null, settledAt: null },
      "settled",
      "2026-09-07",
    ),
  ).toThrow(/internal.*settled/);
});
