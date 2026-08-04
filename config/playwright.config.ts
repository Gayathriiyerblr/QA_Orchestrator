/**
 * playwright.config.ts — enterprise Playwright configuration.
 * testDir points at the repo-root websites/ folder and is resolved absolutely
 * from this file's location so it works whether the config is loaded directly
 * (config/playwright.config.ts) or spread from the repo-root config.
 */
import { defineConfig, devices } from '@playwright/test';
import * as path from 'path';
import { reporters } from '../framework/reports/index';

const repoRoot = path.resolve(__dirname, '..');

export default defineConfig({
  testDir: path.join(repoRoot, 'websites'),
  testMatch: '**/*.spec.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: reporters,
  use: {
    trace: 'on-first-retry',
    viewport: { width: 1280, height: 720 },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
