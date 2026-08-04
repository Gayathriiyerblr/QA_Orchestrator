/**
 * LoginPage.locators.ts — OrangeHRM login page locators.
 * Plain string constants so the self-healing agent can patch them safely
 * (websites/OrangeHRM/locators/*.locators.ts).
 */
export const LoginPageLocators = {
  usernameInput: 'input[name="username"]',
  passwordInput: 'input[name="password"]',
  submitButton: 'button[type="submit"]',
  dashboardHeading: '.oxd-topbar-header-title',
  errorMessage: '.oxd-alert-content, .oxd-alert',
} as const;
