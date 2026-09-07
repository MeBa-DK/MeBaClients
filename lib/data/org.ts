import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { organizations } from "@/lib/db/schema";
import type { OrgContext } from "./context";

const DEFAULT_ORG_NAME = "MeBa";

/**
 * Single-user local use: there is one organization. This resolves it (creating
 * it on first use) rather than requiring a session, per the plan's decision to
 * defer authentication.
 *
 * organizations.name is UNIQUE, so a concurrent caller (a page request racing
 * a seed script, say) that loses the insert race gets a constraint error here
 * rather than silently creating a second "MeBa" and forking the dataset —
 * caught below by re-reading the row the winner created.
 */
export async function getDefaultOrgContext(): Promise<OrgContext> {
  const db = getDb();
  const [existing] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.name, DEFAULT_ORG_NAME))
    .limit(1);
  if (existing) return { orgId: existing.id };

  try {
    const [created] = await db
      .insert(organizations)
      .values({ name: DEFAULT_ORG_NAME })
      .returning();
    return { orgId: created.id };
  } catch {
    const [row] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.name, DEFAULT_ORG_NAME))
      .limit(1);
    if (!row) throw new Error("Failed to resolve default organization");
    return { orgId: row.id };
  }
}
