export type Money = { amount: number; currency: string };

const CURRENCY_PATTERN = /^[A-Z]{3}$/;

export function isValidCurrency(code: string): boolean {
  return CURRENCY_PATTERN.test(code);
}

function roundHalfAwayFromZero(value: number): number {
  return value < 0 ? -Math.round(-value) : Math.round(value);
}

export function toDkk(amount: number, fxRate: number): number {
  if (!(fxRate > 0)) throw new Error(`fxRate must be positive, got ${fxRate}`);
  return roundHalfAwayFromZero(amount * fxRate);
}

export function sum(amounts: number[]): number {
  return amounts.reduce((total, amount) => total + amount, 0);
}

export function normalizeToMonthly(
  amount: number,
  interval: "monthly" | "quarterly" | "yearly",
): number {
  const divisor = interval === "monthly" ? 1 : interval === "quarterly" ? 3 : 12;
  return roundHalfAwayFromZero(amount / divisor);
}
