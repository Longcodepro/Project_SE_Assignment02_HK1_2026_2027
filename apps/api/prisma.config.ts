import { defineConfig } from 'prisma/config';

// Tự động nạp file .env vào process.env nếu có (khi build Docker hoặc production không có .env thì bỏ qua)
try {
  process.loadEnvFile?.();
} catch {
  // Bỏ qua lỗi ENOENT khi file .env không tồn tại
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations', seed: 'tsx prisma/seed.ts' },
  datasource: { url: process.env.DATABASE_URL },
});
