"use client";

import { useState, useTransition } from "react";
import { createClientAction } from "../client-actions";

export function NewClientForm() {
  const [isPending, startTransition] = useTransition();
  const [errors, setErrors] = useState<string[]>([]);

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await createClientAction(formData);
      // createClientAction redirects on success, so reaching here means it
      // returned an error result instead.
      if (result && !result.ok) {
        setErrors(result.errors);
      }
    });
  }

  return (
    <form action={handleSubmit}>
      {errors.length > 0 && (
        <ul className="form-errors" role="alert">
          {errors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      )}
      <div>
        <label htmlFor="name">Name</label>
        <input id="name" name="name" placeholder="Client name" required />
      </div>
      <div>
        <label htmlFor="notes">Notes</label>
        <textarea id="notes" name="notes" placeholder="Optional notes" />
      </div>
      <button type="submit" disabled={isPending}>
        {isPending ? "Adding…" : "Add client"}
      </button>
    </form>
  );
}
