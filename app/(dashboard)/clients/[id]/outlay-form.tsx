"use client";

import { useState, useTransition } from "react";
import { legalNextStates, type RebillStatus } from "@/lib/finance/rebill";
import { createOutlayAction, updateOutlayAction, transitionOutlayAction } from "./outlay-actions";

export function OutlayForm({ clientId }: { clientId: string }) {
  const [isPending, startTransition] = useTransition();
  const [errors, setErrors] = useState<string[]>([]);

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await createOutlayAction(clientId, formData);
      if (!result.ok) {
        setErrors(result.errors);
      } else {
        setErrors([]);
        (document.getElementById("outlay-form") as HTMLFormElement | null)?.reset();
      }
    });
  }

  return (
    <div className="add-form">
      <h3>Add outlay</h3>
      <form id="outlay-form" action={handleSubmit}>
        {errors.length > 0 && (
          <ul className="form-errors" role="alert">
            {errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        )}
        <input name="vendor" placeholder="Vendor" aria-label="Vendor" required />
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
        <select name="rebillStatus" defaultValue="internal" aria-label="Rebill status">
          <option value="internal">internal</option>
          <option value="rebillable">rebillable</option>
        </select>
        <button type="submit" disabled={isPending}>
          {isPending ? "Saving…" : "Add outlay"}
        </button>
      </form>
    </div>
  );
}

export function OutlayRebillControl({
  clientId,
  outlayId,
  currentStatus,
  vendor,
}: {
  clientId: string;
  outlayId: string;
  currentStatus: RebillStatus;
  vendor: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const options = legalNextStates(currentStatus);

  if (options.length === 0) {
    return (
      <span className="rebill-status">
        {currentStatus} (final)
        <span className="sr-only"> — {vendor} outlay, no further transitions</span>
      </span>
    );
  }

  return (
    <span className="rebill-actions">
      <span className="rebill-status">{currentStatus}</span>
      {options.map((next) => (
        <button
          key={next}
          type="button"
          className="rebill-transition-btn"
          disabled={isPending}
          aria-label={`Move ${vendor} outlay from ${currentStatus} to ${next}`}
          onClick={() => {
            startTransition(async () => {
              const result = await transitionOutlayAction(clientId, outlayId, next);
              if (!result.ok) setError(result.errors.join(", "));
              else setError(null);
            });
          }}
        >
          → {next}
        </button>
      ))}
      {error && (
        <span className="text-negative" role="alert">
          {error}
        </span>
      )}
    </span>
  );
}

export function OutlayEditForm({
  clientId,
  outlayId,
  initial,
  onDone,
}: {
  clientId: string;
  outlayId: string;
  initial: {
    vendor: string;
    description: string;
    amount: number;
    currency: string;
    fxRate: string;
    date: string;
    rebillStatus: RebillStatus;
  };
  onDone: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [errors, setErrors] = useState<string[]>([]);

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await updateOutlayAction(clientId, outlayId, formData);
      if (!result.ok) {
        setErrors(result.errors);
      } else {
        setErrors([]);
        onDone();
      }
    });
  }

  return (
    <form action={handleSubmit} aria-label={`Edit ${initial.vendor} outlay`}>
      {errors.length > 0 && (
        <ul className="form-errors" role="alert">
          {errors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      )}
      <input name="vendor" defaultValue={initial.vendor} aria-label="Vendor" required />
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
      <input type="hidden" name="rebillStatus" value={initial.rebillStatus} />
      <button type="submit" disabled={isPending}>
        {isPending ? "Saving…" : "Save"}
      </button>
      <button type="button" onClick={onDone}>
        Cancel
      </button>
    </form>
  );
}
