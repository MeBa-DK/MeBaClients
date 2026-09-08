import { Fragment } from "react";
import Link from "next/link";
import { listClients } from "@/lib/data/clients";
import { listOutlays } from "@/lib/data/outlays";
import { getDefaultOrgContext } from "@/lib/data/org";
import { agingBuckets, type AgingBucketKey } from "@/lib/finance/aging";
import { todayLocal } from "@/lib/date";
import { formatDkk } from "@/lib/money/format";

const BUCKET_ORDER: AgingBucketKey[] = ["0-30", "31-60", "61-90", "90+"];
const BUCKET_LABELS: Record<AgingBucketKey, string> = {
  "0-30": "0–30 days",
  "31-60": "31–60 days",
  "61-90": "61–90 days",
  "90+": "90+ days",
};

export default async function UnrecoveredPage() {
  const ctx = await getDefaultOrgContext();
  const [clients, outlays] = await Promise.all([listClients(ctx), listOutlays(ctx)]);
  const clientNames = new Map(clients.map((c) => [c.id, c.name]));

  const today = todayLocal();
  const aging = agingBuckets(
    outlays.map((o) => ({ ...o, rebillStatus: o.rebillStatus! })),
    today,
  );

  if (aging.total === 0) {
    return (
      <div>
        <h1>Unrecovered outlays</h1>
        <p>Nothing fronted and unrecovered right now.</p>
      </div>
    );
  }

  return (
    <div>
      <h1>Unrecovered outlays</h1>

      <section>
        <h2>By age</h2>
        <dl className="summary-card">
          {BUCKET_ORDER.map((key) => (
            <Fragment key={key}>
              <dt>{BUCKET_LABELS[key]}</dt>
              <dd>{formatDkk(aging.buckets[key].total)}</dd>
            </Fragment>
          ))}
          <dt className="summary-total-label">Total</dt>
          <dd className="summary-total-value">{formatDkk(aging.total)}</dd>
        </dl>
      </section>

      {BUCKET_ORDER.map((key) => {
        const bucket = aging.buckets[key];
        if (bucket.outlays.length === 0) return null;
        return (
          <section key={key}>
            <h2>{BUCKET_LABELS[key]}</h2>
            <table>
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Vendor</th>
                  <th>Amount</th>
                  <th>Rebill status</th>
                </tr>
              </thead>
              <tbody>
                {bucket.outlays.map((outlay) => (
                  <tr key={outlay.id}>
                    <td>
                      <Link href={`/clients/${outlay.clientId}`}>
                        {clientNames.get(outlay.clientId) ?? "Unknown client"}
                      </Link>
                    </td>
                    <td>{outlay.vendor}</td>
                    <td>{formatDkk(outlay.amountDkk)}</td>
                    <td>{outlay.rebillStatus}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        );
      })}
    </div>
  );
}
