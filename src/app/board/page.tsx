import { Suspense } from "react";
import { connection } from "next/server";
import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/db";
import { applications } from "@/db/schema";
import { isDemoMode } from "@/lib/config";
import { KanbanBoard } from "@/components/kanban/KanbanBoard";

/**
 * /board — Server Component page.
 *
 * This page demonstrates the Server/Client Component split:
 *   - The PAGE is a Server Component → it fetches data directly from the DB.
 *   - The BOARD is a Client Component → it handles drag-and-drop interactivity.
 *   - Data flows from server → client via props (initialApplications).
 *
 * This is the pattern you'll see in every Next.js app:
 * "Fetch on the server, interact on the client."
 *
 * Laravel equivalent: a Blade view with an Inertia/Vue component.
 * The controller fetches data and passes it to the view as props.
 *
 * WHY <Link> instead of <a>?
 * Next.js's <Link> component does client-side navigation (SPA-style)
 * instead of a full page reload. It also prefetches the linked page
 * when it appears in the viewport. Same idea as <router-link> in Vue Router.
 */

export const metadata: Metadata = {
  title: "Board",
};

async function BoardContent() {
  await connection();
  const allApplications = await db.select().from(applications);
  const demoMode = isDemoMode();

  return (
    <>
      {demoMode && (
        <div className="mb-4 rounded-md border border-yellow-300 bg-yellow-50 px-4 py-3 text-sm text-yellow-800 dark:border-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-200">
          This is a read-only demo. Create, edit, and drag-and-drop are disabled.
        </div>
      )}

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Kanban Board</h1>
          <p className="text-sm text-gray-500">
            {allApplications.length} application{allApplications.length !== 1 && "s"}
          </p>
        </div>
        {!demoMode && (
          <Link
            href="/applications/new"
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
          >
            + Add Application
          </Link>
        )}
      </div>
      <KanbanBoard initialApplications={allApplications} demoMode={demoMode} />
    </>
  );
}

export default function BoardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center gap-2 text-zinc-500">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-600" />
          Loading board...
        </div>
      }
    >
      <BoardContent />
    </Suspense>
  );
}
