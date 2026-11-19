"use client";

/**
 * ApplicationForm — a Client Component for creating a new job application.
 *
 * WHY "use client"?
 * This component needs browser interactivity: form submission, displaying
 * validation errors, and a pending state while the server action runs.
 * Server Components can't use hooks or handle events.
 *
 * Vue equivalent: a <script setup> component with v-model on inputs.
 * The difference: in React, the <form> itself calls the Server Action
 * through useActionState — no Axios, no fetch, no manual endpoint.
 *
 * KEY HOOK: useActionState (React 19)
 * Signature: useActionState(action, initialState) → [state, formAction, isPending]
 *   - action: the Server Action to call (must accept (prevState, formData))
 *   - initialState: the state before the first submission (null for us)
 *   - state: the current result (null, success, or error with field messages)
 *   - formAction: pass this to <form action={formAction}>
 *   - isPending: true while the server action is running (for loading UI)
 *
 * Laravel equivalent: none directly. In Laravel you'd submit the form,
 * get redirected back with errors in the session, and use @error('field')
 * in Blade. Here React keeps everything in component state — no page reload.
 */

import { useActionState } from "react";
import { createApplicationAction } from "@/lib/actions";
import type { FormState } from "@/lib/actions";
import { WORK_MODES } from "@/db/schema";

// Labels for the work mode select options
const WORK_MODE_LABELS: Record<(typeof WORK_MODES)[number], string> = {
  "on-site": "On-site",
  hybrid: "Hybrid",
  remote: "Remote",
};

export function ApplicationForm() {
  // useActionState connects the form to the Server Action.
  // `state` starts as null and becomes the ActionResult after each submission.
  const [state, formAction, isPending] = useActionState<FormState, FormData>(
    createApplicationAction,
    null
  );

  // Helper to get field error messages from the state
  const fieldError = (field: string): string | undefined => {
    if (state && !state.success && state.fieldErrors?.[field]) {
      return state.fieldErrors[field][0];
    }
    return undefined;
  };

  return (
    <form action={formAction} className="space-y-5">
      {/* ─── Top-level error (e.g. DB failure) ─── */}
      {state && !state.success && state.formError && (
        <div className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.formError}
        </div>
      )}

      {/* ─── Company (required) ─── */}
      <Field label="Company" name="company" error={fieldError("company")} required />

      {/* ─── Role (required) ─── */}
      <Field label="Role" name="role" error={fieldError("role")} required />

      {/* ─── Job URL (optional) ─── */}
      <Field
        label="Job URL"
        name="jobUrl"
        type="url"
        placeholder="https://..."
        error={fieldError("jobUrl")}
      />

      {/* ─── City (optional) ─── */}
      <Field label="City" name="city" error={fieldError("city")} />

      {/* ─── Work Mode (required select) ─── */}
      <div>
        <label htmlFor="workMode" className="mb-1 block text-sm font-medium">
          Work Mode <span className="text-red-500">*</span>
        </label>
        <select
          id="workMode"
          name="workMode"
          defaultValue="remote"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
        >
          {WORK_MODES.map((mode) => (
            <option key={mode} value={mode}>
              {WORK_MODE_LABELS[mode]}
            </option>
          ))}
        </select>
        <FieldError message={fieldError("workMode")} />
      </div>

      {/* ─── Salary (optional) ─── */}
      <Field label="Salary" name="salary" placeholder="e.g. 30k-40k EUR" error={fieldError("salary")} />

      {/* ─── Notes (optional textarea) ─── */}
      <div>
        <label htmlFor="notes" className="mb-1 block text-sm font-medium">
          Notes
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={4}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
          placeholder="Requirements, tech stack, interview notes..."
        />
        <FieldError message={fieldError("notes")} />
      </div>

      {/* ─── Submit button ─── */}
      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? "Saving..." : "Save Application"}
      </button>
    </form>
  );
}

// ─── Reusable sub-components (private to this file) ─────

/** A labeled text input field with optional error message. */
function Field({
  label,
  name,
  type = "text",
  placeholder,
  error,
  required,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  error?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label htmlFor={name} className="mb-1 block text-sm font-medium">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
      />
      <FieldError message={error} />
    </div>
  );
}

/** Displays a field-level validation error. */
function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-sm text-red-600">{message}</p>;
}
