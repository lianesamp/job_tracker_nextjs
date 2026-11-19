/**
 * App-wide configuration helpers.
 *
 * WHY a separate file?
 * Environment variable reads are scattered across the codebase. By
 * centralizing them here, we have one place to check what env vars
 * the app needs and what their defaults are.
 */

/**
 * Returns true when the app is in demo mode (read-only for visitors).
 *
 * In demo mode:
 *   - Server Actions reject all mutations (protects the DB)
 *   - UI hides create/edit buttons and the form
 *   - Drag-and-drop is disabled on the board
 *
 * Set DEMO_MODE="true" in Vercel env vars for the public deploy.
 * Leave it unset or "false" locally so you can use the app normally.
 */
export function isDemoMode(): boolean {
  return process.env.DEMO_MODE === "true";
}
