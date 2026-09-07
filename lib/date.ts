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
