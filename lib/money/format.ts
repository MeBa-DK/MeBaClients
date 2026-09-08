export function formatDkk(minorUnits: number): string {
  return new Intl.NumberFormat("da-DK", {
    style: "currency",
    currency: "DKK",
  }).format(minorUnits / 100);
}

/**
 * Profit as a percentage of total revenue (received + expected), for
 * display only — rounds to a whole percent. Revenue of 0 has no
 * meaningful margin, so it renders as "—" rather than NaN or 0%.
 */
export function formatProfitMarginPercent(profit: number, totalRevenue: number): string {
  if (totalRevenue === 0) return "—";
  return `${Math.round((profit / totalRevenue) * 100)}%`;
}
