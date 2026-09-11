import Link from "next/link";
import { listClients } from "@/lib/data/clients";
import { listIncome } from "@/lib/data/income";
import { listOutlays } from "@/lib/data/outlays";
import { getDefaultOrgContext } from "@/lib/data/org";
import { clientMargin } from "@/lib/finance/margin";
import { todayLocal, monthOf } from "@/lib/date";
import { formatDkk } from "@/lib/money/format";

export default async function ClientsPage() {
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
        <h1>Clients</h1>
        <p className="empty-state">
          No clients yet. <Link href="/clients/new">Add one to start tracking profitability</Link>.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1>Clients</h1>
        <Link href="/clients/new" className="btn-link">
          Add client
        </Link>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th className="num">Profit this month</th>
              <th className="num">Costs to recover</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((client) => {
              const margin = clientMargin(
                client.id,
                income.map((r) => ({ ...r, status: r.status! })),
                outlays.map((r) => ({ ...r, rebillStatus: r.rebillStatus! })),
                month,
              );
              return (
                <tr key={client.id}>
                  <td>
                    <Link href={`/clients/${client.id}`}>{client.name}</Link>
                  </td>
                  <td className={`num ${margin.margin < 0 ? "text-negative" : ""}`}>
                    {formatDkk(margin.margin)}
                  </td>
                  <td className="num">{formatDkk(margin.outlaysUnrecovered)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
