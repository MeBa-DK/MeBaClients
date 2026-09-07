import { and, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { outlays } from "@/lib/db/schema";
import type { OrgContext } from "./context";

export async function listOutlaysForClient(ctx: OrgContext, clientId: string) {
  return getDb()
    .select()
    .from(outlays)
    .where(and(eq(outlays.orgId, ctx.orgId), eq(outlays.clientId, clientId)));
}

export async function listOutlays(ctx: OrgContext) {
  return getDb().select().from(outlays).where(eq(outlays.orgId, ctx.orgId));
}
