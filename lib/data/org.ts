import { asc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { organizations } from "@/lib/db/schema";
import type { OrgContext } from "./context";

const DEFAULT_ORG_NAME = "MeBa";

/**
 * Single-user local use: there is one organization. This resolves it (creating
 * it on first use) rather than requiring a session, per the plan's decision to
 * defer authentication.
 *
 * Looked up by name rather than "first row" so concurrent callers (a page
 * request racing a seed script, for instance) converge on the same org
 * instead of each creating their own and silently forking the dataset.
 */
export async function getDefaultOrgContext(): Promise<OrgContext> {
  const db = getDb();
  const [existing] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.name, DEFAULT_ORG_NAME))
    .orderBy(asc(organizations.createdAt))
    .limit(1);
  if (existing) return { orgId: existing.id };

  const [created] = await db
    .insert(organizations)
    .values({ name: DEFAULT_ORG_NAME })
    .returning();
  return { orgId: created.id };
}
