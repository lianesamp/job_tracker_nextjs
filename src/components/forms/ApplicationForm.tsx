"use client";

/**
 * ApplicationForm — a reusable Client Component for creating AND editing
 * job applications.
 *
 * HOW IT SUPPORTS BOTH MODES:
 * - If `application` prop is undefined → CREATE mode (empty form, calls createApplicationAction)
 * - If `application` prop is provided → EDIT mode (prefilled form, calls updateApplicationAction)
 *
 * This is a common React pattern: one component, two modes via props.
 * Laravel equivalent: a Blade partial like `_form.blade.php` that checks
 * `isset($application)` to decide whether to show create or edit.
 *
 * The form uses `defaultValue` on inputs (not `value`) so they're "uncontrolled."
 * Uncontrolled = the DOM holds the state, React doesn't track every keystroke.
 * This works perfectly with Server Actions because FormData reads from the DOM.
 * Controlled inputs (with useState + onChange) would work too, but are overkill
 * when you don't need to react to every keystroke.
 */

import { useActionState } from "react";
import {
  createApplicationAction,
  updateApplicationAction,
} from "@/lib/actions";
import type { FormState } from "@/lib/actions";
import { WORK_MODES, APPLICATION_STATUSES } from "@/db/schema";
import type { Application } from "@/types";

const WORK_MODE_LABELS: Record<(typeof WORK_MODES)[number], string> = {
  "on-site": "On-site",
  hybrid: "Hybrid",
  remote: "Remote",
};

const STATUS_LABELS: Record<(typeof APPLICATION_STATUSES)[number], string> = {
  saved: "Saved",
  applied: "Applied",
  interview: "Interview",
  technical_test: "Technical Test",
  offer: "Offer",
  rejected: "Rejected",
};

interface ApplicationFormProps {
  /** Pass an existing application to switch to edit mode. */
  application?: Application;
}

export function ApplicationForm({ application }: ApplicationFormProps) {
  const isEditing = !!application;

  // Pick the right Server Action based on mode.
  const action = isEditing ? updateApplicationAction : createApplicationAction;

  const [state, formAction, isPending] = useActionState<FormState, FormData>(
    action,
    null
  );

  const fieldError = (field: string): string | undefined => {
    if (state && !state.success && state.fieldErrors?.[field]) {
      return state.fieldErrors[field][0];
    }
    return undefined;
  };

  return (
    <form action={formAction} className="space-y-5">
      {/* Hidden field: the application ID for edit mode.
          This is how the updateApplicationAction knows which row to update.
          Laravel equivalent: a hidden input or the route param /applications/{id}. */}
      {isEditing && (
        <input type="hidden" name="id" value={application.id} />
      )}

      {/* ─── Top-level error ─── */}
      {state && !state.success && state.formError && (
        <div className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.formError}
        </div>
      )}

      {/* ─── Success message (edit mode only — create redirects) ─── */}
      {state?.success && isEditing && (
        <div className="rounded-md border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-700">
          Application updated successfully.
        </div>
      )}

      {/* ─── Company (required) ─── */}
      <Field
        label="Company"
        name="company"
        defaultValue={application?.company}
        error={fieldError("company")}
        required
      />

      {/* ─── Role (required) ─── */}
      <Field
        label="Role"
        name="role"
        defaultValue={application?.role}
        error={fieldError("role")}
        required
      />

      {/* ─── Job URL (optional) ─── */}
      <Field
        label="Job URL"
        name="jobUrl"
        type="url"
        placeholder="https://..."
        defaultValue={application?.jobUrl ?? ""}
        error={fieldError("jobUrl")}
      />

      {/* ─── City (optional) ─── */}
      <Field
        label="City"
        name="city"
        defaultValue={application?.city ?? ""}
        error={fieldError("city")}
      />

      {/* ─── Work Mode (required select) ─── */}
      <div>
        <label htmlFor="workMode" className="mb-1 block text-sm font-medium">
          Work Mode <span className="text-red-500">*</span>
        </label>
        <select
          id="workMode"
          name="workMode"
          defaultValue={application?.workMode ?? "remote"}
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

      {/* ─── Status (only shown in edit mode) ─── */}
      {isEditing && (
        <div>
          <label htmlFor="status" className="mb-1 block text-sm font-medium">
            Status
          </label>
          <select
            id="status"
            name="status"
            defaultValue={application.status}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
          >
            {APPLICATION_STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
          <FieldError message={fieldError("status")} />
        </div>
      )}

      {/* ─── Salary (optional) ─── */}
      <Field
        label="Salary"
        name="salary"
        placeholder="e.g. 30k-40k EUR"
        defaultValue={application?.salary ?? ""}
        error={fieldError("salary")}
      />

      {/* ─── Notes (optional textarea) ─── */}
      <div>
        <label htmlFor="notes" className="mb-1 block text-sm font-medium">
          Notes
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={4}
          defaultValue={application?.notes ?? ""}
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
        {isPending
          ? "Saving..."
          : isEditing
            ? "Update Application"
            : "Save Application"}
      </button>
    </form>
  );
}

// ─── Reusable sub-components (private to this file) ─────

function Field({
  label,
  name,
  type = "text",
  placeholder,
  defaultValue,
  error,
  required,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  defaultValue?: string;
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
        defaultValue={defaultValue}
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
      />
      <FieldError message={error} />
    </div>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-sm text-red-600">{message}</p>;
}
