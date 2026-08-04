/**
 * BaseTest.ts — shared test hooks.
 * Initializes the logger per JIRA run and attaches failure screenshots on
 * test failure. Extend or reuse via the custom fixture (fixtures/CustomFixtures).
 */
import { test as base, Page } from '@playwright/test';
import { logger } from '../utils/Logger';
import { takeFailure } from '../utils/ScreenshotUtil';

export interface BaseTestOptions {
  jiraId: string;
  testDir: string;
}

/**
 * Create a per-JIRA test instance that wires the logger + failure screenshots.
 * Usage:
 *   const test = baseTest({ jiraId: 'SCRUM-10', testDir: 'OrangeHRM' });
 *   test('...', async ({ page }) => { ... });
 */
export function baseTest(options: BaseTestOptions) {
  const { jiraId } = options;
  const test = base.extend<{ jiraId: string }>({
    jiraId: [jiraId, { option: true }],
  });

  test.beforeAll(() => {
    logger.init(jiraId);
  });

  test.afterEach(async ({ page }, testInfo) => {
    if (testInfo.status !== 'passed' && testInfo.status !== 'skipped') {
      await takeFailure(page, testInfo.title.replace(/\s+/g, '_'), jiraId);
    }
  });

  return test;
}

export type { Page };
