/**
 * ProductPage.ts — BrowserStackDemo product listing/detail page object.
 */
import { Page } from '@playwright/test';
import { BasePage } from '../../../framework/base/BasePage';
import { ProductPageLocators } from '../locators/ProductPage.locators';

export class ProductPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  /** Search for a product using the search box. */
  async searchProduct(term: string): Promise<void> {
    const input = this.page.locator(ProductPageLocators.searchInput).first();
    await this.element.fill(input, term);
    await this.element.press(input, 'Enter');
    await this.wait.waitForNetwork();
  }

  /** Filter products by a brand (click the matching brand label). */
  async filterByBrand(brand: string): Promise<void> {
    const label = this.page
      .locator(`label.checkmark:has-text("${brand}"), .checkmark:has-text("${brand}"), label:has-text("${brand}")`)
      .first();
    await this.element.click(label);
    await this.wait.waitForNetwork();
  }

  /** Open the first product's detail page. */
  async openFirstProduct(): Promise<void> {
    await this.element.click(this.page.locator(ProductPageLocators.productCard).first());
    await this.wait.waitForNetwork();
  }

  /** Read the first product's name. */
  async getFirstProductName(): Promise<string> {
    return this.element.getText(this.page.locator(ProductPageLocators.productName).first());
  }

  /** Read the first product's price. */
  async getFirstProductPrice(): Promise<string> {
    return this.element.getText(this.page.locator(ProductPageLocators.productPrice).first());
  }

  /** Assert the product listing shows results (search/filter applied). */
  async verifyResultsShown(): Promise<void> {
    await this.assertions.verifyVisible(this.page.locator(ProductPageLocators.productCard).first(), 'product card');
    const count = await this.element.count(this.page.locator(ProductPageLocators.productCard));
    this.log.pass(`Product listing rendered with ${count} result(s).`);
  }

  /** Assert the product detail page shows name, price, and image. */
  async verifyProductDetails(): Promise<void> {
    await this.assertions.verifyVisible(this.page.locator(ProductPageLocators.productName).first(), 'product name');
    await this.assertions.verifyVisible(this.page.locator(ProductPageLocators.productPrice).first(), 'product price');
    await this.assertions.verifyVisible(this.page.locator(ProductPageLocators.productImage).first(), 'product image');
  }
}
