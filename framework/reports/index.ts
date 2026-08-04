/**
 * framework/reports/index.ts — central reporter wiring.
 * HTML reporter (open: never) + the custom results reporter used by the
 * orchestrator to write artifacts/{jiraId}/results.json.
 */
import type { ReporterDescription } from '@playwright/test';

export const reporters: ReporterDescription[] = [
  ['html', { open: 'never' }],
  // Playwright resolves reporter paths relative to the config file that loads
  // them. The enterprise config lives in config/, so from there the reporter is
  // one level up (../scripts/...). The root config re-declares this as
  // ./scripts/... (root-relative), so both entry points work.
  ['../scripts/playwright-results-reporter.js'],
];

/** Root-relative variant used by the repo-root playwright.config.ts. */
export const rootReporters: ReporterDescription[] = [
  ['html', { open: 'never' }],
  ['./scripts/playwright-results-reporter.js'],
];
