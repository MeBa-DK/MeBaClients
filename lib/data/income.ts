import { and, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { income } from "@/lib/db/schema";
import type { OrgContext } from "./context";

export async function listIncomeForClient(ctx: OrgContext, clientId: string) {
  return getDb()
    .select()
    .from(income)
    .where(and(eq(income.orgId, ctx.orgId), eq(income.clientId, clientId)));
}

export async function listIncome(ctx: OrgContext) {
  return getDb().select().from(income).where(eq(income.orgId, ctx.orgId));
}
