import { and, asc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { income } from "@/lib/db/schema";
import { toDkk } from "@/lib/money";
import type { OrgContext } from "./context";
import { assertOwnedClient } from "./engagements";

export type IncomeInput = {
  clientId: string;
  engagementId?: string | null;
  description: string;
  amount: number;
  currency: string;
  fxRate: number;
  date: string;
  recurringInterval?: "monthly" | "quarterly" | "yearly" | null;
  status?: "expected" | "invoiced" | "settled" | "written_off";
};

export async function listIncomeForClient(ctx: OrgContext, clientId: string) {
  return getDb()
    .select()
    .from(income)
    .where(and(eq(income.orgId, ctx.orgId), eq(income.clientId, clientId)))
    .orderBy(asc(income.date));
}

export async function listIncome(ctx: OrgContext) {
  return getDb()
    .select()
    .from(income)
    .where(eq(income.orgId, ctx.orgId))
    .orderBy(asc(income.date));
}

export async function createIncome(ctx: OrgContext, input: IncomeInput) {
  await assertOwnedClient(ctx, input.clientId);
  const amountDkk = toDkk(input.amount, input.fxRate);
  const [row] = await getDb()
    .insert(income)
    .values({
      ...input,
      fxRate: String(input.fxRate),
      amountDkk,
      orgId: ctx.orgId,
    })
    .returning();
  return row;
}

export async function updateIncome(ctx: OrgContext, id: string, input: IncomeInput) {
  await assertOwnedClient(ctx, input.clientId);
  const amountDkk = toDkk(input.amount, input.fxRate);
  const [row] = await getDb()
    .update(income)
    .set({
      ...input,
      fxRate: String(input.fxRate),
      amountDkk,
      updatedAt: new Date(),
    })
    .where(and(eq(income.orgId, ctx.orgId), eq(income.id, id)))
    .returning();
  if (!row) throw new Error(`Income ${id} not found`);
  return row;
}

export async function setIncomeStatus(
  ctx: OrgContext,
  id: string,
  status: "expected" | "invoiced" | "settled" | "written_off",
) {
  const [row] = await getDb()
    .update(income)
    .set({ status, updatedAt: new Date() })
    .where(and(eq(income.orgId, ctx.orgId), eq(income.id, id)))
    .returning();
  if (!row) throw new Error(`Income ${id} not found`);
  return row;
}
