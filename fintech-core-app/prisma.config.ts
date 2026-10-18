import 'dotenv/config';
import { defineConfig } from 'prisma/config';

/** Configuración Prisma del monorepo Fintech Core (PostgreSQL). */
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
