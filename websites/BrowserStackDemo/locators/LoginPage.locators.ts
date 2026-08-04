/**
 * LoginPage.locators.ts — BrowserStackDemo login/sign-in page locators.
 */
export const LoginPageLocators = {
  signInLink: 'a:has-text("Sign In")',
  usernameDropdown: '.css-1hwfws3, [class*="select"]:has-text("Select Username"), [id*="username"]',
  passwordDropdown: '[class*="select"]:has-text("Select Password"), [id*="password"]',
  loginButton: 'button:has-text("Log In")',
  dropdownOption: '.css-26l3qy-menu [class*="option"], [class*="menu"] [class*="option"], [role="option"]',
  authError: '.api-error, [class*="error"], [class*="api-error"]',
  headerUserName: '.username, [class*="username"]',
} as const;
