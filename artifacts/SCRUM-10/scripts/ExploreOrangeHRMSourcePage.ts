/**
 * ExploreOrangeHRMSourcePage.ts — auto-generated Page Object Model from JIRA requirements.
 * Regenerate via scripts/generate_playwright_scripts.js; do not edit by hand.
 */
import { Page, Locator } from '@playwright/test';

export class ExploreOrangeHRMSourcePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async login() {
    await this.page.goto('https://opensource-demo.orangehrmlive.com/web/index.php/auth/login');
    await this.page.fill('input[name="username"]', 'Admin');
    await this.page.fill('input[name="password"]', 'admin123');
    await this.page.click('button[type="submit"]');
    await this.page.waitForLoadState('networkidle').catch(() => {});
  }

  /** Navigate to a top-level module or section of the application. */
  async navigateToModule(module: string) {
    const normalized = module.toLowerCase();
    const link = this.page.locator(`a[href*="${normalized}"], li:has-text("${module}")`).first();
    await link.click();
    await this.page.waitForLoadState('networkidle').catch(() => {});
  }

  /** Assert the page loaded after login/navigation. */
  async expectLoaded() {
    await this.page.waitForLoadState('domcontentloaded');
    await this.page.locator('body').waitFor({ state: 'visible', timeout: 15000 });
  }
}
