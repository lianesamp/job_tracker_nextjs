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

---

## Step 6: Kanban Board

**`@dnd-kit/core`** — A modular drag-and-drop library for React. Unlike the older `react-beautiful-dnd` (now unmaintained), dnd-kit is actively maintained, accessible (keyboard + screen reader support built in), and works with React 19. It gives you primitives (`DndContext`, `useDraggable`, `useDroppable`) that you compose into your own UI. _Vue equivalent: `vuedraggable` (wraps SortableJS). The concept is the same — make elements draggable and define drop zones._

**`DndContext`** — The root wrapper from dnd-kit. It tracks all draggables and droppables inside it and fires events (`onDragStart`, `onDragEnd`) when things are moved. Every draggable/droppable must be a descendant of a `DndContext`. _Think of it like Vue's `<draggable>` wrapper, but as a React context provider._

**`useDraggable`** — A hook that makes an element draggable. Returns `setNodeRef` (attach to the DOM element), `attributes` (ARIA for a11y), `listeners` (pointer/keyboard handlers that start the drag), `transform` (x/y offset while dragging), and `isDragging` (boolean). You can attach custom `data` that's available in the `onDragEnd` handler.

**`useDroppable`** — A hook that makes an element a drop target. Returns `setNodeRef` (attach to the DOM element) and `isOver` (true when a draggable hovers over it). We use `isOver` to highlight the column in blue when a card is dragged over it.

**`DragOverlay`** — A component that renders a floating copy of the dragged item above everything. Without it, the original element moves with the cursor, which can cause layout shifts. With it, the original stays in place (semi-transparent) and a clean copy follows the cursor. _Vue equivalent: vuedraggable's ghost/clone element._

**Sensors (PointerSensor, KeyboardSensor)** — Sensors detect HOW a drag starts. `PointerSensor` handles mouse/touch, `KeyboardSensor` handles arrow keys for accessibility. The `activationConstraint: { distance: 5 }` setting means you must move 5 pixels before a drag starts, preventing accidental drags on click.

**Optimistic UI** — Updating the UI immediately before the server confirms the change. When you drop a card on a new column, we move it in local state right away (feels instant), then call the Server Action in the background. If the action fails, we revert to the previous state. _Laravel equivalent: in Livewire you'd use `wire:model.live` for instant updates. In Vue SPAs, you'd update Pinia state immediately and sync with the API._

**`useTransition`** — A React 19 hook that marks a state update as non-urgent. We wrap the Server Action call in `startTransition()` so it doesn't block the UI while the server responds. The optimistic card move happens instantly; the server sync runs in the background. _No Laravel equivalent — this is a React-specific concurrency feature._

**`<Link>` (from `next/link`)** — Next.js's replacement for `<a>` tags. It does client-side navigation (SPA-style) without a full page reload and prefetches the linked page when it appears in the viewport. _Vue equivalent: `<router-link>` from Vue Router. Laravel equivalent: regular `<a>` tags (Laravel doesn't do client-side navigation unless you add Inertia/Livewire)._

**Server/Client Component split pattern** — The page (Server Component) fetches data from the DB and passes it as props to the interactive board (Client Component). This keeps the data-fetching on the server (no API endpoint needed, no loading spinner for initial data) while keeping interactivity on the client. _Laravel equivalent: a controller fetches data and passes it to an Inertia/Vue component via props._

---

## Step 7: Detail Page + Status History

**Dynamic routes (`[id]`)** — A folder named `[id]` in the app directory matches any URL segment. `/applications/[id]/page.tsx` handles `/applications/1`, `/applications/42`, etc. Next.js passes the matched value via the `params` prop. In Next.js 16, `params` is a Promise that must be awaited. _Laravel equivalent: `Route::get('/applications/{id}', ...)` — same concept, but in Next.js the folder name IS the route definition._

