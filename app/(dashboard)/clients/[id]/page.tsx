import { notFound } from "next/navigation";
import { getClient } from "@/lib/data/clients";
import { listIncomeForClient } from "@/lib/data/income";
import { listOutlaysForClient } from "@/lib/data/outlays";
import { getDefaultOrgContext } from "@/lib/data/org";
import { clientMargin } from "@/lib/finance/margin";
import { todayLocal, monthOf } from "@/lib/date";
import { formatDkk } from "@/lib/money/format";

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

  return (
    <div>
      <h1>{client.name}</h1>

      <section>
        <h2>Margin — {month}</h2>
        <ul>
          <li>Income settled: {formatDkk(margin.incomeSettled)}</li>
          <li>Income expected: {formatDkk(margin.incomeExpected)}</li>
          <li>Outlays internal: {formatDkk(margin.outlaysInternal)}</li>
          <li>Outlays unrecovered: {formatDkk(margin.outlaysUnrecovered)}</li>
          <li>Outlays recovered: {formatDkk(margin.outlaysRecovered)}</li>
          <li>
            <strong>Margin: {formatDkk(margin.margin)}</strong>
          </li>
        </ul>
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
                <tr key={row.id}>
                  <td>{row.date}</td>
                  <td>{row.description}</td>
                  <td>{formatDkk(row.amountDkk)}</td>
                  <td>{row.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
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
                <tr key={row.id}>
                  <td>{row.date}</td>
                  <td>{row.vendor}</td>
                  <td>{row.description}</td>
                  <td>{formatDkk(row.amountDkk)}</td>
                  <td>{row.rebillStatus}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
