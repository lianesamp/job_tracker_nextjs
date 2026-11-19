"use server";

/**
 * Server Actions — the mutation layer of our app.
 *
 * WHAT ARE SERVER ACTIONS?
 * Async functions that run on the server but can be called directly from
 * Client Components (forms, onClick handlers). Next.js generates an HTTP
 * endpoint behind the scenes — you never write fetch() or define a route.
 *
 * Laravel equivalent: controller methods (e.g. ApplicationController@store).
 * The difference: in Laravel you'd define a POST route + controller + call it
 * via a form action or Axios. Here the framework wires it all up for you.
 *
 * WHY "use server"?
 * This directive tells the Next.js compiler: "every exported function in this
 * file runs ONLY on the server." The client gets a reference (like a URL) to
 * call it, but never sees the function body. This is safe for DB operations.
 *
 * RETURN PATTERN:
 * We return { success, data?, errors? } instead of throwing errors.
 * This makes it easy for forms to show field-level validation messages.
 */

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { applications, statusHistory } from "@/db/schema";
import {
  createApplicationSchema,
  updateApplicationSchema,
  updateStatusSchema,
} from "@/lib/validators";
import { isDemoMode } from "@/lib/config";
import type { Application } from "@/types";

// ─── Demo mode guard ─────────────────────────────────────
// Reusable check for all mutation actions. Returns an error result
// if DEMO_MODE is enabled, preventing any writes to the database.
const DEMO_ERROR: ActionResult<Application> = {
  success: false,
  formError: "This is a demo. Modifications are disabled.",
};

// ─── Shared result type ─────────────────────────────────
// Every action returns this shape so the UI can handle success/failure uniformly.
// `fieldErrors` maps field names to arrays of error messages (for form validation).
// `formError` is a single top-level error (e.g. "Application not found").

export type ActionResult<T = undefined> =
  | { success: true; data: T }
  | { success: false; fieldErrors?: Record<string, string[]>; formError?: string };

// The state shape used by useActionState for the create form.
// `null` = initial state (form hasn't been submitted yet).
export type FormState = ActionResult<Application> | null;

// ─── createApplication ──────────────────────────────────

export async function createApplication(
  input: unknown
): Promise<ActionResult<Application>> {
  if (isDemoMode()) return DEMO_ERROR;

  // 1. Validate input with Zod (.safeParse doesn't throw — it returns a result)
  const parsed = createApplicationSchema.safeParse(input);

  if (!parsed.success) {
    // Zod 4: flatten() gives { fieldErrors: { company: ["..."], ... } }
    const flat = parsed.error.flatten();
    return { success: false, fieldErrors: flat.fieldErrors };
  }

  const { status, jobUrl, ...rest } = parsed.data;

  try {
    // 2. Insert the application row
    //    Drizzle's .insert().values().returning() is like Laravel's
    //    Application::create($data) — but it returns the full row.
    const [created] = await db
      .insert(applications)
      .values({
        ...rest,
        // Convert empty string to null so the DB column stays clean
        jobUrl: jobUrl || null,
        status,
      })
      .returning();

    // 3. Record the initial status in the history table
    //    fromStatus is null because this is a brand-new application.
    await db.insert(statusHistory).values({
      applicationId: created.id,
      fromStatus: null,
      toStatus: created.status,
    });

    // 4. Revalidate the board page so it shows the new card
    //    revalidatePath() tells Next.js: "the data for this route is stale,
    //    re-fetch it on the next request."
    //    Laravel equivalent: Cache::forget('board-data') — but automatic.
    revalidatePath("/board");

    return { success: true, data: created };
  } catch (error) {
    console.error("createApplication failed:", error);
    return { success: false, formError: "Failed to create application. Please try again." };
  }
}

// ─── createApplicationAction (for useActionState) ───────
// useActionState requires the signature: (prevState, formData) => newState.
// This wrapper converts FormData to a plain object and calls createApplication.
//
// WHY a separate wrapper?
// createApplication takes `unknown` so it can also be called programmatically
// (e.g. from tests or other server code). This wrapper is the FormData adapter.
//
// Laravel equivalent: in Laravel, the controller receives the Request object
// and you'd call $request->validated(). Here FormData is the "Request" and
// Zod validation happens inside createApplication.

