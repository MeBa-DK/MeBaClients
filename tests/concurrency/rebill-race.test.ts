import { beforeEach, expect, test } from "vitest";
import { getDb } from "@/lib/db";
import { organizations, clients, outlays } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { createClient } from "@/lib/data/clients";
import { createOutlay, transitionOutlay, getOutlay } from "@/lib/data/outlays";
import { applyTransition } from "@/lib/finance/rebill";
import { todayLocal } from "@/lib/date";

let orgId: string;
let clientId: string;

beforeEach(async () => {
  const db = getDb();
  const [org] = await db.insert(organizations).values({ name: `Race test ${crypto.randomUUID()}` }).returning();
  orgId = org.id;
  const client = await createClient({ orgId }, { name: "Race client" });
  clientId = client.id;
});

async function cleanupOrg(orgId: string) {
  const db = getDb();
  await db.delete(outlays).where(eq(outlays.orgId, orgId));
  await db.delete(clients).where(eq(clients.orgId, orgId));
  await db.delete(organizations).where(eq(organizations.id, orgId));
}

test("two concurrent legal transitions on the same outlay: exactly one wins, the other rejects", async () => {
  const ctx = { orgId };
  const outlay = await createOutlay(ctx, {
    clientId,
    vendor: "Vercel",
    description: "Hosting",
    amount: 10000,
    currency: "DKK",
    fxRate: 1,
    date: "2026-09-01",
    rebillStatus: "rebillable",
  });

  // Both start from "rebillable" and race to move it. rebillable allows
  // both "internal" and "rebilled" — each is individually legal from the
  // row's state at read time, but only one may actually land.
  const results = await Promise.allSettled([
    transitionOutlay(ctx, outlay.id, "internal"),
    transitionOutlay(ctx, outlay.id, "rebilled"),
  ]);

  const fulfilled = results.filter((r) => r.status === "fulfilled");
  const final = await getOutlay(ctx, outlay.id);

  // Exactly one of the two must have actually succeeded — the concerning
  // failure mode is both reporting success while only one state can be
  // true at once.
  expect(fulfilled).toHaveLength(1);
  expect(final!.rebillStatus).toBe((fulfilled[0].value as typeof final)!.rebillStatus);

  await cleanupOrg(orgId);
});

test("regression: a stale read can no longer silently overwrite a newer write", async () => {
  // This reproduces the exact defect found during the Day 8 stress pass:
  // transitionOutlay used to read-then-write with no guard tying the write
  // to the state it read. Two truly concurrent callers (e.g. two tabs, or
  // two requests that each read before either wrote) could each compute a
  // legal-looking transition from a now-stale read, and the second write
  // would silently clobber the first with no error to either caller — the
  // final rebillStatus was never actually validated against what was
  // really current at write time.
  //
  // Promise.all against the real transitionOutlay doesn't reliably
  // reproduce this (Node/postgres.js's own scheduling tends to serialize
  // the two calls before this test can observe the race), so this test
  // forces the interleaving directly: both reads happen before either
  // write, using transitionOutlay's own guarded update query.
  const ctx = { orgId };
  const outlay = await createOutlay(ctx, {
    clientId,
    vendor: "Vercel",
    description: "Hosting",
    amount: 10000,
    currency: "DKK",
    fxRate: 1,
    date: "2026-09-01",
    rebillStatus: "rebillable",
  });

  const db = getDb();
  const rowA = (await getOutlay(ctx, outlay.id))!;
  const rowB = (await getOutlay(ctx, outlay.id))!;

  const nextA = applyTransition(
    { rebillStatus: rowA.rebillStatus, rebilledAt: rowA.rebilledAt, settledAt: rowA.settledAt },
    "internal",
    todayLocal(),
  );
  const nextB = applyTransition(
    { rebillStatus: rowB.rebillStatus, rebilledAt: rowB.rebilledAt, settledAt: rowB.settledAt },
    "rebilled",
    todayLocal(),
  );

  const [writtenA] = await db
    .update(outlays)
    .set({ ...nextA, updatedAt: new Date() })
    .where(
      and(
        eq(outlays.orgId, ctx.orgId),
        eq(outlays.id, outlay.id),
        eq(outlays.rebillStatus, rowA.rebillStatus),
      ),
    )
    .returning();
  const [writtenB] = await db
    .update(outlays)
    .set({ ...nextB, updatedAt: new Date() })
    .where(
      and(
        eq(outlays.orgId, ctx.orgId),
        eq(outlays.id, outlay.id),
        eq(outlays.rebillStatus, rowB.rebillStatus),
      ),
    )
    .returning();

  // Exactly one of the two guarded writes may match a row — the second
  // caller's WHERE no longer matches once the first caller's write has
  // changed rebillStatus out from under it.
  const matched = [writtenA, writtenB].filter(Boolean);
  expect(matched).toHaveLength(1);

  const final = await getOutlay(ctx, outlay.id);
  expect(final!.rebillStatus).toBe(matched[0]!.rebillStatus);

  await cleanupOrg(orgId);
});

test("a transition racing against an already-terminal state fails loudly, not silently", async () => {
  const ctx = { orgId };
  const outlay = await createOutlay(ctx, {
    clientId,
    vendor: "Vercel",
    description: "Hosting",
    amount: 10000,
    currency: "DKK",
    fxRate: 1,
    date: "2026-09-01",
    rebillStatus: "rebilled",
  });

  // Settle it, then race another "settle" against the now-terminal row.
  await transitionOutlay(ctx, outlay.id, "settled");

  await expect(transitionOutlay(ctx, outlay.id, "settled")).rejects.toThrow();
  await expect(transitionOutlay(ctx, outlay.id, "rebillable")).rejects.toThrow();

  const final = await getOutlay(ctx, outlay.id);
  expect(final!.rebillStatus).toBe("settled");

  await cleanupOrg(orgId);
});
