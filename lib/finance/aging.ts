import { daysBetween } from "@/lib/date";

export type AgingOutlay = {
  id: string;
  clientId: string;
  vendor: string;
  amountDkk: number;
  rebillStatus: "internal" | "rebillable" | "rebilled" | "settled";
  date: string;
  rebilledAt: string | null;
};

export type AgingBucketKey = "0-30" | "31-60" | "61-90" | "90+";

export type AgingBucket = {
  outlays: AgingOutlay[];
  total: number;
};

export type Aging = {
  buckets: Record<AgingBucketKey, AgingBucket>;
  total: number;
};

const BUCKET_KEYS: AgingBucketKey[] = ["0-30", "31-60", "61-90", "90+"];

function bucketFor(ageInDays: number): AgingBucketKey {
  if (ageInDays <= 30) return "0-30";
  if (ageInDays <= 60) return "31-60";
  if (ageInDays <= 90) return "61-90";
  return "90+";
}

/**
 * Buckets unrecovered outlays (rebillable or rebilled — not yet settled) by
 * how long the company has been carrying the cost. Internal and settled
 * outlays are excluded: internal was never going to be recovered, settled
 * already has been.
 *
 * Age is measured from `date` for a rebillable outlay (fronted, not yet
 * even invoiced) and from `rebilledAt` for a rebilled one (invoiced — the
 * clock that matters now is how long since the invoice went out, not how
 * long ago the cost was originally incurred).
 */
export function agingBuckets(outlays: AgingOutlay[], today: string): Aging {
  const buckets: Record<AgingBucketKey, AgingBucket> = {
    "0-30": { outlays: [], total: 0 },
    "31-60": { outlays: [], total: 0 },
    "61-90": { outlays: [], total: 0 },
    "90+": { outlays: [], total: 0 },
  };

  const withAge = outlays
    .filter((o) => o.rebillStatus === "rebillable" || o.rebillStatus === "rebilled")
    .map((o) => {
      const agedFrom = o.rebillStatus === "rebilled" ? (o.rebilledAt ?? o.date) : o.date;
      return { outlay: o, ageInDays: daysBetween(agedFrom, today) };
    })
    .sort((a, b) => b.ageInDays - a.ageInDays); // oldest first

  for (const { outlay, ageInDays } of withAge) {
    const key = bucketFor(ageInDays);
    buckets[key].outlays.push(outlay);
    buckets[key].total += outlay.amountDkk;
  }

  const total = BUCKET_KEYS.reduce((sum, key) => sum + buckets[key].total, 0);

  return { buckets, total };
}
