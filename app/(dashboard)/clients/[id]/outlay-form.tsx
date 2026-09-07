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
    <form id="outlay-form" action={handleSubmit}>
      <h3>Add outlay</h3>
      {errors.length > 0 && (
        <ul style={{ color: "red" }}>
          {errors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      )}
      <input name="vendor" placeholder="Vendor" required />
      <input name="description" placeholder="Description" required />
      <input name="amount" type="number" placeholder="Amount (øre)" required />
      <input name="currency" defaultValue="DKK" placeholder="Currency" required />
      <input name="fxRate" type="number" step="any" defaultValue="1" placeholder="FX rate" required />
      <input name="date" type="date" required />
      <select name="rebillStatus" defaultValue="internal">
        <option value="internal">internal</option>
        <option value="rebillable">rebillable</option>
      </select>
      <button type="submit" disabled={isPending}>
        {isPending ? "Saving…" : "Add outlay"}
      </button>
    </form>
  );
}

export function OutlayRebillControl({
  clientId,
  outlayId,
  currentStatus,
}: {
  clientId: string;
  outlayId: string;
  currentStatus: RebillStatus;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const options = legalNextStates(currentStatus);

  if (options.length === 0) {
    return <span>{currentStatus} (final)</span>;
  }

  return (
    <span>
      {currentStatus}{" "}
      {options.map((next) => (
        <button
          key={next}
          type="button"
          disabled={isPending}
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
      {error && <span style={{ color: "red" }}> {error}</span>}
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
    <form action={handleSubmit}>
      {errors.length > 0 && (
        <ul style={{ color: "red" }}>
          {errors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      )}
      <input name="vendor" defaultValue={initial.vendor} required />
      <input name="description" defaultValue={initial.description} required />
      <input name="amount" type="number" defaultValue={initial.amount} required />
      <input name="currency" defaultValue={initial.currency} required />
      <input name="fxRate" type="number" step="any" defaultValue={initial.fxRate} required />
      <input name="date" type="date" defaultValue={initial.date} required />
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
