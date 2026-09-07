export function formatDkk(minorUnits: number): string {
  return new Intl.NumberFormat("da-DK", {
    style: "currency",
    currency: "DKK",
  }).format(minorUnits / 100);
}
