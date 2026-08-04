/**
 * CustomFixtures.ts — typed Playwright fixtures shared by every website.
 *
 * Attaches:
 *   - env        (Environment) — resolved from process.env.ENV ?? 'dev'
 *   - logger     (Logger)      — shared logger, initialized per jiraId
 *   - apiClient  (APIClient)   — shared API client against the env API base URL
 *   - jiraId     (string)      — overridable per test (defaults to project name)
 *
 * Specs import `test` from here instead of @playwright/test to get the
 * enterprise behavior (logging, screenshots, env resolution) for free.
 */
import { test as base } from '@playwright/test';
import { getEnvironment, Environment } from '../config/environments';
import { logger } from '../framework/utils/Logger';
import { APIClient } from '../framework/api/APIClient';
import { SITES } from '../framework/constants/URLs';

export interface CustomFixtures {
  env: Environment;
  logger: typeof logger;
  apiClient: APIClient;
  jiraId: string;
}

export const test = base.extend<CustomFixtures>({
  env: [({}, use) => use(getEnvironment(process.env.ENV ?? 'dev')), { option: true }],

  logger: [({}, use) => use(logger), { scope: 'test' }],

  apiClient: [async ({ env }, use) => {
    const client = new APIClient({ baseURL: env.apiBaseURL });
    await use(client);
    await client.dispose();
  }, { scope: 'test' }],

  jiraId: [({}, use) => use(SITES.OrangeHRM), { option: true }],
});

export { expect } from '@playwright/test';
export type { Page, Locator } from '@playwright/test';
