/**
 * CartPage.ts — BrowserStackDemo cart page object.
 */
import { Page } from '@playwright/test';
import { BasePage } from '../../../framework/base/BasePage';
import { CartPageLocators } from '../locators/CartPage.locators';
import { Messages } from '../../../framework/constants/Messages';

export class CartPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  /** Add a product to the cart. */
  async addToCart(): Promise<void> {
    await this.element.click(this.page.locator(CartPageLocators.addToCartButton).first());
    await this.wait.waitForNetwork();
    this.log.pass(Messages.CART.ADDED);
  }

  /** Open the shopping cart. */
  async openCart(): Promise<void> {
    await this.element.click(this.page.locator(CartPageLocators.cartIcon).first());
    await this.wait.waitForNetwork();
  }

  /** Read the item count shown on the cart icon. */
  async cartItemCount(): Promise<number> {
    const text = await this.element.getText(this.page.locator(CartPageLocators.cartQuantity).first());
    return parseInt((text || '0').replace(/\D/g, ''), 10) || 0;
  }

  /** Assert the cart icon shows the expected item count. */
  async verifyCartCount(expected: number): Promise<void> {
    const actual = await this.cartItemCount();
    if (actual !== expected) {
      throw new Error(`Expected cart count ${expected} but found ${actual}.`);
    }
    this.log.pass(`Cart icon shows ${actual} item(s).`);
  }

  /** Assert the added product name appears in the cart list. */
  async verifyProductInCart(productName: string): Promise<void> {
    await this.assertions.verifyContainText(this.page.locator(CartPageLocators.cartItem).first(), productName, 'cart item');
  }

  /** Assert the cart line-item price matches the given price string. */
  async verifyCartPrice(price: string): Promise<void> {
    await this.assertions.verifyContainText(this.page.locator(CartPageLocators.cartItem).first(), price, 'cart item price');
  }
}
