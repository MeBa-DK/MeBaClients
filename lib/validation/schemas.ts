import { z } from "zod";

const minorUnits = z.number().int();
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "must be YYYY-MM-DD");

// Generous caps on free-text fields — not a technical limit (Postgres text
// is unbounded) but a sanity limit. A vendor name or description in the
// tens of thousands of characters is never legitimate input and renders as
// one unbroken line across a table that scrolls sideways forever.
const shortText = (label: string) => z.string().trim().min(1, `${label} is required`).max(200);
const longText = (label: string) => z.string().trim().min(1, `${label} is required`).max(2000);

const withFx = {
  amount: minorUnits,
  currency: z.string().regex(/^[A-Z]{3}$/),
  fxRate: z.number().positive(),
};

function checkFx(value: { currency: string; fxRate: number }, ctx: z.RefinementCtx) {
  if (value.currency === "DKK" && value.fxRate !== 1) {
    ctx.addIssue({ code: "custom", message: "DKK must have an fxRate of exactly 1" });
  }
  if (value.currency !== "DKK" && value.fxRate === 1) {
    ctx.addIssue({ code: "custom", message: "A non-DKK amount needs a real fxRate" });
  }
}

export const incomeSchema = z
  .object({
    clientId: z.string().uuid(),
    engagementId: z.string().uuid().nullable().optional(),
    description: longText("Description"),
    date: isoDate,
    recurringInterval: z.enum(["monthly", "quarterly", "yearly"]).nullable().optional(),
    status: z.enum(["expected", "invoiced", "settled", "written_off"]).default("expected"),
    ...withFx,
  })
  .superRefine(checkFx);

export const outlaySchema = z
  .object({
    clientId: z.string().uuid(),
    engagementId: z.string().uuid().nullable().optional(),
    vendor: shortText("Vendor"),
    description: longText("Description"),
    date: isoDate,
    rebillStatus: z
      .enum(["internal", "rebillable", "rebilled", "settled"])
      .default("internal"),
    ...withFx,
  })
  .superRefine(checkFx);

export const clientSchema = z.object({
  name: shortText("Name"),
  notes: longText("Notes").nullable().optional(),
});
