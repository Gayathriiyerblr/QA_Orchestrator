/**
 * CheckoutPage.ts — BrowserStackDemo checkout page object.
 */
import { Page } from '@playwright/test';
import { BasePage } from '../../../framework/base/BasePage';
import { CheckoutPageLocators } from '../locators/CheckoutPage.locators';
import { RandomData } from '../../../framework/utils/RandomData';

export class CheckoutPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  /**
   * Proceed to checkout and fill the shipping form.
   * Uses unique generated customer data per run so repeated executions never
   * collide with previously placed orders.
   */
  async checkout(firstName?: string, lastName?: string, address?: string): Promise<void> {
    const fName = firstName ?? RandomData.firstName();
    const lName = lastName ?? RandomData.lastName();
    const addr = address ?? `${RandomData.alphanumeric(6)} Test Ave, Springfield`;

    await this.element.click(this.page.locator(CheckoutPageLocators.checkoutButton).first());
    await this.element.fill(this.page.locator(CheckoutPageLocators.firstNameInput).first(), fName);
    await this.element.fill(this.page.locator(CheckoutPageLocators.lastNameInput).first(), lName);
    await this.element.fill(this.page.locator(CheckoutPageLocators.addressInput).first(), addr);
    await this.element.click(this.page.locator(CheckoutPageLocators.submitButton).first());
    await this.wait.waitForNetwork();
  }

  /** Verify the order confirmation is displayed. */
  async expectOrderConfirmation(): Promise<void> {
    await this.assertions.verifyVisible(this.page.locator(CheckoutPageLocators.orderConfirmation).first(), 'order confirmation');
  }
}
