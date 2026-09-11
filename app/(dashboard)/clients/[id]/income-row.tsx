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
      <td>{row.description}</td>
      <td className="num">{formatDkk(row.amountDkk)}</td>
      <td>
        <IncomeStatusControl clientId={clientId} incomeId={row.id} currentStatus={row.status} />
        <button type="button" onClick={() => setEditing(true)}>
          Edit
        </button>
      </td>
    </tr>
  );
}
