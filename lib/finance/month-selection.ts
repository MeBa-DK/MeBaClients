const MONTH_PATTERN = /^\d{4}-\d{2}$/;

export type MonthSelectionInput = {
  requestedMonth: string | undefined;
  currentMonth: string;
  recordDates: string[];
};

export type MonthSelection = {
  /** The month actually in effect — the requested one if valid, else current. */
  month: string;
  /** Every month with recorded activity, plus the current month, newest first. */
  availableMonths: string[];
  /** Whether any record falls in `month` — false means the summary is genuinely empty. */
  hasActivity: boolean;
};

/**
 * Resolves which month a client's profitability summary should show, from an
 * optional requested month (e.g. a `?month=` query param) and the dates on
 * that client's records.
 *
 * This exists because the summary card used to be silently locked to the
 * current calendar month with no way to view another one and no explanation
 * when a record's month didn't match — data entered for a past month just
 * read as all-zero with nothing indicating why.
 */
export function resolveMonthSelection(
  input: MonthSelectionInput,
  monthOf: (date: string) => string,
): MonthSelection {
  const { requestedMonth, currentMonth, recordDates } = input;
  const month =
    requestedMonth && MONTH_PATTERN.test(requestedMonth) ? requestedMonth : currentMonth;

  const monthsWithData = new Set([currentMonth, ...recordDates.map(monthOf)]);
  const availableMonths = [...monthsWithData].sort().reverse();

  const hasActivity = recordDates.some((date) => monthOf(date) === month);

  return { month, availableMonths, hasActivity };
}
