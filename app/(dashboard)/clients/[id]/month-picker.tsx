"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

export function MonthPicker({
  clientId,
  month,
  availableMonths,
}: {
  clientId: string;
  month: string;
  availableMonths: string[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <span className="month-picker">
      <select
        aria-label="Month"
        value={month}
        disabled={isPending}
        onChange={(event) => {
          const nextMonth = event.target.value;
          startTransition(() => {
            router.push(`/clients/${clientId}?month=${nextMonth}`);
          });
        }}
      >
        {availableMonths.map((m) => (
          <option key={m} value={m}>
            {m}
          </option>
        ))}
      </select>
      {isPending && (
        <span className="month-picker-spinner" role="status" aria-label="Loading" />
      )}
    </span>
  );
}
