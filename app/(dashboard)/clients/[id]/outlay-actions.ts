"use server";

import { revalidatePath } from "next/cache";
import { outlaySchema } from "@/lib/validation/schemas";
import { createOutlay, updateOutlay, transitionOutlay } from "@/lib/data/outlays";
import { getDefaultOrgContext } from "@/lib/data/org";
import type { RebillStatus } from "@/lib/finance/rebill";

export type ActionResult = { ok: true } | { ok: false; errors: string[] };

function issuesToErrors(issues: { message: string }[]): string[] {
  return issues.map((issue) => issue.message);
}

export async function createOutlayAction(
  clientId: string,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = outlaySchema.safeParse({
    clientId,
    vendor: formData.get("vendor"),
    description: formData.get("description"),
    amount: Number(formData.get("amount")),
    currency: formData.get("currency"),
    fxRate: Number(formData.get("fxRate")),
    date: formData.get("date"),
    rebillStatus: formData.get("rebillStatus") || undefined,
  });
  if (!parsed.success) return { ok: false, errors: issuesToErrors(parsed.error.issues) };

  const ctx = await getDefaultOrgContext();
  await createOutlay(ctx, parsed.data);
  revalidatePath(`/clients/${clientId}`);
  return { ok: true };
}

export async function updateOutlayAction(
  clientId: string,
  outlayId: string,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = outlaySchema.safeParse({
    clientId,
    vendor: formData.get("vendor"),
    description: formData.get("description"),
    amount: Number(formData.get("amount")),
    currency: formData.get("currency"),
    fxRate: Number(formData.get("fxRate")),
    date: formData.get("date"),
    rebillStatus: formData.get("rebillStatus") || undefined,
  });
  if (!parsed.success) return { ok: false, errors: issuesToErrors(parsed.error.issues) };

  const ctx = await getDefaultOrgContext();
  await updateOutlay(ctx, outlayId, parsed.data);
  revalidatePath(`/clients/${clientId}`);
  return { ok: true };
}

export async function transitionOutlayAction(
  clientId: string,
  outlayId: string,
  to: RebillStatus,
): Promise<ActionResult> {
  const ctx = await getDefaultOrgContext();
  try {
    await transitionOutlay(ctx, outlayId, to);
  } catch (error) {
    return { ok: false, errors: [error instanceof Error ? error.message : String(error)] };
  }
  revalidatePath(`/clients/${clientId}`);
  return { ok: true };
}
