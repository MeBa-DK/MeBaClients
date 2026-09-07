import { and, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { engagements } from "@/lib/db/schema";
import type { OrgContext } from "./context";
import { getClient } from "./clients";

export type EngagementInput = {
  clientId: string;
  name: string;
  startDate: string;
  endDate?: string | null;
  status?: "active" | "paused" | "ended";
};

export async function assertOwnedClient(ctx: OrgContext, clientId: string) {
  const owned = await getClient(ctx, clientId);
  if (!owned) throw new Error(`Client ${clientId} does not belong to this organization`);
}

export async function listEngagements(ctx: OrgContext) {
  return getDb().select().from(engagements).where(eq(engagements.orgId, ctx.orgId));
}

export async function getEngagement(ctx: OrgContext, id: string) {
  const [row] = await getDb()
    .select()
    .from(engagements)
    .where(and(eq(engagements.orgId, ctx.orgId), eq(engagements.id, id)));
  return row ?? null;
}

export async function createEngagement(ctx: OrgContext, input: EngagementInput) {
  await assertOwnedClient(ctx, input.clientId);
  const [row] = await getDb()
    .insert(engagements)
    .values({ ...input, orgId: ctx.orgId })
    .returning();
  return row;
}

export async function updateEngagement(ctx: OrgContext, id: string, input: EngagementInput) {
  await assertOwnedClient(ctx, input.clientId);
  const [row] = await getDb()
    .update(engagements)
    .set({ ...input, updatedAt: new Date() })
    .where(and(eq(engagements.orgId, ctx.orgId), eq(engagements.id, id)))
    .returning();
  if (!row) throw new Error(`Engagement ${id} not found`);
  return row;
}
