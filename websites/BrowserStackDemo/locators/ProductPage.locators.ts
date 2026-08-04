/**
 * ProductPage.locators.ts — BrowserStackDemo product listing/detail locators.
 */
export const ProductPageLocators = {
  searchInput: 'input[type="text"][placeholder*="Search"], input[type="search"]',
  brandFilter: 'label.checkmark, .checkmark, label:has-text("Apple")',
  productCard: '.shelf-item',
  productName: '.shelf-item__title, [class*="name"]',
  productPrice: '.shelf-item__price, [class*="price"]',
  productImage: '.shelf-item img, .shelf-item__thumb img, [class*="product"] img',
} as const;
