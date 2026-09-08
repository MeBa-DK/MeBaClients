/**
 * Today's date in the reporting timezone, as YYYY-MM-DD.
 *
 * Never use `new Date().toISOString()` for this: it returns the UTC instant,
 * which is still the previous calendar day for the first hours of each day
 * in CET/CEST (Europe/Copenhagen). Using it to derive "this month" makes the
 * dashboard silently show the previous month for up to two hours after
 * midnight local time.
 */
export function todayLocal(timeZone = "Europe/Copenhagen", now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function monthOf(date: string): string {
  return date.slice(0, 7);
}

/**
 * Whole days between two YYYY-MM-DD dates (to − from). Parses as UTC noon
 * so DST transitions in a local timezone can never shift the day count by
 * one — this is a calendar-day difference, not an elapsed-time one.
 */
export function daysBetween(from: string, to: string): number {
  const fromMs = Date.parse(`${from}T12:00:00Z`);
  const toMs = Date.parse(`${to}T12:00:00Z`);
  return Math.round((toMs - fromMs) / (24 * 60 * 60 * 1000));
}
