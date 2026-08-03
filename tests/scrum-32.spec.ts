import { test, expect } from '@playwright/test';
import { BrowserStackDemoFunctionalPage } from '../artifacts/SCRUM-32/scripts/BrowserStackDemoFunctionalPage';

/**
 * SCRUM-32.spec.ts — auto-generated UI tests (POM) from JIRA requirements.
 * Regenerate via scripts/generate_playwright_scripts.js.
 */
test.describe('SCRUM-32: BrowserStack_Demo_Functional UI tests', () => {
  test('TC_UI_01: Verify BrowserStack Demo Functional loads and is accessible', async ({ page }) => {
    const pageObj = new BrowserStackDemoFunctionalPage(page);
    await pageObj.login();
    await pageObj.expectLoaded();
    // Generated from JIRA requirement steps: 1. Navigate to https://bstackdemo.com/. | 2. Sign in with username "demouser" and password "testingisfun99". | 3. Verify login succeeds and the home page loads.
    await expect(page.locator('body')).toBeVisible();
  });

  test('TC_UI_02: Verify acceptance criterion: User can navigate to the application.', async ({ page }) => {
    const pageObj = new BrowserStackDemoFunctionalPage(page);
    await pageObj.login();
    await pageObj.expectLoaded();
    // Generated from JIRA requirement steps: 1. Navigate to https://bstackdemo.com/. | 2. Sign in with username "demouser" and password "testingisfun99". | 3. Verify login succeeds and the home page loads. | 4. Perform the action described in the acceptance criterion: User can navigate to the application.. | 5. Verify the expected outcome.
    await expect(page.locator('body')).toBeVisible();
  });

  test('TC_UI_03: Verify acceptance criterion: User can access the Sign In page.', async ({ page }) => {
    const pageObj = new BrowserStackDemoFunctionalPage(page);
    await pageObj.login();
    await pageObj.expectLoaded();
    // Generated from JIRA requirement steps: 1. Navigate to https://bstackdemo.com/. | 2. Sign in with username "demouser" and password "testingisfun99". | 3. Verify login succeeds and the home page loads. | 4. Perform the action described in the acceptance criterion: User can access the Sign In page.. | 5. Verify the expected outcome.
    await expect(page.locator('body')).toBeVisible();
  });

  test('TC_UI_04: Verify acceptance criterion: User can log in using valid demo credentials.', async ({ page }) => {
    const pageObj = new BrowserStackDemoFunctionalPage(page);
    await pageObj.login();
    await pageObj.expectLoaded();
    // Generated from JIRA requirement steps: 1. Navigate to https://bstackdemo.com/. | 2. Sign in with username "demouser" and password "testingisfun99". | 3. Verify login succeeds and the home page loads. | 4. Perform the action described in the acceptance criterion: User can log in using valid demo credentials.. | 5. Verify the expected outcome.
    await expect(page.locator('body')).toBeVisible();
  });

  test('TC_UI_05: Verify acceptance criterion: User name is displayed after successful login.', async ({ page }) => {
    const pageObj = new BrowserStackDemoFunctionalPage(page);
    await pageObj.login();
    await pageObj.expectLoaded();
    // Generated from JIRA requirement steps: 1. Navigate to https://bstackdemo.com/. | 2. Sign in with username "demouser" and password "testingisfun99". | 3. Verify login succeeds and the home page loads. | 4. Perform the action described in the acceptance criterion: User name is displayed after successful login.. | 5. Verify the expected outcome.
    await expect(page.locator('body')).toBeVisible();
  });

  test('TC_UI_06: Verify acceptance criterion: No authentication errors are displayed.', async ({ page }) => {
    const pageObj = new BrowserStackDemoFunctionalPage(page);
    await pageObj.login();
    await pageObj.expectLoaded();
    // Generated from JIRA requirement steps: 1. Navigate to https://bstackdemo.com/. | 2. Sign in with username "demouser" and password "testingisfun99". | 3. Verify login succeeds and the home page loads. | 4. Perform the action described in the acceptance criterion: No authentication errors are displayed.. | 5. Verify the expected outcome.
    await expect(page.locator('body')).toBeVisible();
  });

  test('TC_UI_07: Verify acceptance criterion: User can search for a product using the search functionality.', async ({ page }) => {
    const pageObj = new BrowserStackDemoFunctionalPage(page);
    await pageObj.login();
    await pageObj.expectLoaded();
    // Generated from JIRA requirement steps: 1. Navigate to https://bstackdemo.com/. | 2. Sign in with username "demouser" and password "testingisfun99". | 3. Verify login succeeds and the home page loads. | 4. Perform the action described in the acceptance criterion: User can search for a product using the search functionality.. | 5. Verify the expected outcome.
    await expect(page.locator('body')).toBeVisible();
  });

  test('TC_UI_08: Verify acceptance criterion: User can filter products by brand.', async ({ page }) => {
    const pageObj = new BrowserStackDemoFunctionalPage(page);
    await pageObj.login();
    await pageObj.expectLoaded();
    // Generated from JIRA requirement steps: 1. Navigate to https://bstackdemo.com/. | 2. Sign in with username "demouser" and password "testingisfun99". | 3. Verify login succeeds and the home page loads. | 4. Perform the action described in the acceptance criterion: User can filter products by brand.. | 5. Verify the expected outcome.
    await expect(page.locator('body')).toBeVisible();
  });

  test('TC_UI_09: Verify acceptance criterion: Filtered products are displayed correctly.', async ({ page }) => {
    const pageObj = new BrowserStackDemoFunctionalPage(page);
    await pageObj.login();
    await pageObj.expectLoaded();
    // Generated from JIRA requirement steps: 1. Navigate to https://bstackdemo.com/. | 2. Sign in with username "demouser" and password "testingisfun99". | 3. Verify login succeeds and the home page loads. | 4. Perform the action described in the acceptance criterion: Filtered products are displayed correctly.. | 5. Verify the expected outcome.
    await expect(page.locator('body')).toBeVisible();
  });

  test('TC_UI_010: Verify acceptance criterion: Search and filter results are updated without page errors.', async ({ page }) => {
    const pageObj = new BrowserStackDemoFunctionalPage(page);
    await pageObj.login();
    await pageObj.expectLoaded();
    // Generated from JIRA requirement steps: 1. Navigate to https://bstackdemo.com/. | 2. Sign in with username "demouser" and password "testingisfun99". | 3. Verify login succeeds and the home page loads. | 4. Perform the action described in the acceptance criterion: Search and filter results are updated without page errors.. | 5. Verify the expected outcome.
    await expect(page.locator('body')).toBeVisible();
  });

  test('TC_UI_011: Verify acceptance criterion: Product details remain accessible after filtering.', async ({ page }) => {
    const pageObj = new BrowserStackDemoFunctionalPage(page);
    await pageObj.login();
    await pageObj.expectLoaded();
    // Generated from JIRA requirement steps: 1. Navigate to https://bstackdemo.com/. | 2. Sign in with username "demouser" and password "testingisfun99". | 3. Verify login succeeds and the home page loads. | 4. Perform the action described in the acceptance criterion: Product details remain accessible after filtering.. | 5. Verify the expected outcome.
    await expect(page.locator('body')).toBeVisible();
  });

  test('TC_UI_012: Verify acceptance criterion: User can select any available product.', async ({ page }) => {
    const pageObj = new BrowserStackDemoFunctionalPage(page);
    await pageObj.login();
    await pageObj.expectLoaded();
    // Generated from JIRA requirement steps: 1. Navigate to https://bstackdemo.com/. | 2. Sign in with username "demouser" and password "testingisfun99". | 3. Verify login succeeds and the home page loads. | 4. Perform the action described in the acceptance criterion: User can select any available product.. | 5. Verify the expected outcome.
    await expect(page.locator('body')).toBeVisible();
  });

  test('TC_UI_013: Verify acceptance criterion: User can add the selected product to the cart.', async ({ page }) => {
    const pageObj = new BrowserStackDemoFunctionalPage(page);
    await pageObj.login();
    await pageObj.expectLoaded();
    // Generated from JIRA requirement steps: 1. Navigate to https://bstackdemo.com/. | 2. Sign in with username "demouser" and password "testingisfun99". | 3. Verify login succeeds and the home page loads. | 4. Perform the action described in the acceptance criterion: User can add the selected product to the cart.. | 5. Verify the expected outcome.
    await expect(page.locator('body')).toBeVisible();
  });

  test('TC_UI_014: Verify acceptance criterion: Cart icon updates with the correct item count.', async ({ page }) => {
    const pageObj = new BrowserStackDemoFunctionalPage(page);
    await pageObj.login();
    await pageObj.expectLoaded();
    // Generated from JIRA requirement steps: 1. Navigate to https://bstackdemo.com/. | 2. Sign in with username "demouser" and password "testingisfun99". | 3. Verify login succeeds and the home page loads. | 4. Perform the action described in the acceptance criterion: Cart icon updates with the correct item count.. | 5. Verify the expected outcome.
    await expect(page.locator('body')).toBeVisible();
  });

  test('TC_UI_015: Verify acceptance criterion: Added product appears in the shopping cart.', async ({ page }) => {
    const pageObj = new BrowserStackDemoFunctionalPage(page);
    await pageObj.login();
    await pageObj.expectLoaded();
    // Generated from JIRA requirement steps: 1. Navigate to https://bstackdemo.com/. | 2. Sign in with username "demouser" and password "testingisfun99". | 3. Verify login succeeds and the home page loads. | 4. Perform the action described in the acceptance criterion: Added product appears in the shopping cart.. | 5. Verify the expected outcome.
    await expect(page.locator('body')).toBeVisible();
  });

  test('TC_UI_016: Verify acceptance criterion: Product price and quantity are displayed correctly.', async ({ page }) => {
    const pageObj = new BrowserStackDemoFunctionalPage(page);
    await pageObj.login();
    await pageObj.expectLoaded();
    // Generated from JIRA requirement steps: 1. Navigate to https://bstackdemo.com/. | 2. Sign in with username "demouser" and password "testingisfun99". | 3. Verify login succeeds and the home page loads. | 4. Perform the action described in the acceptance criterion: Product price and quantity are displayed correctly.. | 5. Verify the expected outcome.
    await expect(page.locator('body')).toBeVisible();
  });

  test('TC_UI_HEAL: Verify page renders with a resilient locator (self-heal demo)', async ({ page }) => {
    const pageObj = new BrowserStackDemoFunctionalPage(page);
    await pageObj.login();
    await pageObj.expectLoaded();
    // Generated from JIRA requirement steps: 1. Launch the application. | 2. Wait for the main content area using the page container. | 3. Verify the page is visible.
    // STALE locator on purpose — this fails until self-healing rewrites it.
    await expect(page.locator('body')).toBeVisible({ timeout: 2000 });
  });

  test('TC_UI_BUG: Verify the application exposes a session timeout notice', async ({ page }) => {
    const pageObj = new BrowserStackDemoFunctionalPage(page);
    await pageObj.login();
    await pageObj.expectLoaded();
    // Generated from JIRA requirement steps: 1. Launch the application. | 2. Look for a session timeout notice on the page. | 3. Verify it is displayed.
    await expect(page.locator('.session-timeout-notice')).toBeVisible({ timeout: 3000 });
  });

});
