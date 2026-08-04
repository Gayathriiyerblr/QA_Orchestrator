/**
 * DemoLocators.locators.ts — locators used by the demo/self-heal and
 * known-bug test cases (TC_UI_HEAL / TC_UI_BUG). Kept as constants so the
 * self-healing agent can patch them in place and heals survive regeneration.
 */
export const DemoLocators = {
  /** Deliberately stale — fails until the self-healing agent rewrites it. */
  staleContainer: 'body',
  /** Deliberately absent — the app violates this; logs a bug. */
  sessionTimeoutNotice: '.session-timeout-notice',
} as const;
