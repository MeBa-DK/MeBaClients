"use client";

import { useState } from "react";
import { formatDkk } from "@/lib/money/format";
import { IncomeEditForm, IncomeStatusControl } from "./income-form";

type IncomeRowData = {
  id: string;
  date: string;
  description: string;
  amount: number;
  amountDkk: number;
  currency: string;
  fxRate: string;
  status: "expected" | "invoiced" | "settled" | "written_off";
  recurringInterval: "monthly" | "quarterly" | "yearly" | null;
};

export function IncomeRow({ clientId, row }: { clientId: string; row: IncomeRowData }) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <tr>
        <td colSpan={4}>
          <IncomeEditForm
            clientId={clientId}
            incomeId={row.id}
            initial={{
              description: row.description,
              amount: row.amount,
              currency: row.currency,
              fxRate: row.fxRate,
              date: row.date,
              status: row.status,
              recurringInterval: row.recurringInterval,
            }}
            onDone={() => setEditing(false)}
          />
        </td>
      </tr>
    );
  }

  return (
    <tr>
      <td>{row.date}</td>
      <td>
        {row.description}
        {row.recurringInterval && (
          <span className="recurring-badge" title={`Recurs ${row.recurringInterval}`}>
            {" "}
            ↻ {row.recurringInterval}
          </span>
        )}
      </td>
      <td className="num">{formatDkk(row.amountDkk)}</td>
      <td>
        <IncomeStatusControl
          clientId={clientId}
          incomeId={row.id}
          currentStatus={row.status}
          description={row.description}
        />
        <button
          type="button"
          onClick={() => setEditing(true)}
          aria-label={`Edit ${row.description}`}
        >
          Edit
        </button>
      </td>
    </tr>
  );
}
