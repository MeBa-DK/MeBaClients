"use client";

import { useState, useTransition } from "react";
import { createIncomeAction, updateIncomeAction, setIncomeStatusAction } from "./income-actions";

const STATUSES = ["expected", "invoiced", "settled", "written_off"] as const;

export function IncomeForm({ clientId }: { clientId: string }) {
  const [isPending, startTransition] = useTransition();
  const [errors, setErrors] = useState<string[]>([]);

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await createIncomeAction(clientId, formData);
      if (!result.ok) {
        setErrors(result.errors);
      } else {
        setErrors([]);
        (document.getElementById("income-form") as HTMLFormElement | null)?.reset();
      }
    });
  }

  return (
    <form id="income-form" action={handleSubmit}>
      <h3>Add income</h3>
      {errors.length > 0 && (
        <ul style={{ color: "red" }}>
          {errors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      )}
      <input name="description" placeholder="Description" required />
      <input name="amount" type="number" placeholder="Amount (øre)" required />
      <input name="currency" defaultValue="DKK" placeholder="Currency" required />
      <input name="fxRate" type="number" step="any" defaultValue="1" placeholder="FX rate" required />
      <input name="date" type="date" required />
      <select name="status" defaultValue="expected">
        {STATUSES.map((status) => (
          <option key={status} value={status}>
            {status}
          </option>
        ))}
      </select>
      <button type="submit" disabled={isPending}>
        {isPending ? "Saving…" : "Add income"}
      </button>
    </form>
  );
}

export function IncomeStatusControl({
  clientId,
  incomeId,
  currentStatus,
}: {
  clientId: string;
  incomeId: string;
  currentStatus: (typeof STATUSES)[number];
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <select
      value={currentStatus}
      disabled={isPending}
      onChange={(event) => {
        const next = event.target.value as (typeof STATUSES)[number];
        startTransition(async () => {
          await setIncomeStatusAction(clientId, incomeId, next);
        });
      }}
    >
      {STATUSES.map((status) => (
        <option key={status} value={status}>
          {status}
        </option>
      ))}
    </select>
  );
}

export function IncomeEditForm({
  clientId,
  incomeId,
  initial,
  onDone,
}: {
  clientId: string;
  incomeId: string;
  initial: {
    description: string;
    amount: number;
    currency: string;
    fxRate: string;
    date: string;
    status: (typeof STATUSES)[number];
  };
  onDone: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [errors, setErrors] = useState<string[]>([]);

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await updateIncomeAction(clientId, incomeId, formData);
      if (!result.ok) {
        setErrors(result.errors);
      } else {
        setErrors([]);
        onDone();
      }
    });
  }

  return (
    <form action={handleSubmit}>
      {errors.length > 0 && (
        <ul style={{ color: "red" }}>
          {errors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      )}
      <input name="description" defaultValue={initial.description} required />
      <input name="amount" type="number" defaultValue={initial.amount} required />
      <input name="currency" defaultValue={initial.currency} required />
      <input name="fxRate" type="number" step="any" defaultValue={initial.fxRate} required />
      <input name="date" type="date" defaultValue={initial.date} required />
      <select name="status" defaultValue={initial.status}>
        {STATUSES.map((status) => (
          <option key={status} value={status}>
            {status}
          </option>
        ))}
      </select>
      <button type="submit" disabled={isPending}>
        {isPending ? "Saving…" : "Save"}
      </button>
      <button type="button" onClick={onDone}>
        Cancel
      </button>
    </form>
  );
}
