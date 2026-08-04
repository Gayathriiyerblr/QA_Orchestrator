import { test } from '../../../../fixtures/CustomFixtures';
import { BrowserStackDemoFunctionalPage } from '../../pages/BrowserStackDemoFunctionalPage';
import { DemoLocators } from '../../locators/DemoLocators.locators';

// The demo sites are slow; give each test enough headroom to complete the
// full login + flow (default Playwright timeout is 30s).
test.describe.configure({ timeout: 120_000 });

/**
 * SCRUM-32.spec.ts — auto-generated UI tests (POM) from JIRA requirements.
 * Regenerate via scripts/generate_playwright_scripts.js.
 */
test.describe('SCRUM-32: BrowserStack_Demo_Functional UI tests', () => {
  test('TC_UI_01: Verify BrowserStack Demo Functional loads and is accessible', async ({ page }) => {
    const pageObj = new BrowserStackDemoFunctionalPage(page);
    // Generated from JIRA requirement steps: 1. Navigate to https://bstackdemo.com/. | 2. Sign in with username "demouser" and password "testingisfun99". | 3. Verify login succeeds and the home page loads.
    await pageObj.loginPage.login();
  });

  test('TC_UI_02: Verify: User can navigate to the application.', async ({ page }) => {
    const pageObj = new BrowserStackDemoFunctionalPage(page);
    // Generated from JIRA requirement steps: 1. Navigate to https://bstackdemo.com/. | 2. Sign in with username "demouser" and password "testingisfun99". | 3. Verify login succeeds and the home page loads. | 4. Open the application URL in a browser. | 5. Wait for the home page to load completely. | 6. Verify the product listings and site header are visible.
    await pageObj.loginPage.login();
  });

  test('TC_UI_03: Verify: User can access the Sign In page.', async ({ page }) => {
    const pageObj = new BrowserStackDemoFunctionalPage(page);
    // Generated from JIRA requirement steps: 1. Navigate to https://bstackdemo.com/. | 2. Sign in with username "demouser" and password "testingisfun99". | 3. Verify login succeeds and the home page loads. | 4. On the home page, locate the "Sign In" link in the header. | 5. Click "Sign In". | 6. Verify the Sign In page loads with Username and Password fields.
    await pageObj.loginPage.login();
    await pageObj.loginPage.openSignInPage();
    await pageObj.loginPage.verifySignInPageLoaded();
  });

  test('TC_UI_04: Verify: User can log in using valid demo credentials.', async ({ page }) => {
    const pageObj = new BrowserStackDemoFunctionalPage(page);
    // Generated from JIRA requirement steps: 1. Navigate to https://bstackdemo.com/. | 2. Sign in with username "demouser" and password "testingisfun99". | 3. Verify login succeeds and the home page loads. | 4. On the Sign In page, click the "Username" dropdown and select a valid demo user. | 5. Click the "Password" dropdown and select the matching demo password. | 6. Click "Log In". | 7. Verify the user is redirected to the home page.
    await pageObj.loginPage.login();
    await pageObj.loginPage.signIn('demouser', 'testingisfun99');
    await pageObj.loginPage.verifyLoggedInUser('demouser');
  });

  test('TC_UI_05: Verify: No authentication errors are displayed.', async ({ page }) => {
    const pageObj = new BrowserStackDemoFunctionalPage(page);
    // Generated from JIRA requirement steps: 1. Navigate to https://bstackdemo.com/. | 2. Sign in with username "demouser" and password "testingisfun99". | 3. Verify login succeeds and the home page loads. | 4. After logging in with valid credentials, check for error banners or alerts. | 5. Verify no authentication error message is displayed.
    await pageObj.loginPage.login();
    await pageObj.loginPage.signIn('demouser', 'testingisfun99');
    await pageObj.loginPage.verifyNoAuthErrors();
  });

  test('TC_UI_06: Verify: User can search for a product using the search functionality.', async ({ page }) => {
    const pageObj = new BrowserStackDemoFunctionalPage(page);
    // Generated from JIRA requirement steps: 1. Navigate to https://bstackdemo.com/. | 2. Sign in with username "demouser" and password "testingisfun99". | 3. Verify login succeeds and the home page loads. | 4. Locate the search box on the home page. | 5. Type a product name (e.g. "iPhone") and submit the search. | 6. Verify matching products are displayed in the results.
    await pageObj.loginPage.login();
    await pageObj.productPage.searchProduct('iPhone');
    await pageObj.productPage.verifyResultsShown();
  });

  test('TC_UI_07: Verify: User can filter products by brand.', async ({ page }) => {
    const pageObj = new BrowserStackDemoFunctionalPage(page);
    // Generated from JIRA requirement steps: 1. Navigate to https://bstackdemo.com/. | 2. Sign in with username "demouser" and password "testingisfun99". | 3. Verify login succeeds and the home page loads. | 4. Locate the brand filter on the product listing page. | 5. Select a brand (e.g. "Apple"). | 6. Verify the product list updates to show only that brand.
    await pageObj.loginPage.login();
    await pageObj.productPage.filterByBrand('Apple');
    await pageObj.productPage.verifyResultsShown();
  });

  test('TC_UI_08: Verify: Filtered products are displayed correctly.', async ({ page }) => {
    const pageObj = new BrowserStackDemoFunctionalPage(page);
    // Generated from JIRA requirement steps: 1. Navigate to https://bstackdemo.com/. | 2. Sign in with username "demouser" and password "testingisfun99". | 3. Verify login succeeds and the home page loads. | 4. Apply a brand or category filter. | 5. Inspect each product card in the results. | 6. Verify all displayed products match the applied filter.
    await pageObj.loginPage.login();
    await pageObj.productPage.filterByBrand('Apple');
    await pageObj.productPage.verifyResultsShown();
  });

  test('TC_UI_09: Verify: Search and filter results are updated without page errors.', async ({ page }) => {
    const pageObj = new BrowserStackDemoFunctionalPage(page);
    // Generated from JIRA requirement steps: 1. Navigate to https://bstackdemo.com/. | 2. Sign in with username "demouser" and password "testingisfun99". | 3. Verify login succeeds and the home page loads. | 4. Perform a search and then apply a brand filter. | 5. Watch the results area as it updates. | 6. Verify the results update in place with no page errors or console errors.
    await pageObj.loginPage.login();
    await pageObj.productPage.searchProduct('iPhone');
    await pageObj.productPage.filterByBrand('Apple');
    await pageObj.productPage.verifyResultsShown();
  });

  test('TC_UI_010: Verify: Product details remain accessible after filtering.', async ({ page }) => {
    const pageObj = new BrowserStackDemoFunctionalPage(page);
    // Generated from JIRA requirement steps: 1. Navigate to https://bstackdemo.com/. | 2. Sign in with username "demouser" and password "testingisfun99". | 3. Verify login succeeds and the home page loads. | 4. Apply a brand filter to the product list. | 5. Click on any filtered product card. | 6. Verify the product detail page opens and shows full details.
    await pageObj.loginPage.login();
    await pageObj.productPage.filterByBrand('Apple');
    await pageObj.productPage.openFirstProduct();
    await pageObj.productPage.verifyProductDetails();
  });

  test('TC_UI_011: Verify: User can select any available product.', async ({ page }) => {
    const pageObj = new BrowserStackDemoFunctionalPage(page);
    // Generated from JIRA requirement steps: 1. Navigate to https://bstackdemo.com/. | 2. Sign in with username "demouser" and password "testingisfun99". | 3. Verify login succeeds and the home page loads. | 4. From the product listing, click on a product card. | 5. Verify the product detail page opens. | 6. Verify the product name, price, and image are displayed.
    await pageObj.loginPage.login();
    await pageObj.productPage.openFirstProduct();
    await pageObj.productPage.verifyProductDetails();
  });

  test('TC_UI_012: Verify: User can add the selected product to the cart.', async ({ page }) => {
    const pageObj = new BrowserStackDemoFunctionalPage(page);
    // Generated from JIRA requirement steps: 1. Navigate to https://bstackdemo.com/. | 2. Sign in with username "demouser" and password "testingisfun99". | 3. Verify login succeeds and the home page loads. | 4. On a product detail page, click "Add to Cart". | 5. Verify the product is added without errors.
    await pageObj.loginPage.login();
    await pageObj.productPage.openFirstProduct();
    await pageObj.cartPage.addToCart();
  });

  test('TC_UI_013: Verify: Cart icon updates with the correct item count.', async ({ page }) => {
    const pageObj = new BrowserStackDemoFunctionalPage(page);
    // Generated from JIRA requirement steps: 1. Navigate to https://bstackdemo.com/. | 2. Sign in with username "demouser" and password "testingisfun99". | 3. Verify login succeeds and the home page loads. | 4. Add a product to the cart. | 5. Inspect the cart icon in the header. | 6. Verify the cart icon shows the correct item count.
    await pageObj.loginPage.login();
    await pageObj.productPage.openFirstProduct();
    await pageObj.cartPage.addToCart();
    await pageObj.cartPage.verifyCartCount(1);
  });

  test('TC_UI_014: Verify: Added product appears in the shopping cart.', async ({ page }) => {
    const pageObj = new BrowserStackDemoFunctionalPage(page);
    // Generated from JIRA requirement steps: 1. Navigate to https://bstackdemo.com/. | 2. Sign in with username "demouser" and password "testingisfun99". | 3. Verify login succeeds and the home page loads. | 4. Add a product to the cart. | 5. Open the shopping cart. | 6. Verify the added product appears in the cart list.
    await pageObj.loginPage.login();
    await pageObj.productPage.openFirstProduct();
    await pageObj.cartPage.addToCart();
    await pageObj.cartPage.openCart();
    await pageObj.cartPage.verifyProductInCart('iPhone');
  });

  test('TC_UI_015: Verify: Product price and quantity are displayed correctly.', async ({ page }) => {
    const pageObj = new BrowserStackDemoFunctionalPage(page);
    // Generated from JIRA requirement steps: 1. Navigate to https://bstackdemo.com/. | 2. Sign in with username "demouser" and password "testingisfun99". | 3. Verify login succeeds and the home page loads. | 4. Open the shopping cart containing the added product. | 5. Verify the product price matches the listing price. | 6. Verify the quantity is displayed correctly.
    await pageObj.loginPage.login();
    await pageObj.productPage.openFirstProduct();
    await pageObj.cartPage.addToCart();
    await pageObj.cartPage.openCart();
    await pageObj.cartPage.verifyProductInCart("iPhone");
    await pageObj.cartPage.verifyCartPrice("$");
  });

  test('TC_UI_HEAL: Verify page renders with a resilient locator (self-heal demo)', async ({ page }) => {
    const pageObj = new BrowserStackDemoFunctionalPage(page);
    // Generated from JIRA requirement steps: 1. Launch the application. | 2. Wait for the main content area using the page container. | 3. Verify the page is visible.
    await pageObj.login();
    // STALE locator on purpose — this fails until self-healing rewrites it.
    await pageObj.assertions.verifyVisible(page.locator(DemoLocators.staleContainer), 'self-heal stale locator');
  });

  test('TC_UI_BUG: Verify the application exposes a session timeout notice', async ({ page }) => {
    const pageObj = new BrowserStackDemoFunctionalPage(page);
    // Generated from JIRA requirement steps: 1. Launch the application. | 2. Look for a session timeout notice on the page. | 3. Verify it is displayed.
    await pageObj.login();
    await pageObj.assertions.verifyVisible(page.locator(DemoLocators.sessionTimeoutNotice), 'session timeout notice');
  });

});
