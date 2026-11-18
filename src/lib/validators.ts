import { z } from "zod";
import { APPLICATION_STATUSES, WORK_MODES } from "@/db/schema";

/**
 * Zod schemas for validating user input.
 *
 * WHY Zod + Drizzle types?
 * - Drizzle types ($inferSelect/$inferInsert) describe the DB shape.
 * - Zod schemas validate UNTRUSTED input (forms, Server Actions).
 * - They serve different purposes: types = compile-time, Zod = runtime.
 *
 * Laravel equivalent: Form Requests (e.g. StoreApplicationRequest).
 * In Laravel you'd write rules like 'required|string|max:255'.
 * In Zod you write z.string().min(1).max(255) — same idea, different syntax.
 */

// ─── Create Application ──────────────────────────────────

export const createApplicationSchema = z.object({
  company: z
    .string()
    .min(1, "Company name is required")
    .max(255, "Company name is too long"),
  role: z
    .string()
    .min(1, "Role is required")
    .max(255, "Role is too long"),
  jobUrl: z
    .string()
    .url("Must be a valid URL")
    .max(2048, "URL is too long")
    .or(z.literal(""))
    .optional(),
  city: z.string().max(255, "City name is too long").optional(),
  workMode: z.enum(WORK_MODES, {
    error: "Work mode must be on-site, hybrid or remote",
  }),
  salary: z.string().max(100, "Salary is too long").optional(),
  status: z.enum(APPLICATION_STATUSES).optional().default("saved"),
  notes: z.string().max(5000, "Notes are too long").optional(),
});

export type CreateApplicationInput = z.infer<typeof createApplicationSchema>;

// ─── Update Application ──────────────────────────────────

export const updateApplicationSchema = createApplicationSchema.partial();

export type UpdateApplicationInput = z.infer<typeof updateApplicationSchema>;

// ─── Update Status (Kanban card move) ────────────────────

export const updateStatusSchema = z.object({
  applicationId: z.coerce.number().int().positive(),
  status: z.enum(APPLICATION_STATUSES),
});

export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;
