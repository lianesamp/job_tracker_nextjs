import {
  pgTable,
  serial,
  text,
  timestamp,
  integer,
} from "drizzle-orm/pg-core";

/**
 * Valid statuses for a job application, matching the Kanban columns.
 */
export const APPLICATION_STATUSES = [
  "saved",
  "applied",
  "interview",
  "technical_test",
  "offer",
  "rejected",
] as const;

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

/**
 * Valid work modes for a job posting.
 */
export const WORK_MODES = ["on-site", "hybrid", "remote"] as const;

export type WorkMode = (typeof WORK_MODES)[number];

// ─── Tables ──────────────────────────────────────────────

export const applications = pgTable("applications", {
  id: serial("id").primaryKey(),
  company: text("company").notNull(),
  role: text("role").notNull(),
  jobUrl: text("job_url"),
  city: text("city"),
  workMode: text("work_mode", { enum: WORK_MODES }).notNull(),
  salary: text("salary"),
  status: text("status", { enum: APPLICATION_STATUSES })
    .notNull()
    .default("saved"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const statusHistory = pgTable("status_history", {
  id: serial("id").primaryKey(),
  applicationId: integer("application_id")
    .notNull()
    .references(() => applications.id, { onDelete: "cascade" }),
  fromStatus: text("from_status", { enum: APPLICATION_STATUSES }),
  toStatus: text("to_status", { enum: APPLICATION_STATUSES }).notNull(),
  changedAt: timestamp("changed_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
