import type { Metadata } from "next";
import { count, sql } from "drizzle-orm";
import { db } from "@/db";
import { applications, APPLICATION_STATUSES } from "@/db/schema";
import type { ApplicationStatus } from "@/db/schema";

/**
 * /stats — A statically generated page with Incremental Static Regeneration (ISR).
 *
 * WHAT IS ISR?
 * ISR lets you create pages that are:
 *   1. Pre-rendered at build time (fast, cacheable, like a static HTML file)
 *   2. Re-generated in the background after a set interval (fresh data)
 *
 * When a user visits /stats:
 *   - First visit: Next.js renders the page, caches it, and serves it.
 *   - Subsequent visits (within `revalidate` seconds): serves the cached version.
 *   - After `revalidate` seconds: the NEXT visitor triggers a background re-render.
 *     They still get the stale page instantly, but the cache is updated for everyone after.
 *
 * This is called "stale-while-revalidate" — the same strategy used by CDNs and
 * HTTP caching headers.
 *
 * Laravel equivalent: `Cache::remember('stats', 60, fn() => ...)` — same idea
 * of caching computed data for a period. The difference is Next.js does it at
 * the page level automatically, including the HTML output.
 *
 * WHEN TO USE ISR vs DYNAMIC vs FULL STATIC:
 * - Full static: data never changes (marketing pages, docs)
 * - ISR: data changes occasionally, stale-for-a-minute is OK (stats, dashboards)
 * - Dynamic (what /board uses): data must be real-time (forms, user-specific data)
 */

// ─── ISR configuration ──────────────────────────────────
// Revalidate every 60 seconds. After 60s, the next request triggers a
// background re-render. The visitor gets the cached page instantly.
export const revalidate = 60;

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
  // These queries run on the server at build time (and every 60s after).
  // No loading spinner needed — the HTML is pre-rendered.

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
        Updated every 60 seconds via ISR.
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
