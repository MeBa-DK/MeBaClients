import Link from "next/link";
import { listClients } from "@/lib/data/clients";
import { listIncome } from "@/lib/data/income";
import { listOutlays } from "@/lib/data/outlays";
import { getDefaultOrgContext } from "@/lib/data/org";
import { portfolioMargins } from "@/lib/finance/portfolio";
import { todayLocal, monthOf } from "@/lib/date";
import { formatDkk } from "@/lib/money/format";
import { sum } from "@/lib/money";

export default async function PortfolioPage() {
  const ctx = await getDefaultOrgContext();
  const [clients, income, outlays] = await Promise.all([
    listClients(ctx),
    listIncome(ctx),
    listOutlays(ctx),
  ]);
  const month = monthOf(todayLocal());

  if (clients.length === 0) {
    return (
      <div>
        <h1>Portfolio</h1>
        <p className="empty-state">
          No clients yet. <Link href="/clients/new">Add one</Link> to see the portfolio.
        </p>
      </div>
    );
  }

  const rows = portfolioMargins(
    clients.map((c) => ({ id: c.id, name: c.name })),
    income.map((r) => ({ ...r, status: r.status! })),
    outlays.map((r) => ({ ...r, rebillStatus: r.rebillStatus! })),
    month,
  );

  const totalMargin = sum(rows.map((r) => r.margin));
  const totalIncome = sum(rows.map((r) => r.incomeSettled));
  const totalUnrecovered = sum(rows.map((r) => r.outlaysUnrecovered));

  return (
    <div>
      <h1>Portfolio — {month}</h1>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Client</th>
              <th className="num">Revenue received</th>
              <th className="num">Costs to recover</th>
              <th className="num">Profit</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.clientId}>
                <td>
                  <Link href={`/clients/${row.clientId}`}>{row.clientName}</Link>
                </td>
                <td className="num">{formatDkk(row.incomeSettled)}</td>
                <td className="num">{formatDkk(row.outlaysUnrecovered)}</td>
                <td className={`num ${row.margin < 0 ? "text-negative" : ""}`}>
                  {formatDkk(row.margin)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td>Total</td>
              <td className="num">{formatDkk(totalIncome)}</td>
              <td className="num">{formatDkk(totalUnrecovered)}</td>
              <td className={`num ${totalMargin < 0 ? "text-negative" : ""}`}>
                {formatDkk(totalMargin)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
