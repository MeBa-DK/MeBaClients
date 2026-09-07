import { clientMargin, type IncomeRow, type OutlayRow, type Margin } from "./margin";

export type ClientRef = { id: string; name: string };

export type PortfolioRow = Margin & { clientId: string; clientName: string };

export function portfolioMargins(
  clients: ClientRef[],
  income: IncomeRow[],
  outlays: OutlayRow[],
  month: string,
): PortfolioRow[] {
  return clients
    .map((client) => ({
      clientId: client.id,
      clientName: client.name,
      ...clientMargin(client.id, income, outlays, month),
    }))
    .sort((a, b) => b.margin - a.margin);
}
