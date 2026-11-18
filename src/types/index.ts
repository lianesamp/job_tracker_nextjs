import type { applications, statusHistory } from "@/db/schema";

/**
 * Types inferred directly from the Drizzle schema.
 *
 * $inferSelect = the shape you get back when you SELECT from the table.
 * $inferInsert = the shape you need to INSERT (optional fields are optional).
 *
 * This is the "single source of truth" pattern:
 *   schema.ts (Drizzle) → types/index.ts (TS types) → validators.ts (Zod)
 * No need to define interfaces manually — they stay in sync with the DB.
 *
 * Laravel equivalent: you'd define a Model and sometimes a Resource/DTO.
 * Here the ORM schema IS the type definition.
 */

// What you get back from a SELECT query
export type Application = typeof applications.$inferSelect;
export type StatusHistoryEntry = typeof statusHistory.$inferSelect;

// What you need to provide for an INSERT
export type NewApplication = typeof applications.$inferInsert;
export type NewStatusHistoryEntry = typeof statusHistory.$inferInsert;