**`generateMetadata`** — An async function exported from a page that runs on the server to produce dynamic `<title>`, `<meta>` tags based on the data. For the detail page we set the title to "Company — Role | Job Tracker". Only Server Components can export it (Client Components can't). _Laravel equivalent: setting `<title>` dynamically in a Blade layout using `@section('title', $application->company)`._

**`notFound()`** — A Next.js function (from `next/navigation`) that renders the nearest `not-found.tsx` page and returns a 404 status. We call it when the application ID doesn't exist in the database. _Laravel equivalent: `abort(404)` or `throw new ModelNotFoundException`._

**Reusable form pattern (create/edit)** — One component that handles both creating and editing by accepting an optional `application` prop. When provided, the form pre-fills with existing data, uses `updateApplicationAction`, and shows a Status field. When absent, it uses `createApplicationAction`. _Laravel equivalent: a Blade partial `_form.blade.php` that checks `isset($application)` to decide create vs edit mode._

**Uncontrolled inputs (`defaultValue`)** — React inputs can be "controlled" (value + onChange, React tracks state) or "uncontrolled" (defaultValue, the DOM tracks state). We use `defaultValue` because Server Actions read from `FormData` (the DOM), so there's no need for React to track every keystroke. _Vue equivalent: `v-model` is always "controlled." In React, uncontrolled is simpler when you only need the final value on submit._

**`desc()` (Drizzle)** — An ORDER BY helper from `drizzle-orm`. `desc(statusHistory.changedAt)` generates `ORDER BY changed_at DESC` so the most recent status change appears first. _Laravel equivalent: `->orderByDesc('changed_at')` in Eloquent._

---

## Step 8: Public /stats Page (ISR)

**Incremental Static Regeneration (ISR)** — A rendering strategy where a page is pre-rendered at build time (like a static HTML file) but re-generated in the background after a set interval. The visitor always gets an instant response (cached HTML), but the data stays reasonably fresh. You enable it by exporting `revalidate = 60` from a page (re-generate every 60 seconds). _Laravel equivalent: `Cache::remember('stats', 60, fn() => ...)` — same idea of caching computed data for a period. The difference is Next.js does it at the entire page level, including the HTML._

**Stale-while-revalidate** — The caching strategy behind ISR. After the `revalidate` period expires, the next visitor still gets the stale (cached) page instantly, but Next.js triggers a background re-render. Once done, all subsequent visitors get the fresh page. This is the same strategy used by CDN cache headers. _No direct Laravel equivalent — you'd need to implement this manually with queue jobs or cache warming._

**When to use ISR vs Dynamic vs Full Static** — Full static: data never changes (marketing pages, docs). ISR: data changes occasionally, stale-for-a-minute is OK (stats, dashboards, blog posts). Dynamic: data must be real-time or user-specific (forms, boards, authenticated pages). _Laravel equivalent: static = pre-built HTML files; ISR ≈ cached Blade views with TTL; dynamic = no caching._

**`sql<number>\`...\`` (Drizzle)** — A tagged template literal for writing raw SQL within Drizzle queries while keeping type safety. The `<number>` generic tells TypeScript what type the result will be. We use `sql<number>\`cast(count(*) as int)\`` because PostgreSQL's `count()` returns `bigint` (which Drizzle maps to a string in JS) — casting to `int` gives us an actual number. _Laravel equivalent: `DB::raw('count(*)')` — same concept of embedding raw SQL in a query builder call._

**`.groupBy()` (Drizzle)** — Groups rows by a column for aggregate queries. `db.select(...).from(applications).groupBy(applications.status)` generates `SELECT ... GROUP BY status`. _Laravel equivalent: `->groupBy('status')` in Eloquent/Query Builder._

**`export const revalidate`** — A Next.js route segment config that sets the ISR interval in seconds. `export const revalidate = 60` means "cache this page for 60 seconds, then re-generate on the next request." Set to `0` for always-dynamic, `false` for never-revalidate (full static). _No Laravel equivalent — this is a Next.js-specific page-level caching directive._

---

## Step 9: Loading & Error States

**`loading.tsx`** — A special Next.js file that automatically becomes the `<Suspense>` fallback for its route segment. When the page's async Server Component is fetching data, the loading UI (typically a skeleton) is shown. Once data arrives, Next.js streams in the real content. You don't need to write `<Suspense>` yourself — the file IS the Suspense boundary. _Laravel equivalent: none built-in. You'd add loading spinners with JavaScript manually._

**Skeleton UI** — A loading pattern that shows the page layout with gray placeholder shapes (instead of a spinner). This is better UX because: (1) users see the page structure immediately, (2) it reduces perceived loading time, (3) there's no layout shift when real content arrives. The `animate-pulse` Tailwind class adds a subtle breathing animation to the placeholders.

**`error.tsx`** — A special Next.js file that wraps the route in a React Error Boundary. If the page throws an error (e.g., DB connection fails), this UI is shown instead of a crash. It receives `error` (the Error object) and `reset` (a function to retry rendering). **Must be a Client Component** (`"use client"`) because React Error Boundaries only work on the client. _Laravel equivalent: `resources/views/errors/500.blade.php`, but Next.js error boundaries are per-route — each page can have its own error UI._

**React Error Boundary** — A React pattern that catches JavaScript errors in a component tree and displays a fallback UI instead of crashing the whole app. In class components, you'd implement `componentDidCatch()`. In Next.js, `error.tsx` does this automatically. The `reset()` function re-renders the segment, which re-runs the Server Component and its data fetch.

**`not-found.tsx`** — A special file rendered when a route doesn't exist or when `notFound()` is called in a Server Component. The app-level `not-found.tsx` handles all 404s globally. You can also create route-specific ones in nested folders. _Laravel equivalent: `resources/views/errors/404.blade.php`._

**Next.js special files hierarchy** — The convention-based files in each route folder and how they nest: `layout.tsx` wraps `loading.tsx` wraps `error.tsx` wraps `page.tsx`. This means the layout stays visible while loading/error states are shown — the user never loses the navigation header.

---

## Build Fix: Partial Prerendering + `"use cache"`

**Partial Prerendering (PPR)** — A Next.js 16 feature (enabled with `partialPrefetching: true` in config) that splits a page into a static shell (prerendered at build) and dynamic holes (streamed at request time). The key rule: **all dynamic data access (`params`, `cookies`, `fetch`, DB calls) must happen inside a `<Suspense>` boundary**, so the outer shell can be sent instantly. If you `await params` in the page component itself (outside Suspense), Next.js can't prerender any of it. _Laravel equivalent: imagine Blade could send the layout HTML immediately while the `@yield('content')` section loads in the background — that's PPR._

**`"use cache"` directive** — The Next.js 16 replacement for `export const revalidate` when `cacheComponents: true` is enabled. Place it at the top of a file (or a function) to tell Next.js to cache that component/page output. Pair it with `cacheLife()` to control the TTL. Unlike `revalidate` (which only works at the route level), `"use cache"` can be applied to individual components — more flexible and composable. _Laravel equivalent: going from `Cache::remember()` on the whole response to caching individual Blade partials._

**`cacheLife()`** — A function from `next/cache` used with `"use cache"` to set the cache duration. Built-in profiles include `"minutes"` (~60s revalidate, 1h expiry), `"hours"`, `"days"`, etc. You can also pass a custom object with `stale`, `revalidate`, and `expire` values. _Laravel equivalent: the TTL argument in `Cache::remember('key', 60, fn() => ...)`._
