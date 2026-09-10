import { and, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { clients } from "@/lib/db/schema";
import type { OrgContext } from "./context";

export type ClientInput = { name: string; notes?: string | null };

/**
 * Excludes archived clients by default — the default list view shouldn't
 * surface a client someone deliberately archived. Pass includeArchived to
 * see everything (e.g. an "all clients" admin view, if one is ever needed).
 */
export async function listClients(ctx: OrgContext, options?: { includeArchived?: boolean }) {
  const where = options?.includeArchived
    ? eq(clients.orgId, ctx.orgId)
    : and(eq(clients.orgId, ctx.orgId), eq(clients.archived, false));
  return getDb().select().from(clients).where(where);
}

export async function getClient(ctx: OrgContext, id: string) {
  const [row] = await getDb()
    .select()
    .from(clients)
    .where(and(eq(clients.orgId, ctx.orgId), eq(clients.id, id)));
  return row ?? null;
}

export async function createClient(ctx: OrgContext, input: ClientInput) {
  const [row] = await getDb()
    .insert(clients)
    .values({ ...input, orgId: ctx.orgId })
    .returning();
  return row;
}

export async function updateClient(ctx: OrgContext, id: string, input: ClientInput) {
  const [row] = await getDb()
    .update(clients)
    .set({ ...input, updatedAt: new Date() })
    .where(and(eq(clients.orgId, ctx.orgId), eq(clients.id, id)))
    .returning();
  if (!row) throw new Error(`Client ${id} not found`);
  return row;
}

export async function setClientArchived(ctx: OrgContext, id: string, archived: boolean) {
  const [row] = await getDb()
    .update(clients)
    .set({ archived, updatedAt: new Date() })
    .where(and(eq(clients.orgId, ctx.orgId), eq(clients.id, id)))
    .returning();
  if (!row) throw new Error(`Client ${id} not found`);
  return row;
}
