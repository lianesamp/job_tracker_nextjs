"use client";

/**
 * error.tsx — Automatic error boundary for the /board route.
 *
 * HOW IT WORKS:
 * Next.js wraps the page in a React Error Boundary using this component.
 * If the page throws (e.g., DB connection fails), this UI is shown instead
 * of a blank page or an unhandled error screen.
 *
 * IMPORTANT: error.tsx MUST be a Client Component ("use client").
 * React Error Boundaries only work as class components or Client Components.
 * This is a React limitation, not a Next.js one.
 *
 * The `reset` function lets the user retry — it re-renders the page segment,
 * which re-runs the Server Component and its data fetch.
 *
 * Laravel equivalent: custom error views in resources/views/errors/500.blade.php.
 * The difference: Next.js error boundaries are per-route, so each page can have
 * its own error UI. In Laravel, error pages are global.
 */

export default function BoardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <h2 className="mb-2 text-xl font-bold text-red-600">
        Something went wrong
      </h2>
      <p className="mb-4 text-sm text-gray-500">
        {error.message || "Failed to load the board. Please try again."}
      </p>
      <button
        onClick={reset}
        className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
      >
        Try again
      </button>
    </div>
  );
}
