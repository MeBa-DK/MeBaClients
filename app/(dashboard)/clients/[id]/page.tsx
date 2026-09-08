import { notFound } from "next/navigation";
import { getClient } from "@/lib/data/clients";
import { listIncomeForClient } from "@/lib/data/income";
import { listOutlaysForClient } from "@/lib/data/outlays";
import { getDefaultOrgContext } from "@/lib/data/org";
import { clientMargin } from "@/lib/finance/margin";
import { todayLocal, monthOf } from "@/lib/date";
import { formatDkk, formatProfitMarginPercent } from "@/lib/money/format";
import { IncomeForm } from "./income-form";
import { IncomeRow } from "./income-row";
import { OutlayForm } from "./outlay-form";
import { OutlayRow } from "./outlay-row";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ctx = await getDefaultOrgContext();
  const client = await getClient(ctx, id);
  if (!client) notFound();

  const [income, outlays] = await Promise.all([
    listIncomeForClient(ctx, id),
    listOutlaysForClient(ctx, id),
  ]);
  const month = monthOf(todayLocal());
  const margin = clientMargin(
    id,
    income.map((r) => ({ ...r, status: r.status! })),
    outlays.map((r) => ({ ...r, rebillStatus: r.rebillStatus! })),
    month,
  );
  const totalRevenue = margin.incomeSettled + margin.incomeExpected;
  const totalProjectCosts =
    margin.outlaysInternal + margin.outlaysUnrecovered + margin.outlaysRecovered;

  return (
    <div>
      <h1>{client.name}</h1>

      <section>
        <h2>Profitability — {month}</h2>
        <dl className="summary-card">
          <dt>Revenue received</dt>
          <dd>{formatDkk(margin.incomeSettled)}</dd>
          <dt>Revenue expected</dt>
          <dd>{formatDkk(margin.incomeExpected)}</dd>
          <dt>Project costs</dt>
          <dd>{formatDkk(totalProjectCosts)}</dd>
          <dt>Costs recovered</dt>
          <dd>{formatDkk(margin.outlaysRecovered)}</dd>
          <dt>Costs to recover</dt>
          <dd>{formatDkk(margin.outlaysUnrecovered)}</dd>
          <dt className="summary-total-label">Profit</dt>
          <dd className="summary-total-value">{formatDkk(margin.margin)}</dd>
          <dt>Profit margin</dt>
          <dd>{formatProfitMarginPercent(margin.margin, totalRevenue)}</dd>
        </dl>
      </section>

      <section>
        <h2>Income</h2>
        {income.length === 0 ? (
          <p>No income recorded yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {income.map((row) => (
                <IncomeRow
                  key={row.id}
                  clientId={id}
                  row={{
                    id: row.id,
                    date: row.date,
                    description: row.description,
                    amount: row.amount,
                    amountDkk: row.amountDkk,
                    currency: row.currency,
                    fxRate: row.fxRate,
                    status: row.status!,
                  }}
                />
              ))}
            </tbody>
          </table>
        )}
        <IncomeForm clientId={id} />
      </section>

      <section>
        <h2>Outlays</h2>
        {outlays.length === 0 ? (
          <p>No outlays recorded yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Vendor</th>
                <th>Description</th>
                <th>Amount</th>
                <th>Rebill status</th>
              </tr>
            </thead>
            <tbody>
              {outlays.map((row) => (
                <OutlayRow
                  key={row.id}
                  clientId={id}
                  row={{
                    id: row.id,
                    date: row.date,
                    vendor: row.vendor,
                    description: row.description,
                    amount: row.amount,
                    amountDkk: row.amountDkk,
                    currency: row.currency,
                    fxRate: row.fxRate,
                    rebillStatus: row.rebillStatus!,
                  }}
                />
              ))}
            </tbody>
          </table>
        )}
        <OutlayForm clientId={id} />
      </section>
    </div>
  );
}
