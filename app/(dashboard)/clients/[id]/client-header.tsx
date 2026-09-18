"use client";

import { useState, useTransition } from "react";
import { updateClientAction, setClientArchivedAction } from "../client-actions";

export function ClientHeader({
  clientId,
  name,
  notes,
  archived,
}: {
  clientId: string;
  name: string;
  notes: string | null;
  archived: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [errors, setErrors] = useState<string[]>([]);

  function handleSave(formData: FormData) {
    startTransition(async () => {
      const result = await updateClientAction(clientId, formData);
      if (!result.ok) {
        setErrors(result.errors);
      } else {
        setErrors([]);
        setEditing(false);
      }
    });
  }

  function handleArchiveToggle() {
    startTransition(async () => {
      await setClientArchivedAction(clientId, !archived);
    });
  }

  if (editing) {
    return (
      <div>
        <form action={handleSave} aria-label={`Edit ${name}`}>
          {errors.length > 0 && (
            <ul className="form-errors" role="alert">
              {errors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          )}
          <div>
            <label htmlFor="name">Name</label>
            <input id="name" name="name" defaultValue={name} required />
          </div>
          <div>
            <label htmlFor="notes">Notes</label>
            <textarea id="notes" name="notes" defaultValue={notes ?? ""} />
          </div>
          <button type="submit" disabled={isPending}>
            {isPending ? "Saving…" : "Save"}
          </button>
          <button type="button" onClick={() => setEditing(false)}>
            Cancel
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="client-header">
      <h1>
        {name}
        {archived && <span className="archived-badge"> (archived)</span>}
      </h1>
      {notes && <p className="text-muted">{notes}</p>}
      <div className="client-header-actions">
        <button type="button" onClick={() => setEditing(true)} aria-label={`Edit ${name}`}>
          Edit
        </button>
        <button
          type="button"
          onClick={handleArchiveToggle}
          disabled={isPending}
          aria-label={`${archived ? "Unarchive" : "Archive"} ${name}`}
        >
          {isPending ? "Working…" : archived ? "Unarchive" : "Archive"}
        </button>
      </div>
    </div>
  );
}
