/**
 * WaitHelper.ts — reusable wait strategies shared by every website.
 * waitForLoader / waitForToast / waitForSpinner / waitForNetwork /
 * waitForPageLoad / waitUntilVisible
 */
import { Page, Locator } from '@playwright/test';
import { TIMEOUTS } from '../constants/TestConstants';

const LOADER_SELECTORS = [
  '.oxd-loading-spinner',
  '.loading',
  '.spinner',
  '[class*="spinner"]',
  '[class*="loader"]',
].join(',');

const TOAST_SELECTORS = ['.oxd-toast', '.toast', '[class*="toast"]'].join(',');

export class WaitHelper {
  constructor(private readonly page: Page) {}

  /** Wait for any loading spinner to disappear. */
  async waitForLoader(timeout = TIMEOUTS.NETWORK): Promise<void> {
    await this.page
      .locator(LOADER_SELECTORS)
      .first()
      .waitFor({ state: 'hidden', timeout })
      .catch(() => {});
  }

  /** Wait for a toast/notification to appear. */
  async waitForToast(timeout = TIMEOUTS.ACTION): Promise<Locator | null> {
    const toast = this.page.locator(TOAST_SELECTORS).first();
    const visible = await toast.isVisible().catch(() => false);
    if (!visible) {
      await toast.waitFor({ state: 'visible', timeout }).catch(() => {});
    }
    return (await toast.isVisible().catch(() => false)) ? toast : null;
  }

  /** Wait for any spinner to disappear (alias of waitForLoader). */
  async waitForSpinner(timeout = TIMEOUTS.NETWORK): Promise<void> {
    await this.waitForLoader(timeout);
  }

  /** Wait for the network to idle (best-effort, never throws). */
  async waitForNetwork(timeout = TIMEOUTS.NETWORK): Promise<void> {
    await this.page.waitForLoadState('networkidle', { timeout }).catch(() => {});
  }

  /**
   * Wait for the URL to match the given pattern after a SPA navigation.
   * More reliable than networkidle on SPAs that keep connections open.
   * Returns true when the URL matched within the timeout, false otherwise.
   */
  async waitForRoute(urlOrPattern: string | RegExp, timeout: number = TIMEOUTS.NAVIGATION): Promise<boolean> {
    try {
      await this.page.waitForURL(urlOrPattern, { timeout });
      return true;
    } catch {
      return false;
    }
  }

  /** Wait for a specific element to become visible (returns true/false, never throws). */
  async waitForElement(locator: Locator, timeout: number = TIMEOUTS.ACTION): Promise<boolean> {
    return this.waitUntilVisible(locator, timeout);
  }

  /** Wait for the page to reach the given load state. */
  async waitForPageLoad(state: 'load' | 'domcontentloaded' | 'networkidle' = 'load', timeout = TIMEOUTS.NAVIGATION): Promise<void> {
    await this.page.waitForLoadState(state, { timeout }).catch(() => {});
  }

  /** Wait until a locator is visible; returns true when visible, false on timeout. */
  async waitUntilVisible(locator: Locator, timeout: number = TIMEOUTS.ACTION): Promise<boolean> {
    try {
      await locator.waitFor({ state: 'visible', timeout });
      return true;
    } catch {
      return false;
    }
  }

  /** Wait until a locator is hidden; returns true when hidden, false on timeout. */
  async waitUntilHidden(locator: Locator, timeout = TIMEOUTS.ACTION): Promise<boolean> {
    try {
      await locator.waitFor({ state: 'hidden', timeout });
      return true;
    } catch {
      return false;
    }
  }
}
