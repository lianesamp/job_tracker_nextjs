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

---

## Step 3: Zod Validators + Types

**`$inferSelect` / `$inferInsert`** — Drizzle utility types that extract TypeScript types directly from a table definition. `$inferSelect` gives you the shape of a row you'd get from a SELECT (all fields present). `$inferInsert` gives you the shape needed for INSERT (fields with defaults become optional). _Laravel equivalent: none — Eloquent models are dynamic, you don't get compile-time types._

**Single source of truth pattern** — The idea that your DB schema is the ONLY place where the data shape is defined. Types and validators are derived from it, never duplicated manually. Flow: `schema.ts` (Drizzle) → `types/index.ts` (inferred TS types) → `validators.ts` (Zod runtime checks). _Laravel equivalent: migrations define the DB, but Models/FormRequests are written separately — no auto-inference._

**Zod** — A TypeScript-first runtime validation library. You define a "schema" (like `z.string().min(1)`) and call `.parse(data)` or `.safeParse(data)` to validate at runtime. It throws/returns detailed errors if validation fails. _Laravel equivalent: Form Request rules like `'company' => 'required|string|max:255'` — same concept, different syntax._

**`z.infer<typeof schema>`** — Extracts a TypeScript type from a Zod schema. So your validation rules AND your types come from the same schema — no duplication. _No Laravel equivalent — in Laravel the type system and validation are completely separate._

**`.partial()`** — Zod method that makes all fields optional (like TypeScript's `Partial<T>`). We use it to create the update schema from the create schema: `updateApplicationSchema = createApplicationSchema.partial()`. _Laravel equivalent: using `'sometimes'` on all rules in an update request._

**`z.coerce.number()`** — Zod 4 coercion: automatically converts string input to a number before validating. Useful for form data where everything arrives as a string. _Laravel equivalent: automatic type casting in Laravel's validation._

---

## Step 4: Server Actions

**Server Actions** — Async functions marked with `"use server"` that run on the server but can be called directly from Client Components (forms, buttons). Next.js generates an HTTP endpoint behind the scenes — you never write `fetch()` or define an API route. _Laravel equivalent: controller methods like `ApplicationController@store`, but without defining routes or writing Axios/fetch calls._

**`"use server"` directive** — Placed at the top of a file to tell the Next.js compiler that every exported function runs ONLY on the server. The client receives a reference (like a URL) to call the function, but never sees its code. This makes it safe to use DB queries, secrets, etc. _Laravel equivalent: there's no equivalent because Laravel controllers are always server-side by design._

**Server Actions vs API Routes** — Next.js still supports API Routes (`app/api/*/route.ts`), but Server Actions are simpler for mutations: no manual fetch, no serialization, automatic form integration, and they work with progressive enhancement (forms submit even without JS). Use API Routes when you need a public API for external consumers. _Laravel equivalent: API Routes ≈ `routes/api.php`, Server Actions ≈ `routes/web.php` with form submissions._

**`revalidatePath()`** — A Next.js function that tells the cache: "the data for this route is stale, re-fetch it on the next request." Call it after a mutation so the UI reflects the change. _Laravel equivalent: `Cache::forget('board-data')` or cache tags — but Next.js handles it at the route level automatically._

**`eq()` (Drizzle)** — A WHERE clause helper from `drizzle-orm`. `eq(applications.id, 5)` generates `WHERE id = 5`. Drizzle uses functions instead of method chaining for conditions. _Laravel equivalent: `->where('id', 5)` in Eloquent._

**`.returning()` (Drizzle)** — Added to INSERT/UPDATE queries to get back the affected rows (like PostgreSQL's `RETURNING *`). Without it, you'd need a separate SELECT after the mutation. _Laravel equivalent: `Model::create()` returns the model automatically — Drizzle needs `.returning()` to do the same._

**`.safeParse()` vs `.parse()` (Zod)** — `.parse()` throws a `ZodError` on invalid input. `.safeParse()` returns `{ success: true, data }` or `{ success: false, error }` — no try/catch needed. We use `.safeParse()` in Server Actions so we can return structured errors to the form. _Laravel equivalent: using `Validator::make()` with `->fails()` instead of relying on automatic exception throwing._

**`ActionResult<T>` pattern** — A discriminated union type: `{ success: true, data: T } | { success: false, fieldErrors?, formError? }`. Every Server Action returns this shape so the UI can handle success/failure uniformly. `fieldErrors` maps field names to error messages (for per-field form validation), while `formError` is a single top-level error. _No direct Laravel equivalent — in Laravel, validation errors are flashed to the session automatically._

---

## Step 5: "Add Application" Form

**Client Component (`"use client"`)** — A React component that runs in the browser. You add the `"use client"` directive at the top of the file when you need interactivity: hooks (`useState`, `useActionState`), event handlers (`onClick`, `onSubmit`), or browser APIs. In Next.js, components are Server Components by default — you opt into client-side only when needed. _Vue equivalent: every Vue SFC with `<script setup>` runs in the browser by default. In React, you have to explicitly request it._

**Server Components vs Client Components** — Server Components render on the server, have zero JS bundle cost, and can directly access the DB. Client Components render in the browser (after initial SSR) and can use hooks/interactivity. The rule of thumb: keep everything as a Server Component unless it needs interactivity, then push the `"use client"` boundary as low as possible. _Laravel equivalent: Blade views are all "server components." If you need interactivity, you'd add a Vue/Alpine component — same idea of keeping client code minimal._

**`useActionState` (React 19)** — A hook that connects a form to a Server Action. Signature: `useActionState(action, initialState)` → `[state, formAction, isPending]`. The `formAction` goes into `<form action={formAction}>`, and React handles calling the Server Action, tracking the pending state, and updating `state` with the result. _No Vue/Laravel equivalent — in Laravel you'd submit the form, get redirected back with `$errors`, and use `@error('field')` in Blade. Here React keeps everything in component state without a page reload._

**`isPending`** — The third value from `useActionState`. It's `true` while the Server Action is running on the server, `false` otherwise. Use it to disable the submit button and show "Saving..." text so users know something is happening. _Laravel equivalent: in Livewire you'd use `wire:loading`; in vanilla Laravel you'd need custom JS._

**`FormData`** — A browser API that represents form data as key-value pairs. When you use `<form action={formAction}>`, the browser automatically collects all named inputs into a `FormData` object and passes it to the Server Action. `Object.fromEntries(formData)` converts it to a plain `{ key: value }` object. _Laravel equivalent: `$request->all()` — the framework gives you the submitted data as an associative array._

**`redirect()` in Server Actions** — Next.js's `redirect()` (from `next/navigation`) works inside Server Actions to navigate after a mutation. It throws internally (a Next.js convention) to interrupt execution, so it must be called OUTSIDE any try/catch. _Laravel equivalent: `return redirect('/board')` in a controller method._

**Progressive enhancement** — When you use `<form action={formAction}>` instead of `onSubmit`, the form works even if JavaScript fails to load. The browser submits the form as a regular POST request, and the Server Action still runs. This is a web platform feature that Next.js preserves. _Laravel equivalent: standard `<form method="POST">` — it always works without JS. This is the same idea._