export async function createApplicationAction(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  // Object.fromEntries(formData) converts FormData → { key: value } object.
  // This works because all our form fields are simple strings.
  const raw = Object.fromEntries(formData);
  const result = await createApplication(raw);

  // On success, redirect to the board.
  // redirect() throws internally (a Next.js convention), so it must be
  // called OUTSIDE the try/catch in createApplication.
  if (result.success) {
    redirect("/board");
  }

  return result;
}

// ─── updateApplication ──────────────────────────────────

export async function updateApplication(
  id: number,
  input: unknown
): Promise<ActionResult<Application>> {
  if (isDemoMode()) return DEMO_ERROR;

  // 1. Validate the partial input
  const parsed = updateApplicationSchema.safeParse(input);

  if (!parsed.success) {
    const flat = parsed.error.flatten();
    return { success: false, fieldErrors: flat.fieldErrors };
  }

  const data = parsed.data;

  // Nothing to update — return early
  if (Object.keys(data).length === 0) {
    return { success: false, formError: "No fields to update." };
  }

  try {
    // 2. Fetch the current row so we can check if status changed
    //    eq() is Drizzle's WHERE helper: eq(column, value) → "column = value"
    const [existing] = await db
      .select()
      .from(applications)
      .where(eq(applications.id, id));

    if (!existing) {
      return { success: false, formError: "Application not found." };
    }

    // 3. If jobUrl is an empty string, convert to null
    const updateData = {
      ...data,
      ...(data.jobUrl !== undefined ? { jobUrl: data.jobUrl || null } : {}),
      updatedAt: new Date(),
    };

    // 4. Perform the update
    const [updated] = await db
      .update(applications)
      .set(updateData)
      .where(eq(applications.id, id))
      .returning();

    // 5. If the status changed, record it in history
    if (data.status && data.status !== existing.status) {
      await db.insert(statusHistory).values({
        applicationId: id,
        fromStatus: existing.status,
        toStatus: data.status,
      });
    }

    revalidatePath("/board");
    revalidatePath(`/applications/${id}`);

    return { success: true, data: updated };
  } catch (error) {
    console.error("updateApplication failed:", error);
    return { success: false, formError: "Failed to update application. Please try again." };
  }
}

// ─── updateApplicationAction (for useActionState) ───────
// Same pattern as createApplicationAction, but for editing.
// The application ID is passed as a hidden form field.

export async function updateApplicationAction(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const id = Number(formData.get("id"));
  if (!id || isNaN(id)) {
    return { success: false, formError: "Invalid application ID." };
  }

  // Remove the id field — updateApplication doesn't expect it in the data
  const raw = Object.fromEntries(formData);
  delete raw.id;

  const result = await updateApplication(id, raw);

  if (result.success) {
    redirect(`/applications/${id}`);
  }

  return result;
}

// ─── updateApplicationStatus ────────────────────────────
// A lightweight action for Kanban drag-and-drop.
// Separate from updateApplication because it only changes the status column
// and always records a history entry — no need for the full update schema.

export async function updateApplicationStatus(
  input: unknown
): Promise<ActionResult<Application>> {
  if (isDemoMode()) return DEMO_ERROR;

  // 1. Validate with the small status-only schema
  const parsed = updateStatusSchema.safeParse(input);

  if (!parsed.success) {
    const flat = parsed.error.flatten();
    return { success: false, fieldErrors: flat.fieldErrors };
  }

  const { applicationId, status } = parsed.data;

  try {
    // 2. Fetch current status for the history entry
    const [existing] = await db
      .select()
      .from(applications)
      .where(eq(applications.id, applicationId));

    if (!existing) {
      return { success: false, formError: "Application not found." };
    }

    // 3. Skip if the status hasn't actually changed (e.g. card dropped in same column)
    if (existing.status === status) {
      return { success: true, data: existing };
    }

    // 4. Update the status and timestamp
    const [updated] = await db
      .update(applications)
      .set({ status, updatedAt: new Date() })
      .where(eq(applications.id, applicationId))
      .returning();

    // 5. Record the status change
    await db.insert(statusHistory).values({
      applicationId,
      fromStatus: existing.status,
      toStatus: status,
    });

    revalidatePath("/board");

    return { success: true, data: updated };
  } catch (error) {
    console.error("updateApplicationStatus failed:", error);
    return { success: false, formError: "Failed to update status. Please try again." };
  }
}
