import "dotenv/config";
import { defineConfig } from "prisma/config";

const detectedSchema =
  process.env["PRISMA_SCHEMA"] ??
  (process.env["DATABASE_URL"]?.startsWith("file:")
    ? "prisma/schema.sqlite.prisma"
    : "prisma/schema.postgresql.prisma");

export default defineConfig({
  schema: detectedSchema,
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
