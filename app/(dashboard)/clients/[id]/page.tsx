import { notFound } from "next/navigation";
import { getClient } from "@/lib/data/clients";
import { listIncomeForClient } from "@/lib/data/income";
import { listOutlaysForClient } from "@/lib/data/outlays";
import { getDefaultOrgContext } from "@/lib/data/org";
import { clientMargin } from "@/lib/finance/margin";
import { resolveMonthSelection } from "@/lib/finance/month-selection";
import { unpaidRecurringMonths } from "@/lib/finance/recurring";
import { todayLocal, monthOf } from "@/lib/date";
import { formatDkk, formatProfitMarginPercent } from "@/lib/money/format";
import { IncomeForm } from "./income-form";
import { IncomeRow } from "./income-row";
import { OutlayForm } from "./outlay-form";
import { OutlayRow } from "./outlay-row";
import { MonthPicker } from "./month-picker";
import { ClientHeader } from "./client-header";

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
  const { month, availableMonths, hasActivity: hasActivityThisMonth } = resolveMonthSelection(
    {
      requestedMonth,
      currentMonth: monthOf(todayLocal()),
      recordDates: [...income.map((r) => r.date), ...outlays.map((r) => r.date)],
    },
    monthOf,
  );

  const margin = clientMargin(
    id,
    income.map((r) => ({ ...r, status: r.status! })),
    outlays.map((r) => ({ ...r, rebillStatus: r.rebillStatus! })),
    month,
  );
  const totalRevenue = margin.incomeSettled + margin.incomeExpected;
  const totalProjectCosts =
    margin.outlaysInternal + margin.outlaysUnrecovered + margin.outlaysRecovered;

  const recurringRows = income
    .filter((r) => r.recurringInterval)
    .map((r) => ({
      id: r.id,
      clientId: id,
      description: r.description,
      recurringInterval: r.recurringInterval,
      date: r.date,
    }));
  const monthsWithIncome = new Set(income.map((r) => monthOf(r.date)));
  const unpaidMonths = unpaidRecurringMonths(
    recurringRows,
    new Map([[id, monthsWithIncome]]),
    todayLocal(),
  );

  return (
    <div>
      <ClientHeader
        clientId={id}
        name={client.name}
        notes={client.notes}
        archived={client.archived}
      />

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
          <p className="empty-state">No income recorded yet.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th className="num">Amount</th>
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
                      recurringInterval: row.recurringInterval,
                    }}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
        <IncomeForm clientId={id} />
      </section>

      {unpaidMonths.length > 0 && (
        <section>
          <h2>Unpaid recurring months</h2>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Retainer</th>
                </tr>
              </thead>
              <tbody>
                {unpaidMonths.map((u) => (
                  <tr key={`${u.incomeId}-${u.month}`}>
                    <td>{u.month}</td>
                    <td>{u.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section>
        <h2>Outlays</h2>
        {outlays.length === 0 ? (
          <p className="empty-state">No outlays recorded yet.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Vendor</th>
                  <th>Description</th>
                  <th className="num">Amount</th>
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
          </div>
        )}
        <OutlayForm clientId={id} />
      </section>
    </div>
  );
}
