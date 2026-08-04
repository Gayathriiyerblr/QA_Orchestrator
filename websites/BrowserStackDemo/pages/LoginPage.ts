/**
 * LoginPage.ts — BrowserStackDemo Login/Sign-In page object.
 */
import { Page } from '@playwright/test';
import { BasePage } from '../../../framework/base/BasePage';
import { getBaseURL, SITES } from '../../../framework/constants/URLs';
import { LoginPageLocators } from '../locators/LoginPage.locators';

export class LoginPage extends BasePage {
  private readonly baseUrl: string;

  constructor(page: Page, env: string = 'dev') {
    super(page);
    this.baseUrl = getBaseURL(SITES.BrowserStackDemo, env);
  }

  /** Navigate to the app home page. */
  async goto(): Promise<void> {
    await this.page.goto(this.baseUrl);
    await this.wait.waitForNetwork();
  }

  /** Load the app home page and verify it rendered. */
  async login(): Promise<void> {
    await this.goto();
    await this.expectLoaded();
  }

  /** Open the Sign In page via direct navigation (the header link is a SPA route). */
  async openSignInPage(): Promise<void> {
    await this.page.goto(`${this.baseUrl.replace(/\/$/, '')}/signin`);
    await this.wait.waitForNetwork();
  }

  /**
   * Perform the real BrowserStack demo sign-in: on the Sign In page, click the
   * Username dropdown and pick a user, click the Password dropdown and pick the
   * matching password, then click "Log In".
   */
  async signIn(username = 'demouser', password = 'testingisfun99'): Promise<void> {
    await this.openSignInPage();

    // Username dropdown (React-select). Click to open, then select the option.
    await this.element.click(this.page.locator(LoginPageLocators.usernameDropdown).first());
    const userOption = this.page
      .locator(LoginPageLocators.dropdownOption)
      .filter({ hasText: username })
      .first();
    await this.element.click(userOption);

    // Password dropdown.
    await this.element.click(this.page.locator(LoginPageLocators.passwordDropdown).first());
    const passOption = this.page
      .locator(LoginPageLocators.dropdownOption)
      .filter({ hasText: password })
      .first();
    await this.element.click(passOption);

    await this.element.click(this.page.locator(LoginPageLocators.loginButton).first());
    await this.wait.waitForNetwork();
  }

  /** Assert the Sign In page loaded with the Username and Password dropdowns. */
  async verifySignInPageLoaded(): Promise<void> {
    await this.assertions.verifyVisible(this.page.locator(LoginPageLocators.usernameDropdown).first(), 'username dropdown');
    await this.assertions.verifyVisible(this.page.locator(LoginPageLocators.passwordDropdown).first(), 'password dropdown');
    await this.assertions.verifyVisible(this.page.locator(LoginPageLocators.loginButton).first(), 'login button');
  }

  /** Assert no authentication error banner is displayed. */
  async verifyNoAuthErrors(): Promise<void> {
    const errCount = await this.element.count(this.page.locator(LoginPageLocators.authError));
    if (errCount > 0) {
      throw new Error(`Expected no authentication errors but found ${errCount} error banner(s).`);
    }
    this.log.pass('No authentication errors displayed.');
  }

  /** Assert the logged-in user name appears in the header. */
  async verifyLoggedInUser(username: string): Promise<void> {
    await this.assertions.verifyContainText(this.page.locator(LoginPageLocators.headerUserName).first(), username, 'header user name');
  }

  /** Assert the home page loaded. */
  async expectLoaded(): Promise<void> {
    await this.wait.waitForPageLoad('domcontentloaded');
    await this.assertions.verifyVisible(this.page.locator('body'), 'home page body');
  }
}
