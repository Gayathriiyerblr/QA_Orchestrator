/**
 * TestConstants.ts — global timeout + default-value constants.
 * Website-agnostic; import from framework/constants/TestConstants.
 */

export const TIMEOUTS = {
  /** Default action timeout applied by ElementActions when none is given. */
  ACTION: 15_000,
  /** Default assertion timeout applied by BaseAssertions. */
  ASSERT: 10_000,
  /** Wait for a network-idle state (generous; callers usually wrap in .catch). */
  NETWORK: 10_000,
  /** Wait for page navigation / DOM ready. */
  NAVIGATION: 30_000,
} as const;

export const RETRY = {
  /** Default retry count for retryable actions. */
  COUNT: 2,
  /** Base delay in ms between retries (doubles each attempt). */
  BASE_DELAY_MS: 500,
  /** Max delay in ms between retries. */
  MAX_DELAY_MS: 3_000,
} as const;

export const DEFAULT_ENV = 'dev';

export const DEFAULT_CREDENTIALS = {
  OrangeHRM: { username: 'Admin', password: 'admin123' },
  BrowserStackDemo: { username: 'demouser', password: 'testingisfun99' },
} as const;
