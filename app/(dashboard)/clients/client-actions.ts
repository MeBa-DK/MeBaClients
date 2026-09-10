"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { clientSchema } from "@/lib/validation/schemas";
import { createClient, updateClient, setClientArchived } from "@/lib/data/clients";
import { getDefaultOrgContext } from "@/lib/data/org";

export type ActionResult = { ok: true } | { ok: false; errors: string[] };

function issuesToErrors(issues: { message: string }[]): string[] {
  return issues.map((issue) => issue.message);
}

export async function createClientAction(formData: FormData): Promise<ActionResult | never> {
  const parsed = clientSchema.safeParse({
    name: formData.get("name"),
    notes: formData.get("notes") || null,
  });
  if (!parsed.success) return { ok: false, errors: issuesToErrors(parsed.error.issues) };

  const ctx = await getDefaultOrgContext();
  const client = await createClient(ctx, parsed.data);
  revalidatePath("/clients");
  revalidatePath("/");
  redirect(`/clients/${client.id}`);
}

export async function updateClientAction(
  clientId: string,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = clientSchema.safeParse({
    name: formData.get("name"),
    notes: formData.get("notes") || null,
  });
  if (!parsed.success) return { ok: false, errors: issuesToErrors(parsed.error.issues) };

  const ctx = await getDefaultOrgContext();
  await updateClient(ctx, clientId, parsed.data);
  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/clients");
  revalidatePath("/");
  return { ok: true };
}

export async function setClientArchivedAction(
  clientId: string,
  archived: boolean,
): Promise<ActionResult> {
  const ctx = await getDefaultOrgContext();
  await setClientArchived(ctx, clientId, archived);
  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/clients");
  revalidatePath("/");
  return { ok: true };
}
