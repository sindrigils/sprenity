import { defineConfig, devices } from '@playwright/test';

const port = 41973;
const apiPort = 41974;
const e2eDatabaseUrl = 'sqlite+aiosqlite:///./.e2e/playwright.db';
process.env.SPRENITY_E2E_BOOTSTRAP_URL ??=
  `http://127.0.0.1:${apiPort}/api/e2e/bootstrap`;

export default defineConfig({
  testDir: './tests/ui',
  timeout: 60_000,
  workers: 1,
  expect: {
    timeout: 10_000,
  },
  fullyParallel: false,
  reporter: [['list']],
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    viewport: { width: 1400, height: 900 },
    launchOptions: {
      args: [
        '--use-angle=swiftshader',
        '--use-gl=angle',
        '--enable-unsafe-swiftshader',
      ],
    },
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1400, height: 900 },
      },
    },
  ],
  webServer: [
    {
      command: `uv run sprenity-e2e-bootstrap && uv run python -m uvicorn app.main:app --host 127.0.0.1 --port ${apiPort}`,
      cwd: '../server',
      env: {
        ...process.env,
        DATABASE_URL: e2eDatabaseUrl,
        SPRENITY_DATABASE_URL: e2eDatabaseUrl,
        ENVIRONMENT: 'test',
        SPRENITY_ENVIRONMENT: 'test',
      },
      url: `http://127.0.0.1:${apiPort}/health`,
      reuseExistingServer: false,
      timeout: 120_000,
    },
    {
      command: `npm run dev -- --host 127.0.0.1 --port ${port}`,
      env: {
        ...process.env,
        SPRENITY_API_PROXY: `http://127.0.0.1:${apiPort}`,
      },
      url: `http://127.0.0.1:${port}`,
      reuseExistingServer: false,
      timeout: 120_000,
    },
  ],
});
