/**
 * CheckoutPage.locators.ts — BrowserStackDemo checkout locators.
 */
export const CheckoutPageLocators = {
  checkoutButton: 'button:has-text("Checkout")',
  firstNameInput: 'input[name="firstName"], input[placeholder*="First"]',
  lastNameInput: 'input[name="lastName"], input[placeholder*="Last"]',
  addressInput: 'input[name="address"], input[placeholder*="Address"]',
  submitButton: 'button:has-text("Submit"), button[type="submit"]',
  orderConfirmation: '.order-confirmation, [class*="confirmation"], .success',
} as const;
