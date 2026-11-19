# Job Tracker

A Kanban-style board for tracking developer job applications in Spain. Built with Next.js 16, React 19, and PostgreSQL on Neon.

<!-- TODO: Add a screenshot of the board here -->
<!-- ![Job Tracker Board](./screenshot.png) -->

## Live Demo

<!-- TODO: Add your Vercel deploy URL here -->
<!-- [job-tracker.vercel.app](https://job-tracker.vercel.app) -->

## Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 16](https://nextjs.org/) (App Router) |
| UI | [React 19](https://react.dev/) + [Tailwind CSS v4](https://tailwindcss.com/) |
| Language | TypeScript (strict mode) |
| Database | PostgreSQL on [Neon](https://neon.tech/) (serverless) |
| ORM | [Drizzle ORM](https://orm.drizzle.team/) |
| Validation | [Zod 4](https://zod.dev/) |
| Drag & Drop | [@dnd-kit](https://dndkit.com/) |
| Deployment | [Vercel](https://vercel.com/) |

## Features

- **Kanban Board** — Drag-and-drop cards between columns (Saved, Applied, Interview, Technical Test, Offer, Rejected)
- **Server Actions** — Create, edit, and update applications without API routes
- **Status History** — Timeline of every status change for each application
- **Stats Dashboard** — Aggregate stats with ISR (auto-refreshes every 60 seconds)
- **Optimistic UI** — Card moves feel instant; reverts on failure
- **Loading Skeletons** — Skeleton UIs for every route while data loads
- **Error Boundaries** — Per-route error handling with retry buttons
- **SEO** — OpenGraph and Twitter card metadata for social sharing
- **Progressive Enhancement** — Forms work even without JavaScript

## How to Run

### Prerequisites

- Node.js 18+
- A free database at [neon.tech](https://neon.tech)

### Setup

```bash
# 1. Clone the repo
git clone https://github.com/lianesamp/job_tracker_nextjs.git
cd job_tracker_nextjs

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Neon connection strings

# 4. Run database migrations
npm run db:migrate

# 5. Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run db:generate` | Generate migration files from schema changes |
| `npm run db:migrate` | Apply migrations to the database |
| `npm run db:studio` | Open Drizzle Studio (DB viewer) |

## Project Structure

```
src/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root layout (header, metadata)
│   ├── page.tsx                  # Home → redirects to /board
│   ├── not-found.tsx             # Global 404 page
│   ├── board/
│   │   ├── page.tsx              # Kanban board (Server Component)
│   │   ├── loading.tsx           # Board skeleton
│   │   └── error.tsx             # Board error boundary
│   ├── applications/
│   │   ├── new/page.tsx          # Add application form
│   │   └── [id]/
│   │       ├── page.tsx          # Detail + edit page
│   │       ├── loading.tsx       # Detail skeleton
│   │       └── error.tsx         # Detail error boundary
│   └── stats/page.tsx            # Stats with caching
├── components/
│   ├── kanban/                   # KanbanBoard, KanbanColumn, KanbanCard
│   ├── forms/                    # ApplicationForm (create + edit)
│   └── ui/                       # StatusTimeline
├── db/
│   ├── index.ts                  # Drizzle client + Neon connection
│   ├── schema.ts                 # Table definitions
│   └── migrations/               # SQL migration files
├── lib/
│   ├── actions.ts                # Server Actions (create, update, status)
│   └── validators.ts             # Zod validation schemas
└── types/index.ts                # Shared TypeScript types
```

## What I Learned

This project was built step-by-step as a learning exercise. See [LEARNING.md](./LEARNING.md) for a full glossary of concepts, with comparisons to Laravel/Vue where applicable.

Key takeaways:

- **App Router** — File-based routing with special files (`page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`)
- **Server vs Client Components** — Fetch data on the server, interact on the client
- **Server Actions** — Mutations without API routes, with `useActionState` for form integration
- **Drizzle ORM** — Type-safe SQL in TypeScript, with schema-driven types
- **Zod validation** — Runtime validation that generates TypeScript types
- **@dnd-kit** — Accessible drag-and-drop with optimistic UI
- **ISR / "use cache"** — Static pages that refresh periodically
- **React 19 patterns** — `useActionState`, `useTransition`, `<Suspense>`

---

Built by [Liane](https://github.com/lianesamp) as a portfolio project for the Spanish job market.
