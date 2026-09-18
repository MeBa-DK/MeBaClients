import { monthOf, monthsBetween } from "@/lib/date";

export type RecurringInterval = "monthly" | "quarterly" | "yearly";

export type RecurringIncomeRow = {
  id: string;
  clientId: string;
  description: string;
  recurringInterval: RecurringInterval | null;
  date: string;
};

export type UnpaidMonth = {
  incomeId: string;
  description: string;
  month: string;
};

const STEP: Record<RecurringInterval, number> = {
  monthly: 1,
  quarterly: 3,
  yearly: 12,
};

/**
 * Expected months for a recurring income row from its own date through
 * (and including) `through`, stepping by its interval. Computed on read —
 * nothing is materialized into the database, matching how margin/aging/
 * portfolio all work in this app.
 */
function expectedMonths(row: RecurringIncomeRow, through: string): string[] {
  if (!row.recurringInterval) return [];
  const step = STEP[row.recurringInterval];
  const all = monthsBetween(row.date, through);
  // monthsBetween returns every month; keep every Nth starting at the row's
  // own month so a quarterly retainer that started in March expects
  // March/June/September/..., not every third calendar month from January.
  return all.filter((_, i) => i % step === 0);
}

/**
 * For every recurring income row, which of its expected months (from its
 * own start date through `through`) have no income row recorded for that
 * client in that month at all — settled, expected, invoiced, or otherwise.
 * A month with ANY row for the client is considered accounted for, even if
 * that row isn't this specific recurring row — covers the common case of
 * manually recording that month's payment as a separate one-off entry.
 */
export function unpaidRecurringMonths(
  recurring: RecurringIncomeRow[],
  allIncomeForClient: Map<string, Set<string>>, // clientId -> set of months with any income row
  through: string,
): UnpaidMonth[] {
  const results: UnpaidMonth[] = [];
  const currentMonth = monthOf(through);

  for (const row of recurring) {
    if (!row.recurringInterval) continue;
    const monthsWithIncome = allIncomeForClient.get(row.clientId) ?? new Set<string>();
    for (const month of expectedMonths(row, through)) {
      // Don't flag the current month as "unpaid" before it's even over —
      // a retainer due this month isn't late yet.
      if (month === currentMonth) continue;
      if (!monthsWithIncome.has(month)) {
        results.push({ incomeId: row.id, description: row.description, month });
      }
    }
  }

  return results.sort((a, b) => a.month.localeCompare(b.month));
}
