import { defineConfig, devices } from '@playwright/test';

// Chạy trên hệ thống đang hoạt động (web + API + DB). Mặc định là cổng của docker compose.
// Đổi bằng E2E_WEB_URL / E2E_API_URL khi chạy ở cổng khác.
export default defineConfig({
  testDir: '.',
  testMatch: '*.spec.ts',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: process.env.E2E_WEB_URL ?? 'http://localhost:4004',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
