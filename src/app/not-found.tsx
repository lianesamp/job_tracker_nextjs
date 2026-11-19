import Link from "next/link";

/**
 * not-found.tsx — Global 404 page.
 *
 * Rendered when:
 *   - A route doesn't exist (e.g., /something-random)
 *   - A Server Component calls notFound() (e.g., invalid application ID)
 *
 * This is the app-level not-found. You could also create route-specific
 * not-found.tsx files in nested folders for more targeted 404 pages.
 *
 * Laravel equivalent: resources/views/errors/404.blade.php
 */

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <h2 className="mb-2 text-4xl font-bold">404</h2>
      <p className="mb-6 text-gray-500">Page not found.</p>
      <Link
        href="/board"
        className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
      >
        Back to Board
      </Link>
    </div>
  );
}
