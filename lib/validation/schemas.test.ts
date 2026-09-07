import { expect, test } from "vitest";
import { incomeSchema } from "./schemas";

const base = {
  clientId: "ed126eb2-e72e-4a67-a22b-5467d8ec1251",
  description: "Retainer",
  date: "2026-09-01",
  amount: 100000,
};

test("DKK with fxRate 1 passes", () => {
  const result = incomeSchema.safeParse({ ...base, currency: "DKK", fxRate: 1 });
  expect(result.success).toBe(true);
});

test("DKK with fxRate 6.87 fails", () => {
  const result = incomeSchema.safeParse({ ...base, currency: "DKK", fxRate: 6.87 });
  expect(result.success).toBe(false);
});

test("USD with fxRate 1 fails", () => {
  const result = incomeSchema.safeParse({ ...base, currency: "USD", fxRate: 1 });
  expect(result.success).toBe(false);
});

test("USD with fxRate 6.87 passes", () => {
  const result = incomeSchema.safeParse({ ...base, currency: "USD", fxRate: 6.87 });
  expect(result.success).toBe(true);
});

test("a non-integer amount fails", () => {
  const result = incomeSchema.safeParse({
    ...base,
    currency: "DKK",
    fxRate: 1,
    amount: 100.5,
  });
  expect(result.success).toBe(false);
});

test("a 2026-9-1 date fails", () => {
  const result = incomeSchema.safeParse({
    ...base,
    currency: "DKK",
    fxRate: 1,
    date: "2026-9-1",
  });
  expect(result.success).toBe(false);
});
