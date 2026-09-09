import { afterAll, beforeAll, expect, test } from "vitest";
import { getDb } from "@/lib/db";
import { organizations, clients, engagements, income, outlays } from "@/lib/db/schema";
import { eq, inArray } from "drizzle-orm";
import { createClient } from "@/lib/data/clients";
import { createEngagement, updateEngagement } from "@/lib/data/engagements";
import { createIncome, updateIncome, setIncomeStatus } from "@/lib/data/income";
import { createOutlay, updateOutlay, transitionOutlay } from "@/lib/data/outlays";

// Attacker is org A; every target row below belongs to org B. Every
// mutation attempted from A against B's row must fail, and — because
// return values can lie — every assertion re-reads the row directly
// from the database rather than trusting what the call returned.

let orgA: string;
let orgB: string;
let clientOfB: string;
let engagementOfB: string;
let incomeOfB: string;
let outlayOfB: string;

beforeAll(async () => {
  const db = getDb();
  const [a] = await db.insert(organizations).values({ name: "Cross-tenant A" }).returning();
  const [b] = await db.insert(organizations).values({ name: "Cross-tenant B" }).returning();
  orgA = a.id;
  orgB = b.id;

  const client = await createClient({ orgId: orgB }, { name: "B's client" });
  clientOfB = client.id;

  const engagement = await createEngagement(
    { orgId: orgB },
    { clientId: clientOfB, name: "B's engagement", startDate: "2026-01-01" },
  );
  engagementOfB = engagement.id;

  const incomeRow = await createIncome(
    { orgId: orgB },
    {
      clientId: clientOfB,
      description: "B's income",
      amount: 100000,
      currency: "DKK",
      fxRate: 1,
      date: "2026-09-01",
      status: "settled",
    },
  );
  incomeOfB = incomeRow.id;

  const outlayRow = await createOutlay(
    { orgId: orgB },
    {
      clientId: clientOfB,
      vendor: "B's vendor",
      description: "B's outlay",
      amount: 50000,
      currency: "DKK",
      fxRate: 1,
      date: "2026-09-01",
      rebillStatus: "rebillable",
    },
  );
  outlayOfB = outlayRow.id;
});

afterAll(async () => {
  const db = getDb();
  await db.delete(outlays).where(inArray(outlays.orgId, [orgA, orgB]));
  await db.delete(income).where(inArray(income.orgId, [orgA, orgB]));
  await db.delete(engagements).where(inArray(engagements.orgId, [orgA, orgB]));
  await db.delete(clients).where(inArray(clients.orgId, [orgA, orgB]));
  await db.delete(organizations).where(inArray(organizations.id, [orgA, orgB]));
});

test("org A cannot create an engagement against org B's client", async () => {
  await expect(
    createEngagement(
      { orgId: orgA },
      { clientId: clientOfB, name: "hijacked", startDate: "2026-09-01" },
    ),
  ).rejects.toThrow();
});

test("org A cannot update org B's engagement", async () => {
  await expect(
    updateEngagement(
      { orgId: orgA },
      engagementOfB,
      { clientId: clientOfB, name: "hijacked", startDate: "2026-09-01" },
    ),
  ).rejects.toThrow();

  const [row] = await getDb()
    .select()
    .from(engagements)
    .where(eq(engagements.id, engagementOfB));
  expect(row.name).toBe("B's engagement");
});

test("org A cannot create income against org B's client", async () => {
  await expect(
    createIncome(
      { orgId: orgA },
      {
        clientId: clientOfB,
        description: "hijacked",
        amount: 999999,
        currency: "DKK",
        fxRate: 1,
        date: "2026-09-01",
      },
    ),
  ).rejects.toThrow();
});

test("org A cannot update org B's income", async () => {
  await expect(
    updateIncome(
      { orgId: orgA },
      incomeOfB,
      {
        clientId: clientOfB,
        description: "hijacked",
        amount: 1,
        currency: "DKK",
        fxRate: 1,
        date: "2026-09-01",
      },
    ),
  ).rejects.toThrow();

  const [row] = await getDb().select().from(income).where(eq(income.id, incomeOfB));
  expect(row.description).toBe("B's income");
  expect(row.amountDkk).toBe(100000);
});

test("org A cannot change org B's income status", async () => {
  await expect(
    setIncomeStatus({ orgId: orgA }, incomeOfB, "written_off"),
  ).rejects.toThrow();

  const [row] = await getDb().select().from(income).where(eq(income.id, incomeOfB));
  expect(row.status).toBe("settled");
});

test("org A cannot create an outlay against org B's client", async () => {
  await expect(
    createOutlay(
      { orgId: orgA },
      {
        clientId: clientOfB,
        vendor: "hijacked",
        description: "hijacked",
        amount: 999999,
        currency: "DKK",
        fxRate: 1,
        date: "2026-09-01",
      },
    ),
  ).rejects.toThrow();
});

test("org A cannot update org B's outlay", async () => {
  await expect(
    updateOutlay(
      { orgId: orgA },
      outlayOfB,
      {
        clientId: clientOfB,
        vendor: "hijacked",
        description: "hijacked",
        amount: 1,
        currency: "DKK",
        fxRate: 1,
        date: "2026-09-01",
      },
    ),
  ).rejects.toThrow();

  const [row] = await getDb().select().from(outlays).where(eq(outlays.id, outlayOfB));
  expect(row.vendor).toBe("B's vendor");
  expect(row.amountDkk).toBe(50000);
});

test("org A cannot transition org B's outlay's rebill status", async () => {
  await expect(
    transitionOutlay({ orgId: orgA }, outlayOfB, "rebilled"),
  ).rejects.toThrow();

  const [row] = await getDb().select().from(outlays).where(eq(outlays.id, outlayOfB));
  expect(row.rebillStatus).toBe("rebillable");
  expect(row.rebilledAt).toBeNull();
});

test("updateOutlay cannot be used to skip the rebill state machine (same-org, not cross-tenant)", async () => {
  // Not a tenant-isolation defect — orgB acting on its own outlay. Grouped
  // here because it's the same kind of question ("can a boundary be
  // walked around?") this file exists to ask. outlayOfB starts as
  // "rebillable"; the legal machine (lib/finance/rebill.ts) forbids
  // rebillable -> settled directly. updateOutlay is the general edit path
  // (vendor, amount, date, ...) — it must silently keep the existing
  // rebillStatus regardless of what the input carries, since only
  // transitionOutlay may move an outlay through the lifecycle.
  const updated = await updateOutlay(
    { orgId: orgB },
    outlayOfB,
    {
      clientId: clientOfB,
      vendor: "B's vendor (edited)",
      description: "B's outlay",
      amount: 50000,
      currency: "DKK",
      fxRate: 1,
      date: "2026-09-01",
      rebillStatus: "settled",
    },
  );
  expect(updated.rebillStatus).toBe("rebillable");
  expect(updated.vendor).toBe("B's vendor (edited)"); // the rest of the edit still applies

  const [row] = await getDb().select().from(outlays).where(eq(outlays.id, outlayOfB));
  expect(row.rebillStatus).toBe("rebillable");
});
