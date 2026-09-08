"use client";

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

  return (
    <select
      aria-label="Month"
      value={month}
      onChange={(event) => {
        router.push(`/clients/${clientId}?month=${event.target.value}`);
      }}
    >
      {availableMonths.map((m) => (
        <option key={m} value={m}>
          {m}
        </option>
      ))}
    </select>
  );
}
