import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./src/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    // Use the UNPOOLED connection for migrations (drizzle-kit needs direct access)
    url: process.env.DATABASE_URL_UNPOOLED!,
  },
});
