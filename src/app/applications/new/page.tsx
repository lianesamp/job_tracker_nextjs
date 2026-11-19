import type { Metadata } from "next";
import { ApplicationForm } from "@/components/forms/ApplicationForm";

/**
 * /applications/new — Server Component page.
 *
 * This page is a Server Component (the default in Next.js App Router).
 * It doesn't need any interactivity itself — it just renders the
 * Client Component form below.
 *
 * WHY keep the page as a Server Component?
 * - It can export `metadata` (Client Components can't).
 * - It keeps the "use client" boundary as small as possible.
 * - Only the form (which needs useState, event handlers) is a Client Component.
 *
 * Laravel equivalent: a Blade view like `applications/create.blade.php`
 * that renders a form partial.
 */

export const metadata: Metadata = {
  title: "Add Application",
};

export default function NewApplicationPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Add New Application</h1>
      <ApplicationForm />
    </main>
  );
}
