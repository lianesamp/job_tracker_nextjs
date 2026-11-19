import { Suspense } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { desc } from "drizzle-orm";
import { db } from "@/db";
import { applications, statusHistory } from "@/db/schema";
import { isDemoMode } from "@/lib/config";
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

  const title = `${application.company} — ${application.role}`;
  const description = `Job application for ${application.role} at ${application.company}${application.city ? ` in ${application.city}` : ""}.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
    },
  };
}

// ─── Page content (async Server Component) ───────────────

async function ApplicationDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const numericId = Number(id);

  if (isNaN(numericId) || numericId <= 0) {
    notFound();
  }

  const [application] = await db
    .select()
    .from(applications)
    .where(eq(applications.id, numericId));

  if (!application) {
    notFound();
  }

  const history = await db
    .select()
    .from(statusHistory)
    .where(eq(statusHistory.applicationId, numericId))
    .orderBy(desc(statusHistory.changedAt));

  const demoMode = isDemoMode();

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
      {/* Left column: edit form (or read-only details in demo mode) */}
      <div>
        {demoMode ? (
          <div className="space-y-4 rounded-lg border border-zinc-200 p-6 dark:border-zinc-700">
            <div>
              <span className="text-sm text-gray-500">Company</span>
              <p className="text-lg font-medium">{application.company}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500">Role</span>
              <p className="text-lg font-medium">{application.role}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500">Status</span>
              <p className="capitalize">{application.status.replace("_", " ")}</p>
            </div>
            {application.jobUrl && (
              <div>
                <span className="text-sm text-gray-500">URL</span>
                <p>
                  <a
                    href={application.jobUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {application.jobUrl}
                  </a>
                </p>
              </div>
            )}
            {application.city && (
              <div>
                <span className="text-sm text-gray-500">City</span>
                <p>{application.city}</p>
              </div>
            )}
            {application.workMode && (
              <div>
                <span className="text-sm text-gray-500">Work Mode</span>
                <p className="capitalize">{application.workMode}</p>
              </div>
            )}
            {application.salary && (
              <div>
                <span className="text-sm text-gray-500">Salary Range</span>
                <p>{application.salary}</p>
              </div>
            )}
            {application.notes && (
              <div>
                <span className="text-sm text-gray-500">Notes</span>
                <p className="whitespace-pre-wrap">{application.notes}</p>
              </div>
            )}
          </div>
        ) : (
          <ApplicationForm application={application} />
        )}
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

export default function ApplicationDetailPage({ params }: PageProps) {
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
        <ApplicationDetail params={params} />
      </Suspense>
    </main>
  );
}
