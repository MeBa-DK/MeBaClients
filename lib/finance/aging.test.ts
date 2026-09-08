import { expect, test } from "vitest";
import { agingBuckets } from "./aging";

const today = "2026-09-30";

test("a rebillable outlay ages from its own date", () => {
  const result = agingBuckets(
    [
      {
        id: "o1",
        clientId: "c1",
        vendor: "Hetzner",
        amountDkk: 10000,
        rebillStatus: "rebillable",
        date: "2026-09-20",
        rebilledAt: null,
      },
    ],
    today,
  );
  // 2026-09-20 to 2026-09-30 is 10 days.
  expect(result.buckets["0-30"].total).toBe(10000);
  expect(result.buckets["0-30"].outlays).toHaveLength(1);
});

test("a rebilled outlay ages from rebilledAt, not date", () => {
  const result = agingBuckets(
    [
      {
        id: "o1",
        clientId: "c1",
        vendor: "Vercel",
        amountDkk: 5000,
        rebillStatus: "rebilled",
        date: "2026-01-01", // fronted long ago
        rebilledAt: "2026-09-25", // but only invoiced 5 days ago
      },
    ],
    today,
  );
  expect(result.buckets["0-30"].total).toBe(5000);
});

test("settled and internal outlays are excluded entirely", () => {
  const result = agingBuckets(
    [
      {
        id: "o1",
        clientId: "c1",
        vendor: "Paid back",
        amountDkk: 100000,
        rebillStatus: "settled",
        date: "2026-01-01",
        rebilledAt: "2026-01-05",
      },
      {
        id: "o2",
        clientId: "c1",
        vendor: "Absorbed",
        amountDkk: 100000,
        rebillStatus: "internal",
        date: "2026-01-01",
        rebilledAt: null,
      },
    ],
    today,
  );
  expect(result.total).toBe(0);
  expect(result.buckets["0-30"].outlays).toHaveLength(0);
  expect(result.buckets["31-60"].outlays).toHaveLength(0);
  expect(result.buckets["61-90"].outlays).toHaveLength(0);
  expect(result.buckets["90+"].outlays).toHaveLength(0);
});

test("boundary: exactly 30 days old lands in 0-30", () => {
  const result = agingBuckets(
    [
      {
        id: "o1",
        clientId: "c1",
        vendor: "Boundary",
        amountDkk: 100,
        rebillStatus: "rebillable",
        date: "2026-08-31", // 2026-08-31 to 2026-09-30 = 30 days
        rebilledAt: null,
      },
    ],
    today,
  );
  expect(result.buckets["0-30"].total).toBe(100);
  expect(result.buckets["31-60"].total).toBe(0);
});

test("boundary: exactly 31 days old lands in 31-60", () => {
  const result = agingBuckets(
    [
      {
        id: "o1",
        clientId: "c1",
        vendor: "Boundary",
        amountDkk: 100,
        rebillStatus: "rebillable",
        date: "2026-08-30", // 2026-08-30 to 2026-09-30 = 31 days
        rebilledAt: null,
      },
    ],
    today,
  );
  expect(result.buckets["0-30"].total).toBe(0);
  expect(result.buckets["31-60"].total).toBe(100);
});

test("boundary: exactly 60 vs 61 days splits 31-60 from 61-90", () => {
  const at60 = agingBuckets(
    [
      {
        id: "o1",
        clientId: "c1",
        vendor: "X",
        amountDkk: 1,
        rebillStatus: "rebillable",
        date: "2026-08-01", // 60 days before 2026-09-30
        rebilledAt: null,
      },
    ],
    today,
  );
  expect(at60.buckets["31-60"].total).toBe(1);

  const at61 = agingBuckets(
    [
      {
        id: "o1",
        clientId: "c1",
        vendor: "X",
        amountDkk: 1,
        rebillStatus: "rebillable",
        date: "2026-07-31", // 61 days before 2026-09-30
        rebilledAt: null,
      },
    ],
    today,
  );
  expect(at61.buckets["61-90"].total).toBe(1);
});

test("boundary: exactly 90 vs 91 days splits 61-90 from 90+", () => {
  const at90 = agingBuckets(
    [
      {
        id: "o1",
        clientId: "c1",
        vendor: "X",
        amountDkk: 1,
        rebillStatus: "rebillable",
        date: "2026-07-02", // 90 days before 2026-09-30
        rebilledAt: null,
      },
    ],
    today,
  );
  expect(at90.buckets["61-90"].total).toBe(1);

  const at91 = agingBuckets(
    [
      {
        id: "o1",
        clientId: "c1",
        vendor: "X",
        amountDkk: 1,
        rebillStatus: "rebillable",
        date: "2026-07-01", // 91 days before 2026-09-30
        rebilledAt: null,
      },
    ],
    today,
  );
  expect(at91.buckets["90+"].total).toBe(1);
});

test("outlays within a bucket are sorted oldest first", () => {
  const result = agingBuckets(
    [
      {
        id: "newer",
        clientId: "c1",
        vendor: "Newer",
        amountDkk: 1,
        rebillStatus: "rebillable",
        date: "2026-09-25",
        rebilledAt: null,
      },
      {
        id: "older",
        clientId: "c1",
        vendor: "Older",
        amountDkk: 1,
        rebillStatus: "rebillable",
        date: "2026-09-10",
        rebilledAt: null,
      },
    ],
    today,
  );
  expect(result.buckets["0-30"].outlays.map((o) => o.id)).toEqual(["older", "newer"]);
});

test("total is the sum across all buckets", () => {
  const result = agingBuckets(
    [
      {
        id: "o1",
        clientId: "c1",
        vendor: "A",
        amountDkk: 100,
        rebillStatus: "rebillable",
        date: "2026-09-20",
        rebilledAt: null,
      },
      {
        id: "o2",
        clientId: "c1",
        vendor: "B",
        amountDkk: 200,
        rebillStatus: "rebilled",
        date: "2026-01-01",
        rebilledAt: "2026-07-01",
      },
    ],
    today,
  );
  expect(result.total).toBe(300);
});
