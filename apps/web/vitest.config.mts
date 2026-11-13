import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
    resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
    // Chỉ test đơn vị trong src; E2E nằm ở tests/e2e và chạy bằng Playwright
    test: { include: ['src/**/*.test.ts'] },
});
