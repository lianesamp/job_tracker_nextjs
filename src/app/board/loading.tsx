import { APPLICATION_STATUSES } from "@/db/schema";

/**
 * loading.tsx — Automatic loading UI for the /board route.
 *
 * HOW IT WORKS:
 * Next.js wraps the page in a <Suspense> boundary using this component as
 * the fallback. When the page's async Server Component is fetching data,
 * this skeleton is shown instead. Once the data arrives, Next.js streams
 * the real page in and replaces the skeleton.
 *
 * You don't need to write <Suspense> yourself — loading.tsx IS the Suspense
 * fallback for its route segment. (We also used explicit <Suspense> inside
 * the page, which works together with this.)
 *
 * Laravel equivalent: none built-in. You'd need to add JavaScript loading
 * spinners manually. Next.js makes it a convention with a special file name.
 */

export default function BoardLoading() {
  return (
    <div className="animate-pulse">
      {/* Header skeleton */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="h-8 w-40 rounded bg-gray-200 dark:bg-zinc-700" />
          <div className="mt-2 h-4 w-24 rounded bg-gray-200 dark:bg-zinc-700" />
        </div>
        <div className="h-10 w-36 rounded-md bg-gray-200 dark:bg-zinc-700" />
      </div>

      {/* Columns skeleton */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {APPLICATION_STATUSES.map((status) => (
          <div
            key={status}
            className="w-64 shrink-0 rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-zinc-700 dark:bg-zinc-900"
          >
            {/* Column header */}
            <div className="mb-3 flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full bg-gray-300 dark:bg-zinc-600" />
              <div className="h-4 w-20 rounded bg-gray-200 dark:bg-zinc-700" />
            </div>

            {/* Card skeletons */}
            <div className="flex flex-col gap-2">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="rounded-lg border border-gray-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-800"
                >
                  <div className="h-4 w-28 rounded bg-gray-200 dark:bg-zinc-700" />
                  <div className="mt-2 h-3 w-36 rounded bg-gray-200 dark:bg-zinc-700" />
                  <div className="mt-2 flex gap-1.5">
                    <div className="h-5 w-14 rounded-full bg-gray-200 dark:bg-zinc-700" />
                    <div className="h-5 w-14 rounded-full bg-gray-200 dark:bg-zinc-700" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
