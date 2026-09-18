"use client";

import { useState } from "react";
import { formatDkk } from "@/lib/money/format";
import type { RebillStatus } from "@/lib/finance/rebill";
import { OutlayEditForm, OutlayRebillControl } from "./outlay-form";

type OutlayRowData = {
  id: string;
  date: string;
  vendor: string;
  description: string;
  amount: number;
  amountDkk: number;
  currency: string;
  fxRate: string;
  rebillStatus: RebillStatus;
};

export function OutlayRow({ clientId, row }: { clientId: string; row: OutlayRowData }) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <tr>
        <td colSpan={5}>
          <OutlayEditForm
            clientId={clientId}
            outlayId={row.id}
            initial={{
              vendor: row.vendor,
              description: row.description,
              amount: row.amount,
              currency: row.currency,
              fxRate: row.fxRate,
              date: row.date,
              rebillStatus: row.rebillStatus,
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
      <td>{row.vendor}</td>
      <td>{row.description}</td>
      <td className="num">{formatDkk(row.amountDkk)}</td>
      <td>
        <OutlayRebillControl
          clientId={clientId}
          outlayId={row.id}
          currentStatus={row.rebillStatus}
          vendor={row.vendor}
        />
        <button type="button" onClick={() => setEditing(true)} aria-label={`Edit ${row.vendor} outlay`}>
          Edit
        </button>
      </td>
    </tr>
  );
}
