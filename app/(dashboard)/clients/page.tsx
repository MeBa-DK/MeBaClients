import Link from "next/link";
import { listClients } from "@/lib/data/clients";
import { listIncome } from "@/lib/data/income";
import { listOutlays } from "@/lib/data/outlays";
import { getDefaultOrgContext } from "@/lib/data/org";
import { clientMargin } from "@/lib/finance/margin";
import { todayLocal, monthOf } from "@/lib/date";
import { formatDkk } from "@/lib/money/format";
import { DevPanel } from "./dev-panel";

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
        <p>No clients. Add one to start.</p>
        {process.env.NODE_ENV !== "production" && <DevPanel />}
      </div>
    );
  }

  return (
    <div>
      <h1>Clients</h1>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Margin this month</th>
            <th>Unrecovered outlays</th>
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
                <td>{formatDkk(margin.margin)}</td>
                <td>{formatDkk(margin.outlaysUnrecovered)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {process.env.NODE_ENV !== "production" && <DevPanel />}
    </div>
  );
}
