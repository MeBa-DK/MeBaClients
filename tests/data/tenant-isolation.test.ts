import { afterAll, beforeAll, expect, test } from "vitest";
import { getDb } from "@/lib/db";
import { organizations, clients } from "@/lib/db/schema";
import { eq, inArray } from "drizzle-orm";
import { createClient, getClient, updateClient } from "@/lib/data/clients";

let orgA: string;
let orgB: string;
let clientOfB: string;
let clientOfA: string;

beforeAll(async () => {
  const db = getDb();
  const [a] = await db.insert(organizations).values({ name: "A" }).returning();
  const [b] = await db.insert(organizations).values({ name: "B" }).returning();
  orgA = a.id;
  orgB = b.id;
  const row = await createClient({ orgId: orgB }, { name: "B's client" });
  clientOfB = row.id;
});

afterAll(async () => {
  // These tests write real orgs/clients through the same DATABASE_URL the dev
  // server uses. Clean up so `npm run dev` doesn't show test fixtures.
  const db = getDb();
  const ids = [clientOfB, clientOfA].filter((id): id is string => Boolean(id));
  if (ids.length > 0) await db.delete(clients).where(inArray(clients.id, ids));
  await db.delete(organizations).where(inArray(organizations.id, [orgA, orgB]));
});

test("org A cannot read org B's client", async () => {
  expect(await getClient({ orgId: orgA }, clientOfB)).toBeNull();
});

test("org A cannot update org B's client", async () => {
  await expect(
    updateClient({ orgId: orgA }, clientOfB, { name: "hijacked" }),
  ).rejects.toThrow();

  const [row] = await getDb().select().from(clients).where(eq(clients.id, clientOfB));
  expect(row.name).toBe("B's client");
});

test("orgId in the payload cannot override the context", async () => {
  const row = await createClient(
    { orgId: orgA },
    { name: "injected", orgId: orgB } as never,
  );
  clientOfA = row.id;
  expect(row.orgId).toBe(orgA);
});
