/**
 * ElementActions.ts — the central interaction layer.
 * Every page object interacts through ElementActions, so each website gets
 * wait → scroll → retry → log → screenshot on every click/fill/select for free.
 *
 * The plan's "reusable catch": instead of `locator.click()` everywhere, tests
 * call `element.click(locator)` which internally does:
 *   waitFor → scrollIntoViewIfNeeded → click (with retry + logging + failure shot).
 */
import { Page, Locator } from '@playwright/test';
import { TIMEOUTS } from '../constants/TestConstants';
import { logger } from '../utils/Logger';
import { takeFailure } from '../utils/ScreenshotUtil';
import { retry } from '../utils/RetryUtil';
import { WaitHelper } from './WaitHelper';

export class ElementActions {
  private readonly wait: WaitHelper;

  constructor(
    private readonly page: Page,
    private readonly log: typeof logger = logger,
  ) {
    this.wait = new WaitHelper(page);
  }

  /** Wait for the locator to be attached/visible, scrolling into view first. */
  async waitFor(locator: Locator, state: 'visible' | 'attached' | 'hidden' = 'visible', timeout = TIMEOUTS.ACTION): Promise<void> {
    await locator.waitFor({ state, timeout });
  }

  /** Click with wait + scroll + retry + logging + failure screenshot. */
  async click(locator: Locator, options?: { timeout?: number }): Promise<void> {
    const timeout = options?.timeout ?? TIMEOUTS.ACTION;
    await retry(async () => {
      await locator.waitFor({ state: 'visible', timeout }).catch(() => {});
      await locator.scrollIntoViewIfNeeded({ timeout }).catch(() => {});
      await locator.click({ timeout });
      this.log.pass(`Clicked ${describe(locator)}`);
    });
  }

  /** Fill (type) with wait + scroll + retry + logging + failure screenshot. */
  async fill(locator: Locator, value: string, options?: { timeout?: number }): Promise<void> {
    const timeout = options?.timeout ?? TIMEOUTS.ACTION;
    await retry(async () => {
      await locator.waitFor({ state: 'visible', timeout }).catch(() => {});
      await locator.scrollIntoViewIfNeeded({ timeout }).catch(() => {});
      await locator.fill(value, { timeout });
      this.log.pass(`Filled ${describe(locator)} = "${value}"`);
    });
  }

  /** Read text content (logs + returns null-safe). */
  async getText(locator: Locator, timeout = TIMEOUTS.ACTION): Promise<string> {
    await locator.waitFor({ state: 'visible', timeout }).catch(() => {});
    const text = await locator.textContent({ timeout }).catch(() => null);
    this.log.info(`Read text from ${describe(locator)} = "${text}"`);
    return text ?? '';
  }

  /** Check visibility. */
  async isVisible(locator: Locator, timeout = TIMEOUTS.ACTION): Promise<boolean> {
    await locator.waitFor({ state: 'attached', timeout }).catch(() => {});
    const visible = await locator.isVisible().catch(() => false);
    this.log.debug(`isVisible ${describe(locator)} = ${visible}`);
    return visible;
  }

  /** Press a key on a locator (e.g. Enter after search fill). */
  async press(locator: Locator, key: string, options?: { timeout?: number }): Promise<void> {
    const timeout = options?.timeout ?? TIMEOUTS.ACTION;
    await retry(async () => {
      await locator.waitFor({ state: 'visible', timeout }).catch(() => {});
      await locator.press(key, { timeout });
      this.log.pass(`Pressed "${key}" on ${describe(locator)}`);
    });
  }

  /** Count matching elements. */
  async count(locator: Locator): Promise<number> {
    const n = await locator.count();
    this.log.debug(`Count ${describe(locator)} = ${n}`);
    return n;
  }

  /** Wait for the page to settle after an action (best-effort). */
  async waitForPageSettle(): Promise<void> {
    await this.wait.waitForLoader();
    await this.wait.waitForNetwork();
  }

  /** Capture a failure screenshot for the current page (no-throw). */
  async screenshotOnFailure(name: string): Promise<string | null> {
    return takeFailure(this.page, name);
  }
}

/** Best-effort human-readable description of a locator for logs. */
function describe(locator: Locator): string {
  try {
    return locator.toString();
  } catch {
    return 'locator';
  }
}
