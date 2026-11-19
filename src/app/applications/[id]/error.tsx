"use client";

/**
 * error.tsx — Error boundary for /applications/[id].
 * Must be a Client Component (React Error Boundaries require it).
 */

export default function ApplicationDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <div className="flex flex-col items-center justify-center py-20">
        <h2 className="mb-2 text-xl font-bold text-red-600">
          Something went wrong
        </h2>
        <p className="mb-4 text-sm text-gray-500">
          {error.message || "Failed to load the application. Please try again."}
        </p>
        <button
          onClick={reset}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
