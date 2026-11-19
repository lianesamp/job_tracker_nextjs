import { Suspense } from "react";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import type { Metadata } from "next";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { desc } from "drizzle-orm";
import { db } from "@/db";
import { applications, statusHistory } from "@/db/schema";
import { ApplicationForm } from "@/components/forms/ApplicationForm";
import { StatusTimeline } from "@/components/ui/StatusTimeline";

/**
 * /applications/[id] — Dynamic route for viewing & editing an application.
 *
 * WHAT IS A DYNAMIC ROUTE?
 * The [id] in the folder name means this page matches any URL like
 * /applications/1, /applications/42, etc. Next.js passes the `id`
 * as a param (via `params` prop) so we can fetch the right row.
 *
 * Laravel equivalent: Route::get('/applications/{id}', ...) — same concept,
 * but in Next.js the folder name IS the route definition.
 *
 * WHAT IS generateMetadata?
 * A function (not a static object) that runs on the server to produce
 * dynamic <title>, <meta> tags based on the data. For this page, we set
 * the title to "Company - Role | Job Tracker".
 *
 * Laravel equivalent: setting <title> dynamically in a Blade layout
 * using @section('title', $application->company).
 */

// ─── Types for the page props ────────────────────────────
// In Next.js 16, params is a Promise that must be awaited.

type PageProps = {
  params: Promise<{ id: string }>;
};

// ─── generateMetadata (dynamic SEO) ─────────────────────

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;

  const [application] = await db
    .select()
    .from(applications)
    .where(eq(applications.id, Number(id)));

  if (!application) {
    return { title: "Not Found" };
  }

  return {
    title: `${application.company} — ${application.role}`,
  };
}

// ─── Page content (async Server Component) ───────────────

async function ApplicationDetail({ id }: { id: number }) {
  await connection();

  const [application] = await db
    .select()
    .from(applications)
    .where(eq(applications.id, id));

  if (!application) {
    notFound();
  }

  const history = await db
    .select()
    .from(statusHistory)
    .where(eq(statusHistory.applicationId, id))
    .orderBy(desc(statusHistory.changedAt));

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
      {/* Left column: edit form */}
      <div>
        <ApplicationForm application={application} />
      </div>

      {/* Right column: status history timeline */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">Status History</h2>
        <StatusTimeline history={history} />
      </div>
    </div>
  );
}

// ─── Page component ──────────────────────────────────────

export default async function ApplicationDetailPage({ params }: PageProps) {
  const { id } = await params;
  const numericId = Number(id);

  if (isNaN(numericId) || numericId <= 0) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6">
        <Link
          href="/board"
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Back to Board
        </Link>
      </div>

      <h1 className="mb-6 text-2xl font-bold">Application Details</h1>

      <Suspense
        fallback={
          <div className="flex items-center gap-2 text-zinc-500">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-600" />
            Loading application...
          </div>
        }
      >
        <ApplicationDetail id={numericId} />
      </Suspense>
    </main>
  );
}
