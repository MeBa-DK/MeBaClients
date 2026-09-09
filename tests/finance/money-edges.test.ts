import { afterAll, beforeAll, expect, test } from "vitest";
import { getDb } from "@/lib/db";
import { organizations, clients, outlays } from "@/lib/db/schema";
import { eq, inArray } from "drizzle-orm";
import { createClient } from "@/lib/data/clients";
import { createOutlay } from "@/lib/data/outlays";
import { toDkk } from "@/lib/money";
import { todayLocal, monthOf } from "@/lib/date";
import { clientMargin } from "@/lib/finance/margin";

let orgId: string;
let clientId: string;

beforeAll(async () => {
  const db = getDb();
  const [org] = await db.insert(organizations).values({ name: "Money edges" }).returning();
  orgId = org.id;
  const client = await createClient({ orgId }, { name: "Money edges client" });
  clientId = client.id;
});

afterAll(async () => {
  const db = getDb();
  await db.delete(outlays).where(eq(outlays.orgId, orgId));
  await db.delete(clients).where(eq(clients.orgId, orgId));
  await db.delete(organizations).where(inArray(organizations.id, [orgId]));
});

test("a USD outlay at a real FX rate stores the correct amountDkk", async () => {
  // 10,000 USD-cents (100 USD) at 6.87 -> 68,700 øre.
  const row = await createOutlay(
    { orgId },
    {
      clientId,
      vendor: "Overseas vendor",
      description: "USD invoice",
      amount: 10000,
      currency: "USD",
      fxRate: 6.87,
      date: "2026-09-01",
      rebillStatus: "internal",
    },
  );
  expect(row.amountDkk).toBe(toDkk(10000, 6.87));
  expect(row.amountDkk).toBe(68700);
});

test("1 øre survives a round trip unchanged", async () => {
  const row = await createOutlay(
    { orgId },
    {
      clientId,
      vendor: "Tiny cost",
      description: "1 øre",
      amount: 1,
      currency: "DKK",
      fxRate: 1,
      date: "2026-09-01",
      rebillStatus: "internal",
    },
  );
  expect(row.amountDkk).toBe(1);

  const [reread] = await getDb().select().from(outlays).where(eq(outlays.id, row.id));
  expect(reread.amountDkk).toBe(1);
});

test("the amount column is a 32-bit Postgres integer — values must stay under 2,147,483,648 øre", async () => {
  // This documents and enforces the cap the schema already has (Postgres
  // `integer`, not `bigint`): 2,147,483,647 øre ≈ 21.47M kr. A single
  // outlay or income row exceeding that isn't a realistic scenario for
  // MeBa, so the fix here is knowing the ceiling exists, not raising it.
  const overflowing = 2_147_483_648; // 2^31, one past the max int4

  await expect(
    createOutlay(
      { orgId },
      {
        clientId,
        vendor: "Overflow",
        description: "too large",
        amount: overflowing,
        currency: "DKK",
        fxRate: 1,
        date: "2026-09-01",
        rebillStatus: "internal",
      },
    ),
  ).rejects.toThrow();
});

test("the maximum representable amount (2,147,483,647 øre) is accepted", async () => {
  const maxInt4 = 2_147_483_647;
  const row = await createOutlay(
    { orgId },
    {
      clientId,
      vendor: "At the cap",
      description: "max int4",
      amount: maxInt4,
      currency: "DKK",
      fxRate: 1,
      date: "2026-09-01",
      rebillStatus: "internal",
    },
  );
  expect(row.amountDkk).toBe(maxInt4);
});

test("an outlay dated today at 00:30 local appears in the current month", () => {
  // 2026-09-30T22:30:00Z is 2026-10-01T00:30 in Europe/Copenhagen (CEST,
  // UTC+2) — using the injectable clock rather than waiting for real
  // midnight to observe this.
  const justAfterMidnightCph = new Date("2026-09-30T22:30:00Z");
  const currentMonth = monthOf(todayLocal("Europe/Copenhagen", justAfterMidnightCph));
  expect(currentMonth).toBe("2026-10");

  const outlayDatedThatDay = [
    {
      clientId: "c1",
      amountDkk: 5000,
      rebillStatus: "internal" as const,
      date: "2026-10-01",
    },
  ];

  const margin = clientMargin("c1", [], outlayDatedThatDay, currentMonth);
  expect(margin.outlaysInternal).toBe(5000);
});
