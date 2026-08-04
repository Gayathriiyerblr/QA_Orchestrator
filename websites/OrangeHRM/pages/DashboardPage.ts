/**
 * DashboardPage.ts — OrangeHRM dashboard/home page object.
 */
import { Page } from '@playwright/test';
import { BasePage } from '../../../framework/base/BasePage';
import { DashboardPageLocators } from '../locators/DashboardPage.locators';

export class DashboardPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  /** Assert the dashboard is visible after login. */
  async expectLoaded(): Promise<void> {
    await this.assertions.verifyVisible(this.page.locator(DashboardPageLocators.pageBody), 'dashboard body');
  }
}
