# Implementation Steps — Job Tracker (Next.js)

This document tracks our step-by-step progress building the Job Tracker app.
Each step includes what we'll do, what we'll learn, and its current status.

---

## Step 1: Project Init
**Status:** Done
**What we'll do:**
- Scaffold the project with `create-next-app` (App Router, TypeScript, Tailwind)
- Install dependencies: `drizzle-orm`, `@neondatabase/serverless`, `zod`, `drizzle-kit`
- Configure strict TypeScript (`strict: true` in tsconfig)
- Verify the dev server runs

**What you'll learn:**
- App Router file conventions (`layout.tsx`, `page.tsx`, `loading.tsx`, `error.tsx`)
- Difference between App Router and Pages Router (and vs Laravel routes/controllers)

---

## Step 2: Database Setup
**Status:** Done
**What we'll do:**
- Create the Drizzle schema (`applications` and `status_history` tables)
- Configure `drizzle.config.ts`
- Create `.env.local` and `.env.example` with `DATABASE_URL`
- Run the first migration against Neon

**What you'll learn:**
- Drizzle ORM basics (vs Eloquent in Laravel, vs Prisma)
- Neon serverless driver (HTTP-based, no persistent connection)
- Database migrations with `drizzle-kit`

**Action required:** Before this step, create a free database at [neon.tech](https://neon.tech) and have the connection string ready.

---

## Step 3: Zod Validators + Types
**Status:** Done
**What we'll do:**
- Create Zod schemas for validating application input
- Infer TypeScript types from Drizzle schema
- Connect Zod validation with the form data flow

**What you'll learn:**
- Zod validation (vs Laravel Form Requests)
- Inferring types from Drizzle (`typeof applications.$inferSelect`)
- Single source of truth for types (schema → types → validation)

---

## Step 4: Server Actions (Create & Update)
**Status:** Done
**What we'll do:**
- Create `actions.ts` with `"use server"` directive
- Implement `createApplication` and `updateApplication` actions
- Implement `updateApplicationStatus` for Kanban card moves
- Use `revalidatePath` to refresh data after mutations

**What you'll learn:**
- Server Actions vs API Routes (and vs Laravel controller methods)
- `"use server"` directive — what it does under the hood
- `revalidatePath` / `revalidateTag` for cache busting

---

## Step 5: "Add Application" Form
**Status:** Done
**What we'll do:**
- Build the `/applications/new` page
- Create a Client Component form with controlled inputs
- Connect the form to the `createApplication` Server Action
- Handle validation errors and success redirect

**What you'll learn:**
- Client Components vs Server Components (and vs Vue SFCs)
- `"use client"` directive — when and why
- `useActionState` hook for form state management

---

## Step 6: Kanban Board
**Status:** Done
**What we'll do:**
- Build the `/board` page as a Server Component (fetches data on the server)
- Create Client Component columns with drag-and-drop
- Call `updateApplicationStatus` Server Action when a card is moved
- Columns: Saved, Applied, Interview, Technical Test, Offer, Rejected

**What you'll learn:**
- React Server Components for data fetching (no `useEffect`, no `fetch` on the client!)
- Mixing Server and Client Components in the same page
- Drag-and-drop in React (library TBD)

---

## Step 7: Detail Page + Status History
**Status:** Done
**What we'll do:**
- Build `/applications/[id]` dynamic route
- Show application details with an edit form
- Display the status change history timeline
- Use `generateMetadata` for dynamic page titles

**What you'll learn:**
- Dynamic routes with `[id]` (vs Laravel `{id}` route params)
- `generateMetadata` for dynamic SEO
- Server Component data fetching with params

---

## Step 8: Public /stats Page (ISR)
**Status:** Done
**What we'll do:**
- Build `/stats` as a statically generated page with revalidation
- Show: totals per status, response rate, most requested technologies
- Use `revalidate` option for Incremental Static Regeneration

**What you'll learn:**
- ISR (Incremental Static Regeneration) — pages that are static but refresh periodically
- Compared to Laravel page cache / `Cache::remember()`
- When to use ISR vs dynamic rendering vs full static

---

## Step 9: Loading & Error States
**Status:** Pending
**What we'll do:**
- Add `loading.tsx` to `/board`, `/applications/[id]`, and root
- Add `error.tsx` to the same routes
- Style loading skeletons and error messages

**What you'll learn:**
- `loading.tsx` = automatic Suspense boundary (React Suspense under the hood)
- `error.tsx` = automatic Error Boundary (must be a Client Component)
- Compared to Laravel: no built-in equivalent — you'd handle this manually

---

## Step 10: SEO Metadata
**Status:** Pending
**What we'll do:**
- Add static `metadata` export in `layout.tsx` (title, description, OpenGraph)
- Add `generateMetadata` in dynamic pages (`/applications/[id]`)
- Verify with browser dev tools / social card preview

**What you'll learn:**
- Next.js Metadata API (`metadata` object vs `generateMetadata` function)
- OpenGraph tags for social sharing
- Compared to Laravel: similar to setting `<meta>` in Blade `@section('meta')`

---

## Step 11: Deploy to Vercel
**Status:** Pending
**What we'll do:**
- Push code to GitHub
- Connect the repo to Vercel
- Add `DATABASE_URL` environment variable in Vercel dashboard
- Verify the production build works

**Action required:** You'll need a Vercel account (free) linked to your GitHub.

**What you'll learn:**
- Vercel deployment flow (zero-config for Next.js)
- Environment variables in production vs development
- Compared to Laravel: similar to deploying on Forge/Vapor, but simpler

---

## Step 12: README + LEARNING.md (Final Docs)
**Status:** Pending
**What we'll do:**
- Write the full README in English: description, screenshot, deploy link, stack, how to run, tests, "What I learned"
- Review and finalize LEARNING.md glossary
- Final commit

**What you'll learn:**
- Writing a good portfolio README that recruiters actually read

---

## Database Schema Reference

```
applications
───────────────────────────────────────────────
id              serial       PK
company         text         NOT NULL
role            text         NOT NULL
job_url         text         nullable
city            text         nullable
work_mode       text         NOT NULL  ("on-site" | "hybrid" | "remote")
salary          text         nullable
status          text         NOT NULL  DEFAULT "saved"
notes           text         nullable
created_at      timestamp    DEFAULT now()
updated_at      timestamp    DEFAULT now()

status_history
───────────────────────────────────────────────
id              serial       PK
application_id  integer      FK → applications.id
from_status     text         nullable (null = creation)
to_status       text         NOT NULL
changed_at      timestamp    DEFAULT now()
```

**Valid statuses:** `saved`, `applied`, `interview`, `technical_test`, `offer`, `rejected`

---

## Folder Structure Reference

```
src/
├── app/                        # App Router (all routes)
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Home → redirects to /board
│   ├── loading.tsx             # Global loading
│   ├── error.tsx               # Global error boundary
│   ├── board/
│   │   ├── page.tsx            # Kanban board
│   │   ├── loading.tsx
│   │   └── error.tsx
│   ├── applications/
│   │   ├── new/page.tsx        # Add application form
│   │   └── [id]/
│   │       ├── page.tsx        # Detail + edit
│   │       ├── loading.tsx
│   │       └── error.tsx
│   └── stats/page.tsx          # Public stats (ISR)
├── components/
│   ├── kanban/                 # Board, Column, Card
│   ├── forms/                  # ApplicationForm
│   └── ui/                     # Badge, StatusSelect…
├── db/
│   ├── index.ts                # Drizzle client
│   ├── schema.ts               # Table definitions
│   └── migrations/             # Generated by drizzle-kit
├── lib/
│   ├── actions.ts              # Server Actions
│   ├── queries.ts              # Read-only DB queries
│   └── validators.ts           # Zod schemas
└── types/index.ts              # Shared TS types
```
