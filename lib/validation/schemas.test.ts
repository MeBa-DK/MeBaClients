import { expect, test } from "vitest";
import { incomeSchema, outlaySchema, clientSchema } from "./schemas";

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

// Day 8 stress pass: unreasonably long free-text input shouldn't reach the
// database, where it would render as one unbroken line in a table that
// scrolls sideways forever.
test("a 50,000-character vendor name is rejected", () => {
  const result = outlaySchema.safeParse({
    clientId: base.clientId,
    vendor: "A".repeat(50000),
    description: "Hosting",
    date: base.date,
    amount: base.amount,
    currency: "DKK",
    fxRate: 1,
  });
  expect(result.success).toBe(false);
});

test("a vendor name at exactly the 200-character cap is accepted", () => {
  const result = outlaySchema.safeParse({
    clientId: base.clientId,
    vendor: "A".repeat(200),
    description: "Hosting",
    date: base.date,
    amount: base.amount,
    currency: "DKK",
    fxRate: 1,
  });
  expect(result.success).toBe(true);
});

test("a description at exactly the 2000-character cap is accepted, 2001 is rejected", () => {
  const at2000 = outlaySchema.safeParse({
    clientId: base.clientId,
    vendor: "Vercel",
    description: "A".repeat(2000),
    date: base.date,
    amount: base.amount,
    currency: "DKK",
    fxRate: 1,
  });
  expect(at2000.success).toBe(true);

  const at2001 = outlaySchema.safeParse({
    clientId: base.clientId,
    vendor: "Vercel",
    description: "A".repeat(2001),
    date: base.date,
    amount: base.amount,
    currency: "DKK",
    fxRate: 1,
  });
  expect(at2001.success).toBe(false);
});

test("emoji and unicode in a vendor name are accepted", () => {
  const result = outlaySchema.safeParse({
    clientId: base.clientId,
    vendor: "Café Müller 🎉 日本語",
    description: "Hosting",
    date: base.date,
    amount: base.amount,
    currency: "DKK",
    fxRate: 1,
  });
  expect(result.success).toBe(true);
});

test("a client with no notes (null) is accepted", () => {
  const result = clientSchema.safeParse({ name: "Acme", notes: null });
  expect(result.success).toBe(true);
});

test("a client name over the 200-character cap is rejected", () => {
  const result = clientSchema.safeParse({ name: "A".repeat(201) });
  expect(result.success).toBe(false);
});
