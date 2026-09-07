"use server";

import { revalidatePath } from "next/cache";
import { incomeSchema } from "@/lib/validation/schemas";
import { createIncome, updateIncome, setIncomeStatus } from "@/lib/data/income";
import { getDefaultOrgContext } from "@/lib/data/org";

export type ActionResult = { ok: true } | { ok: false; errors: string[] };

function issuesToErrors(issues: { message: string }[]): string[] {
  return issues.map((issue) => issue.message);
}

export async function createIncomeAction(
  clientId: string,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = incomeSchema.safeParse({
    clientId,
    description: formData.get("description"),
    amount: Number(formData.get("amount")),
    currency: formData.get("currency"),
    fxRate: Number(formData.get("fxRate")),
    date: formData.get("date"),
    recurringInterval: formData.get("recurringInterval") || null,
    status: formData.get("status") || undefined,
  });
  if (!parsed.success) return { ok: false, errors: issuesToErrors(parsed.error.issues) };

  const ctx = await getDefaultOrgContext();
  await createIncome(ctx, parsed.data);
  revalidatePath(`/clients/${clientId}`);
  return { ok: true };
}

export async function updateIncomeAction(
  clientId: string,
  incomeId: string,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = incomeSchema.safeParse({
    clientId,
    description: formData.get("description"),
    amount: Number(formData.get("amount")),
    currency: formData.get("currency"),
    fxRate: Number(formData.get("fxRate")),
    date: formData.get("date"),
    recurringInterval: formData.get("recurringInterval") || null,
    status: formData.get("status") || undefined,
  });
  if (!parsed.success) return { ok: false, errors: issuesToErrors(parsed.error.issues) };

  const ctx = await getDefaultOrgContext();
  await updateIncome(ctx, incomeId, parsed.data);
  revalidatePath(`/clients/${clientId}`);
  return { ok: true };
}

export async function setIncomeStatusAction(
  clientId: string,
  incomeId: string,
  status: "expected" | "invoiced" | "settled" | "written_off",
): Promise<ActionResult> {
  const ctx = await getDefaultOrgContext();
  await setIncomeStatus(ctx, incomeId, status);
  revalidatePath(`/clients/${clientId}`);
  return { ok: true };
}
