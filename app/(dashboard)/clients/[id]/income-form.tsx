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
    <div className="add-form">
      <h3>Add income</h3>
      <form id="income-form" action={handleSubmit}>
        {errors.length > 0 && (
          <ul className="form-errors" role="alert">
            {errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        )}
        <input name="description" placeholder="Description" aria-label="Description" required />
        <input
          name="amount"
          type="number"
          placeholder="Amount (øre)"
          aria-label="Amount in øre"
          required
        />
        <input name="currency" defaultValue="DKK" placeholder="Currency" aria-label="Currency" required />
        <input
          name="fxRate"
          type="number"
          step="any"
          defaultValue="1"
          placeholder="FX rate"
          aria-label="FX rate"
          required
        />
        <input name="date" type="date" aria-label="Date" required />
        <select name="status" defaultValue="expected" aria-label="Status">
          {STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
        <select name="recurringInterval" defaultValue="" aria-label="Recurring interval">
          <option value="">One-off</option>
          <option value="monthly">Monthly</option>
          <option value="quarterly">Quarterly</option>
          <option value="yearly">Yearly</option>
        </select>
        <button type="submit" disabled={isPending}>
          {isPending ? "Saving…" : "Add income"}
        </button>
      </form>
    </div>
  );
}

export function IncomeStatusControl({
  clientId,
  incomeId,
  currentStatus,
  description,
}: {
  clientId: string;
  incomeId: string;
  currentStatus: (typeof STATUSES)[number];
  description: string;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <select
      value={currentStatus}
      disabled={isPending}
      aria-label={`Status for ${description}`}
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
    recurringInterval: "monthly" | "quarterly" | "yearly" | null;
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
    <form action={handleSubmit} aria-label={`Edit ${initial.description}`}>
      {errors.length > 0 && (
        <ul className="form-errors" role="alert">
          {errors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      )}
      <input
        name="description"
        defaultValue={initial.description}
        aria-label="Description"
        required
      />
      <input
        name="amount"
        type="number"
        defaultValue={initial.amount}
        aria-label="Amount in øre"
        required
      />
      <input name="currency" defaultValue={initial.currency} aria-label="Currency" required />
      <input
        name="fxRate"
        type="number"
        step="any"
        defaultValue={initial.fxRate}
        aria-label="FX rate"
        required
      />
      <input name="date" type="date" defaultValue={initial.date} aria-label="Date" required />
      <select name="status" defaultValue={initial.status} aria-label="Status">
        {STATUSES.map((status) => (
          <option key={status} value={status}>
            {status}
          </option>
        ))}
      </select>
      <select
        name="recurringInterval"
        defaultValue={initial.recurringInterval ?? ""}
        aria-label="Recurring interval"
      >
        <option value="">One-off</option>
        <option value="monthly">Monthly</option>
        <option value="quarterly">Quarterly</option>
        <option value="yearly">Yearly</option>
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
