/**
 * loading.tsx — Skeleton UI for /applications/[id] while data loads.
 */

export default function ApplicationDetailLoading() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-8 animate-pulse">
      {/* Back link */}
      <div className="mb-6 h-4 w-28 rounded bg-gray-200 dark:bg-zinc-700" />

      {/* Title */}
      <div className="mb-6 h-8 w-52 rounded bg-gray-200 dark:bg-zinc-700" />

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        {/* Form skeleton */}
        <div className="space-y-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i}>
              <div className="mb-1 h-4 w-20 rounded bg-gray-200 dark:bg-zinc-700" />
              <div className="h-10 w-full rounded-md bg-gray-200 dark:bg-zinc-700" />
            </div>
          ))}
          <div className="h-10 w-full rounded-md bg-gray-300 dark:bg-zinc-600" />
        </div>

        {/* Timeline skeleton */}
        <div>
          <div className="mb-4 h-6 w-32 rounded bg-gray-200 dark:bg-zinc-700" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3">
                <div className="h-3 w-3 shrink-0 rounded-full bg-gray-300 dark:bg-zinc-600" />
                <div>
                  <div className="h-4 w-36 rounded bg-gray-200 dark:bg-zinc-700" />
                  <div className="mt-1 h-3 w-24 rounded bg-gray-200 dark:bg-zinc-700" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
