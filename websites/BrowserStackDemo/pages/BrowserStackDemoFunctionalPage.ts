/**
 * BrowserStackDemoFunctionalPage.ts — auto-generated aggregate Page Object Model.
 * Extends framework/base/BasePage and re-exports the site's page objects.
 */
import { Page } from '@playwright/test';
import { BasePage } from '../../../framework/base/BasePage';
import { CartPage } from './CartPage';
import { CheckoutPage } from './CheckoutPage';
import { LoginPage } from './LoginPage';
import { ProductPage } from './ProductPage';

export class BrowserStackDemoFunctionalPage extends BasePage {
  readonly cartPage: CartPage;
  readonly checkoutPage: CheckoutPage;
  readonly loginPage: LoginPage;
  readonly productPage: ProductPage;

  constructor(page: Page) {
    super(page);
    this.cartPage = new CartPage(page);
    this.checkoutPage = new CheckoutPage(page);
    this.loginPage = new LoginPage(page);
    this.productPage = new ProductPage(page);
  }

  /** Convenience login passthrough (uses the site's LoginPage). */
  async login(): Promise<void> {
    await this.loginPage.login();
  }
}
