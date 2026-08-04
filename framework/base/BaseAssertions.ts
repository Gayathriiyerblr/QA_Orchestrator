/**
 * BaseAssertions.ts — centralized assertion library.
 * Instead of `expect(locator).toBeVisible()` scattered everywhere, tests call
 * `assertions.verifyVisible(locator)`, which centralizes reporting/logging and
 * captures a failure screenshot on assertion failure.
 */
import { expect, Locator, Page } from '@playwright/test';
import { TIMEOUTS } from '../constants/TestConstants';
import { logger } from '../utils/Logger';
import { takeFailure } from '../utils/ScreenshotUtil';

export class BaseAssertions {
  constructor(
    private readonly page: Page,
    private readonly log: typeof logger = logger,
  ) {}

  async verifyVisible(locator: Locator, description = 'element'): Promise<void> {
    try {
      await expect(locator).toBeVisible({ timeout: TIMEOUTS.ASSERT });
      this.log.pass(`Verified visible: ${description}`);
    } catch (err) {
      await takeFailure(this.page, description);
      this.log.fail(`Expected visible but not found: ${description}`);
      throw err;
    }
  }

  async verifyHidden(locator: Locator, description = 'element'): Promise<void> {
    try {
      await expect(locator).toBeHidden({ timeout: TIMEOUTS.ASSERT });
      this.log.pass(`Verified hidden: ${description}`);
    } catch (err) {
      await takeFailure(this.page, description);
      throw err;
    }
  }

  async verifyText(locator: Locator, expectedText: string, description = 'element text'): Promise<void> {
    try {
      await expect(locator).toHaveText(expectedText, { timeout: TIMEOUTS.ASSERT });
      this.log.pass(`Verified text "${expectedText}" on ${description}`);
    } catch (err) {
      await takeFailure(this.page, description);
      this.log.fail(`Expected text "${expectedText}" but got different value on ${description}`);
      throw err;
    }
  }

  async verifyContainText(locator: Locator, expectedText: string, description = 'element text'): Promise<void> {
    try {
      await expect(locator).toContainText(expectedText, { timeout: TIMEOUTS.ASSERT });
      this.log.pass(`Verified text contains "${expectedText}" on ${description}`);
    } catch (err) {
      await takeFailure(this.page, description);
      this.log.fail(`Expected text to contain "${expectedText}" on ${description}`);
      throw err;
    }
  }

  async verifyURL(url: string | RegExp, description = 'url'): Promise<void> {
    try {
      await expect(this.page).toHaveURL(url, { timeout: TIMEOUTS.ASSERT });
      this.log.pass(`Verified URL matches ${url}`);
    } catch (err) {
      await takeFailure(this.page, description);
      this.log.fail(`Expected URL ${url} but got ${this.page.url()}`);
      throw err;
    }
  }

  async verifyTitle(title: string | RegExp, description = 'title'): Promise<void> {
    try {
      await expect(this.page).toHaveTitle(title, { timeout: TIMEOUTS.ASSERT });
      this.log.pass(`Verified title matches ${title}`);
    } catch (err) {
      await takeFailure(this.page, description);
      throw err;
    }
  }

  async verifyElementCount(locator: Locator, expectedCount: number, description = 'elements'): Promise<void> {
    try {
      await expect(locator).toHaveCount(expectedCount, { timeout: TIMEOUTS.ASSERT });
      this.log.pass(`Verified count ${expectedCount} for ${description}`);
    } catch (err) {
      await takeFailure(this.page, description);
      throw err;
    }
  }
}
