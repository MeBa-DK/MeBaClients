"use client";

import { useState, useTransition } from "react";
import { createClientDevAction } from "./dev-actions";

/**
 * TEMP — dev-only quick-add for clients, so days 12+ can be exercised through
 * the UI without a throwaway seed script each time. Delete before Day 14's
 * real-data pass; real client creation should go through a proper form.
 */
export function DevPanel() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await createClientDevAction(formData);
      if (!result.ok) {
        setError(result.errors.join(", "));
      } else {
        setError(null);
        (document.getElementById("dev-add-client") as HTMLFormElement | null)?.reset();
      }
    });
  }

  return (
    <details style={{ marginTop: "2rem", border: "1px dashed orange", padding: "0.5rem" }}>
      <summary style={{ color: "orange" }}>Dev panel — quick add client</summary>
      <form id="dev-add-client" action={handleSubmit}>
        {error && <p style={{ color: "red" }}>{error}</p>}
        <input name="name" placeholder="Client name" required />
        <button type="submit" disabled={isPending}>
          {isPending ? "Adding…" : "Add client"}
        </button>
      </form>
    </details>
  );
}
