/**
 * LoginPage.ts — OrangeHRM Login page object.
 * Extends BasePage so every interaction goes through ElementActions
 * (wait + scroll + retry + logging + screenshots).
 */
import { Page } from '@playwright/test';
import { BasePage } from '../../../framework/base/BasePage';
import { getBaseURL, SITES } from '../../../framework/constants/URLs';
import { DEFAULT_CREDENTIALS } from '../../../framework/constants/TestConstants';
import { LoginPageLocators } from '../locators/LoginPage.locators';

export class LoginPage extends BasePage {
  private readonly baseUrl: string;

  constructor(page: Page, env: string = 'dev') {
    super(page);
    this.baseUrl = getBaseURL(SITES.OrangeHRM, env);
  }

  /** Navigate to the login page. */
  async goto(): Promise<void> {
    await this.page.goto(this.baseUrl);
    // Wait for the login form to actually render (SPA) instead of racing networkidle.
    await this.wait.waitForElement(this.page.locator(LoginPageLocators.usernameInput).first(), 20_000);
  }

  /** Log in with the given credentials (defaults to the demo Admin account). */
  async login(username?: string, password?: string): Promise<void> {
    const creds = DEFAULT_CREDENTIALS.OrangeHRM;
    const user = username ?? creds.username;
    const pass = password ?? creds.password;

    await this.goto();
    await this.element.fill(this.page.locator(LoginPageLocators.usernameInput), user);
    await this.element.fill(this.page.locator(LoginPageLocators.passwordInput), pass);
    await this.element.click(this.page.locator(LoginPageLocators.submitButton));
    // After submit, wait for the dashboard route + heading rather than networkidle.
    await this.wait.waitForRoute(/dashboard|index/, 20_000);
    await this.expectLoaded();
    this.log.pass('OrangeHRM login succeeded');
  }

  /** Assert the dashboard/home page loaded after login. */
  async expectLoaded(): Promise<void> {
    await this.wait.waitForPageLoad('domcontentloaded');
    await this.assertions.verifyVisible(this.page.locator(LoginPageLocators.dashboardHeading), 'dashboard heading');
  }
}
