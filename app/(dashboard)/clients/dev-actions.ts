"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/data/clients";
import { getDefaultOrgContext } from "@/lib/data/org";

export type ActionResult = { ok: true } | { ok: false, errors: string[] };

/**
 * Dev-only shortcut for seeding a client through the UI instead of a
 * throwaway script. No-ops outside development — see DevPanel.
 */
export async function createClientDevAction(formData: FormData): Promise<ActionResult> {
  if (process.env.NODE_ENV === "production") {
    return { ok: false, errors: ["Dev panel is disabled in production"] };
  }

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { ok: false, errors: ["Name is required"] };

  const ctx = await getDefaultOrgContext();
  await createClient(ctx, { name });
  revalidatePath("/clients");
  revalidatePath("/");
  return { ok: true };
}
