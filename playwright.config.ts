/**
 * Root playwright.config.ts — delegates to the enterprise config under config/.
 * Keeping this file at the repo root means `npx playwright test <specs>`
 * (as invoked by scripts/orchestrate.js) and `npm test` both use the
 * enterprise testDir (websites/), projects, and reporters.
 *
 * Note: reporter paths are resolved relative to this root config, so we use the
 * root-relative reporter list (./scripts/...) instead of the config/ one.
 */
import { defineConfig } from '@playwright/test';
import config from './config/playwright.config';
import { rootReporters } from './framework/reports/index';

export default defineConfig({
  ...config,
  reporter: rootReporters,
});
