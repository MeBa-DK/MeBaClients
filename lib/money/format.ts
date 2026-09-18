export function formatDkk(minorUnits: number): string {
  return new Intl.NumberFormat("da-DK", {
    style: "currency",
    currency: "DKK",
  }).format(minorUnits / 100);
}

/**
 * Øre as a plain decimal string in kroner, e.g. "25000.00" — for contexts
 * that need a real number (a CSV a spreadsheet can sum/sort), not
 * locale-formatted display text. Always uses a period decimal point and no
 * thousands separator, regardless of locale, since this is meant to be
 * machine-readable.
 */
export function toDkkDecimalString(minorUnits: number): string {
  return (minorUnits / 100).toFixed(2);
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
