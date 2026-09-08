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
import { MonthPicker } from "./month-picker";

const MONTH_PATTERN = /^\d{4}-\d{2}$/;

export default async function ClientDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ month?: string }>;
}) {
  const { id } = await params;
  const { month: requestedMonth } = await searchParams;
  const ctx = await getDefaultOrgContext();
  const client = await getClient(ctx, id);
  if (!client) notFound();

  const [income, outlays] = await Promise.all([
    listIncomeForClient(ctx, id),
    listOutlaysForClient(ctx, id),
  ]);
  const currentMonth = monthOf(todayLocal());
  const month =
    requestedMonth && MONTH_PATTERN.test(requestedMonth) ? requestedMonth : currentMonth;

  // Months with any activity, plus the current month, so the picker always
  // has somewhere useful to go even before anything's been recorded yet.
  const monthsWithData = new Set([
    currentMonth,
    ...income.map((r) => monthOf(r.date)),
    ...outlays.map((r) => monthOf(r.date)),
  ]);
  const availableMonths = [...monthsWithData].sort().reverse();

  const margin = clientMargin(
    id,
    income.map((r) => ({ ...r, status: r.status! })),
    outlays.map((r) => ({ ...r, rebillStatus: r.rebillStatus! })),
    month,
  );
  const totalRevenue = margin.incomeSettled + margin.incomeExpected;
  const totalProjectCosts =
    margin.outlaysInternal + margin.outlaysUnrecovered + margin.outlaysRecovered;
  const hasActivityThisMonth =
    income.some((r) => monthOf(r.date) === month) ||
    outlays.some((r) => monthOf(r.date) === month);

  return (
    <div>
      <h1>{client.name}</h1>

      <section>
        <h2>
          Profitability —{" "}
          <MonthPicker clientId={id} month={month} availableMonths={availableMonths} />
        </h2>
        {!hasActivityThisMonth && (
          <p className="month-empty-note">
            No income or outlays recorded for {month} — figures below are all zero.
          </p>
        )}
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
