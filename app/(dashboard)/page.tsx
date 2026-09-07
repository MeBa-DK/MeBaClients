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
        <p>No clients. Add one.</p>
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
      <table>
        <thead>
          <tr>
            <th>Client</th>
            <th>Income settled</th>
            <th>Unrecovered outlays</th>
            <th>Margin</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.clientId}
              style={row.margin < 0 ? { color: "red" } : undefined}
            >
              <td>
                <Link href={`/clients/${row.clientId}`}>{row.clientName}</Link>
              </td>
              <td>{formatDkk(row.incomeSettled)}</td>
              <td>{formatDkk(row.outlaysUnrecovered)}</td>
              <td>{formatDkk(row.margin)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td>
              <strong>Total</strong>
            </td>
            <td>{formatDkk(totalIncome)}</td>
            <td>{formatDkk(totalUnrecovered)}</td>
            <td>
              <strong>{formatDkk(totalMargin)}</strong>
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
