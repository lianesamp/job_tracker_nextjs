# LEARNING.md — Job Tracker (Next.js)

Glossary of new concepts learned while building this project.

---

## Step 1: Project Init

**App Router** — The modern routing system in Next.js (introduced in v13). Each folder inside `src/app/` becomes a URL route. Files like `page.tsx`, `layout.tsx`, `loading.tsx` and `error.tsx` have special meaning. _Laravel equivalent: `routes/web.php` + Blade views, but here the route IS the file structure._

**`layout.tsx`** — A component that wraps all pages inside its folder (and sub-folders). It persists across navigations — the layout doesn't re-render when you move between sibling pages. _Laravel equivalent: Blade layouts (`@extends('layouts.app')`)._

**`page.tsx`** — The UI for a specific route. `src/app/board/page.tsx` renders at `/board`. Every route needs a `page.tsx` to be publicly accessible.

**`create-next-app`** — The official scaffolding CLI for Next.js (like `npx create-react-app` or `composer create-project laravel/laravel`). We used it with flags: `--typescript --tailwind --eslint --app --src-dir`.

**Tailwind CSS v4** — Utility-first CSS framework. In v4, you import it with `@import "tailwindcss"` in your CSS file (no more `tailwind.config.js` for content paths — it auto-detects).

**`strict: true` (tsconfig)** — Enables all strict TypeScript checks (no implicit `any`, strict null checks, etc.). This catches more bugs at compile time.

**`@/*` path alias** — A shortcut so `import { something } from "@/lib/utils"` resolves to `src/lib/utils`. Avoids ugly relative paths like `../../../lib/utils`.

**Metadata API** — Next.js lets you export a `metadata` object from layouts/pages to set `<title>`, `<meta>` tags, OpenGraph, etc. The `template` option (`"%s | Job Tracker"`) automatically formats child page titles.

**`redirect()`** — A Next.js function (from `next/navigation`) that performs a server-side redirect. We use it in `src/app/page.tsx` to send `/` → `/board`.

---

## Step 2: Database Setup

**Drizzle ORM** — A lightweight TypeScript ORM that generates type-safe SQL queries. Unlike Prisma (which uses its own schema language), Drizzle schemas are plain TypeScript. _Laravel equivalent: Eloquent ORM, but Drizzle is closer to a query builder with types._

**`pgTable()`** — Drizzle's function to define a PostgreSQL table. Each column is defined with helpers like `text()`, `serial()`, `timestamp()`. _Laravel equivalent: `Schema::create()` in a migration file._

**Neon Serverless Driver (`@neondatabase/serverless`)** — A special PostgreSQL driver that sends queries over HTTP instead of maintaining a persistent TCP connection. This is ideal for serverless environments (Vercel) where functions are short-lived. _No Laravel equivalent — Laravel always uses persistent connections (or connection pooling via PgBouncer)._

**Pooled vs Unpooled connection** — The pooled URL (`-pooler` in the hostname) goes through Neon's built-in connection pooler, good for the app. The unpooled URL is a direct connection, required by `drizzle-kit` for migrations.

**`drizzle-kit`** — A CLI tool for Drizzle that generates SQL migration files from your schema changes and applies them to the database. _Laravel equivalent: `php artisan make:migration` + `php artisan migrate`._

**`drizzle.config.ts`** — Configuration file for `drizzle-kit`. Tells it where the schema is, where to put migration files, and how to connect to the DB.

**Partial Prerender (PPR)** — A Next.js 16 feature where a page is split into a static shell (prerendered at build time) and dynamic holes (streamed at request time). Our `/board` page has a static `<h1>` and a dynamic `<Suspense>` boundary that streams the DB query result. _No Laravel equivalent — this is unique to React Server Components._

**`connection()` (from `next/server`)** — A Next.js function you `await` inside a Server Component to signal that the component needs runtime data (can't be fully static). Used inside a `<Suspense>` boundary so the rest of the page can still be prerendered.

**`<Suspense>`** — A React component that shows a `fallback` UI while its children are loading (e.g., waiting for a DB query in a Server Component). In Next.js 16 with `cacheComponents`, this is the primary way to mark dynamic boundaries. _No direct Laravel equivalent — in Blade you'd just block the whole response._
