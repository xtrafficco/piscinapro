import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'e2e',
  timeout: 45000,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: 'http://localhost:5177',
    trace: 'retain-on-failure',
    serviceWorkers: 'block',
  },
  webServer: {
    command: 'node scripts/serve.mjs',
    url: 'http://localhost:5177',
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] }, grepInvert: /@mobile/ },
    { name: 'celular', use: { ...devices['Pixel 7'] }, grep: /@mobile/ },
  ],
});
