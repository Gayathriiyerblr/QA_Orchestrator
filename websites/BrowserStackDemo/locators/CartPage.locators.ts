/**
 * CartPage.locators.ts — BrowserStackDemo cart locators.
 */
export const CartPageLocators = {
  // Exact-text match — "Add to cart" is a <div class="shelf-item__buy-btn">,
  // NOT a <button>; the text engine with `text=` matches exact (case-insensitive)
  // and avoids the bag drawer's "Continue Shopping" element.
  addToCartButton: 'text=Add to cart',
  cartIcon: '.bag, [class*="bag"], a[href*="cart"]',
  cartQuantity: '.bag__quantity, .cart-badge, [class*="quantity"]',
  cartItem: '.bag__item, [class*="cart-item"], .shelf-item',
} as const;
