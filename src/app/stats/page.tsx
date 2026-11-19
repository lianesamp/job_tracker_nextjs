"use cache";

import type { Metadata } from "next";
import { cacheLife } from "next/cache";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { applications, APPLICATION_STATUSES } from "@/db/schema";
import type { ApplicationStatus } from "@/db/schema";

/**
 * /stats — A cached page that revalidates every 60 seconds.
 *
 * WHAT IS "use cache"?
 * In Next.js 16 with `cacheComponents: true`, the old `export const revalidate`
 * approach is replaced by the `"use cache"` directive. Placing it at the top of
 * a file tells Next.js to cache the entire page (or component) output.
 *
 * You pair it with `cacheLife()` to control how long the cache lasts.
 * `cacheLife("minutes")` is a built-in profile that caches for ~60 seconds
 * with a stale-while-revalidate window.
 *
 * The behavior is the same ISR concept:
 *   1. First visit: renders the page, caches the output.
 *   2. Within the cache window: serves the cached HTML instantly.
 *   3. After expiry: next visitor triggers a background re-render.
 *
 * Laravel equivalent: same as `Cache::remember('stats', 60, fn() => ...)`.
 *
 * WHY THE CHANGE?
 * `cacheComponents` unifies caching at the component level (not just routes).
 * You can cache individual components, not just whole pages. The `"use cache"`
 * directive is more flexible and composable than route-level config exports.
 *
 * WHEN TO USE "use cache" vs DYNAMIC:
 * - "use cache": data changes occasionally, stale-for-a-minute is OK (stats)
 * - No directive: data must be real-time (forms, user-specific data)
 */

export const metadata: Metadata = {
  title: "Stats",
  description: "Overview of your job application statistics.",
};

// ─── Human-friendly labels ───────────────────────────────

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  saved: "Saved",
  applied: "Applied",
  interview: "Interview",
  technical_test: "Technical Test",
  offer: "Offer",
  rejected: "Rejected",
};

const STATUS_COLORS: Record<ApplicationStatus, string> = {
  saved: "bg-gray-100 text-gray-700 dark:bg-zinc-700 dark:text-zinc-300",
  applied: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  interview: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
  technical_test: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  offer: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  rejected: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
};

const WORK_MODE_LABELS: Record<string, string> = {
  "on-site": "On-site",
  hybrid: "Hybrid",
  remote: "Remote",
};

// ─── Page component ──────────────────────────────────────

export default async function StatsPage() {
  // Cache this page for ~60 seconds (the "minutes" profile).
  // After expiry, the next request triggers a background re-render.
  cacheLife("minutes");

  // 1. Count per status
  //    sql<number>`...` is a Drizzle template literal for raw SQL with type safety.
  //    We cast to ::int because PostgreSQL's count() returns bigint (a string in JS).
  const statusCounts = await db
    .select({
      status: applications.status,
      count: sql<number>`cast(count(*) as int)`,
    })
    .from(applications)
    .groupBy(applications.status);

  // Build a map for easy lookup, filling in 0 for statuses with no entries
  const countByStatus: Record<string, number> = {};
  for (const s of APPLICATION_STATUSES) {
    countByStatus[s] = 0;
  }
  for (const row of statusCounts) {
    countByStatus[row.status] = row.count;
  }

  const total = Object.values(countByStatus).reduce((a, b) => a + b, 0);

  // 2. Response rate = (interview + technical_test + offer) / applied * 100
  //    "Response" means the company responded after you applied.
  const applied = countByStatus.applied ?? 0;
  const gotResponse =
    (countByStatus.interview ?? 0) +
    (countByStatus.technical_test ?? 0) +
    (countByStatus.offer ?? 0);
  const responseRate =
    applied + gotResponse > 0
      ? Math.round((gotResponse / (applied + gotResponse)) * 100)
      : 0;

  // 3. Work mode distribution
  const workModeCounts = await db
    .select({
      workMode: applications.workMode,
      count: sql<number>`cast(count(*) as int)`,
    })
    .from(applications)
    .groupBy(applications.workMode);

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-2 text-2xl font-bold">Application Stats</h1>
      <p className="mb-8 text-sm text-gray-500">
        Cached and refreshed every 60 seconds.
      </p>

      {total === 0 ? (
        <p className="text-gray-400">
          No applications yet. Add some from the Board!
        </p>
      ) : (
        <div className="space-y-8">
          {/* ─── Overview cards ─── */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <StatCard label="Total Applications" value={total} />
            <StatCard label="Response Rate" value={`${responseRate}%`} />
            <StatCard label="Offers" value={countByStatus.offer ?? 0} />
          </div>

          {/* ─── Status breakdown ─── */}
          <section>
            <h2 className="mb-3 text-lg font-semibold">By Status</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {APPLICATION_STATUSES.map((status) => (
                <div
                  key={status}
                  className={`rounded-lg px-4 py-3 ${STATUS_COLORS[status]}`}
                >
                  <p className="text-2xl font-bold">{countByStatus[status]}</p>
                  <p className="text-sm">{STATUS_LABELS[status]}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ─── Work mode breakdown ─── */}
          {workModeCounts.length > 0 && (
            <section>
              <h2 className="mb-3 text-lg font-semibold">By Work Mode</h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {workModeCounts.map((row) => (
                  <div
                    key={row.workMode}
                    className="rounded-lg border border-gray-200 px-4 py-3 dark:border-zinc-700"
                  >
                    <p className="text-2xl font-bold">{row.count}</p>
                    <p className="text-sm text-gray-600 dark:text-zinc-400">
                      {WORK_MODE_LABELS[row.workMode] ?? row.workMode}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </main>
  );
}

// ─── Helper component ────────────────────────────────────

function StatCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-lg border border-gray-200 px-4 py-3 dark:border-zinc-700">
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm text-gray-500">{label}</p>
    </div>
  );
}
