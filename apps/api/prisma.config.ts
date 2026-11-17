import { defineConfig } from 'prisma/config';

// Tự động nạp file .env vào process.env
process.loadEnvFile?.();

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations', seed: 'tsx prisma/seed.ts' },
  datasource: { url: process.env.DATABASE_URL },
});
