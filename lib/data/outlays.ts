import { and, asc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { outlays } from "@/lib/db/schema";
import { toDkk } from "@/lib/money";
import { todayLocal } from "@/lib/date";
import { applyTransition, type RebillStatus } from "@/lib/finance/rebill";
import type { OrgContext } from "./context";
import { assertOwnedClient } from "./engagements";

export type OutlayInput = {
  clientId: string;
  engagementId?: string | null;
  vendor: string;
  description: string;
  amount: number;
  currency: string;
  fxRate: number;
  date: string;
  rebillStatus?: RebillStatus;
};

export async function listOutlaysForClient(ctx: OrgContext, clientId: string) {
  return getDb()
    .select()
    .from(outlays)
    .where(and(eq(outlays.orgId, ctx.orgId), eq(outlays.clientId, clientId)))
    .orderBy(asc(outlays.date));
}

export async function listOutlays(ctx: OrgContext) {
  return getDb()
    .select()
    .from(outlays)
    .where(eq(outlays.orgId, ctx.orgId))
    .orderBy(asc(outlays.date));
}

export async function getOutlay(ctx: OrgContext, id: string) {
  const [row] = await getDb()
    .select()
    .from(outlays)
    .where(and(eq(outlays.orgId, ctx.orgId), eq(outlays.id, id)));
  return row ?? null;
}

export async function createOutlay(ctx: OrgContext, input: OutlayInput) {
  await assertOwnedClient(ctx, input.clientId);
  const amountDkk = toDkk(input.amount, input.fxRate);
  const [row] = await getDb()
    .insert(outlays)
    .values({
      ...input,
      fxRate: String(input.fxRate),
      amountDkk,
      orgId: ctx.orgId,
    })
    .returning();
  return row;
}

/**
 * General edit (vendor, description, amount, date, ...). Deliberately does
 * NOT change rebillStatus even if the caller's input carries one — only
 * transitionOutlay may move an outlay through the rebill lifecycle, so an
 * edit form can't become a side door around the state machine (which would
 * also leave rebilledAt/settledAt unset for a status that implies they
 * should be).
 */
export async function updateOutlay(ctx: OrgContext, id: string, input: OutlayInput) {
  await assertOwnedClient(ctx, input.clientId);
  const existing = await getOutlay(ctx, id);
  if (!existing) throw new Error(`Outlay ${id} not found`);

  const amountDkk = toDkk(input.amount, input.fxRate);
  const [row] = await getDb()
    .update(outlays)
    .set({
      ...input,
      rebillStatus: existing.rebillStatus,
      fxRate: String(input.fxRate),
      amountDkk,
      updatedAt: new Date(),
    })
    .where(and(eq(outlays.orgId, ctx.orgId), eq(outlays.id, id)))
    .returning();
  if (!row) throw new Error(`Outlay ${id} not found`);
  return row;
}

/**
 * The state machine (lib/finance/rebill.ts) decides legality; this only
 * persists the result. An illegal transition throws before any write happens.
 */
export async function transitionOutlay(ctx: OrgContext, id: string, to: RebillStatus) {
  const row = await getOutlay(ctx, id);
  if (!row) throw new Error(`Outlay ${id} not found`);

  const next = applyTransition(
    {
      rebillStatus: row.rebillStatus,
      rebilledAt: row.rebilledAt,
      settledAt: row.settledAt,
    },
    to,
    todayLocal(),
  );

  const [updated] = await getDb()
    .update(outlays)
    .set({ ...next, updatedAt: new Date() })
    .where(and(eq(outlays.orgId, ctx.orgId), eq(outlays.id, id)))
    .returning();
  if (!updated) throw new Error(`Outlay ${id} not found`);
  return updated;
}
