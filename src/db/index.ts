import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

/**
 * Neon HTTP driver — sends each query as an HTTP request.
 * Perfect for serverless (Vercel) because there's no persistent TCP connection
 * to manage. Each Server Component / Server Action just fires HTTP queries.
 *
 * We use DATABASE_URL (the pooled connection) for app queries.
 * Migrations use DATABASE_URL_UNPOOLED (direct connection) via drizzle-kit.
 */
const sql = neon(process.env.DATABASE_URL!);

export const db = drizzle(sql, { schema });
