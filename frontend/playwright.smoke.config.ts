import { defineConfig } from '@playwright/test';

const backendDbPath = '/tmp/todo-app-e2e.db';
const backendDsn = `file:${backendDbPath}?_pragma=foreign_keys(1)`;
const reuseExistingServer = !process.env.CI;

export default defineConfig({
  testDir: './tests',
  testMatch: /.*\.e2e\.spec\.ts$/,
  timeout: 120_000,
  expect: {
    timeout: 10_000
  },
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list']],
  use: {
    baseURL: 'http://127.0.0.1:3000',
    headless: true,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off'
  },
  webServer: [
    {
      command: [
        'bash -lc',
        `"rm -f ${backendDbPath} ${backendDbPath}-shm ${backendDbPath}-wal && TODOAPP_DB_DSN='${backendDsn}' TODOAPP_ADDR='127.0.0.1:8080' go run ./cmd/api"`
      ].join(' '),
      cwd: '../backend',
      reuseExistingServer,
      timeout: 120_000,
      url: 'http://127.0.0.1:8080/healthz'
    },
    {
      command: "bash -lc 'npm run build && NEXT_PUBLIC_API_URL=http://127.0.0.1:8080 npm run start'",
      cwd: '.',
      reuseExistingServer,
      timeout: 180_000,
      url: 'http://127.0.0.1:3000'
    }
  ]
});
