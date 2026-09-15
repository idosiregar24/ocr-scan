import "dotenv/config";
import { defineConfig, env } from "prisma/config";

// Prisma 7: connection URL & seed command pindah ke sini, tidak lagi di schema.prisma/package.json.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
