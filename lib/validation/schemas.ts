import { z } from "zod";

const minorUnits = z.number().int();
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "must be YYYY-MM-DD");

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
    description: z.string().min(1),
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
    vendor: z.string().min(1),
    description: z.string().min(1),
    date: isoDate,
    rebillStatus: z
      .enum(["internal", "rebillable", "rebilled", "settled"])
      .default("internal"),
    ...withFx,
  })
  .superRefine(checkFx);
