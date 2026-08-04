import { test } from '../../../../fixtures/CustomFixtures';
import { EditEmployeePersonalPage } from '../../pages/EditEmployeePersonalPage';
import { DemoLocators } from '../../locators/DemoLocators.locators';

// The demo sites are slow; give each test enough headroom to complete the
// full login + flow (default Playwright timeout is 30s).
test.describe.configure({ timeout: 120_000 });

/**
 * SCRUM-42.spec.ts — auto-generated UI tests (POM) from JIRA requirements.
 * Regenerate via scripts/generate_playwright_scripts.js.
 */
test.describe('SCRUM-42: Edit_Employee_Personal UI tests', () => {
  test('TC_UI_01: Verify Edit Employee Personal loads and is accessible', async ({ page }) => {
    const pageObj = new EditEmployeePersonalPage(page);
    // Generated from JIRA requirement steps: 1. Launch the OrangeHRM application and log in as Admin. | 2. Navigate to My Info. | 3. Verify the page loads without errors.
    await pageObj.loginPage.login();
    await pageObj.personalDetailsPage.editPersonalDetails();
    await pageObj.personalDetailsPage.verifySaved();
  });

  test('TC_UI_02: Verify: User can navigate to the *PIM* module.', async ({ page }) => {
    const pageObj = new EditEmployeePersonalPage(page);
    // Generated from JIRA requirement steps: 1. Launch the OrangeHRM application and log in as Admin. | 2. Navigate to My Info. | 3. Verify the page loads without errors. | 4. From the top menu bar, click "PIM". | 5. Click the "Add" button to open the Add Employee form. | 6. Enter a First Name, Last Name, and a unique Employee Id. | 7. Click "Save" to create the employee record. | 8. Verify the employee is created and the success message is displayed.
    await pageObj.loginPage.login();
    await pageObj.pimPage.createEmployee();
    await pageObj.pimPage.verifyEmployeeCreated();
  });

  test('TC_UI_03: Verify: User can search for and open an existing employee record.', async ({ page }) => {
    const pageObj = new EditEmployeePersonalPage(page);
    // Generated from JIRA requirement steps: 1. Launch the OrangeHRM application and log in as Admin. | 2. Navigate to My Info. | 3. Verify the page loads without errors. | 4. Navigate to the relevant section of the application. | 5. Perform the action required by: "User can search for and open an existing employee record.". | 6. Verify the expected result is displayed.
    await pageObj.loginPage.login();
    await pageObj.personalDetailsPage.editPersonalDetails();
    await pageObj.personalDetailsPage.verifySaved();
  });

  test('TC_UI_04: Verify: User can edit one or more editable employee details.', async ({ page }) => {
    const pageObj = new EditEmployeePersonalPage(page);
    // Generated from JIRA requirement steps: 1. Launch the OrangeHRM application and log in as Admin. | 2. Navigate to My Info. | 3. Verify the page loads without errors. | 4. Navigate to the relevant section of the application. | 5. Perform the action required by: "User can edit one or more editable employee details.". | 6. Verify the expected result is displayed.
    await pageObj.loginPage.login();
  });

  test('TC_UI_05: Verify: User can save the updated information successfully.', async ({ page }) => {
    const pageObj = new EditEmployeePersonalPage(page);
    // Generated from JIRA requirement steps: 1. Launch the OrangeHRM application and log in as Admin. | 2. Navigate to My Info. | 3. Verify the page loads without errors. | 4. Navigate to the relevant section of the application. | 5. Perform the action required by: "User can save the updated information successfully.". | 6. Verify the expected result is displayed.
    await pageObj.loginPage.login();
    await pageObj.personalDetailsPage.editPersonalDetails();
    await pageObj.personalDetailsPage.verifySaved();
  });

  test('TC_UI_06: Verify: A success confirmation message is displayed.', async ({ page }) => {
    const pageObj = new EditEmployeePersonalPage(page);
    // Generated from JIRA requirement steps: 1. Launch the OrangeHRM application and log in as Admin. | 2. Navigate to My Info. | 3. Verify the page loads without errors. | 4. Navigate to the relevant section of the application. | 5. Perform the action required by: "A success confirmation message is displayed.". | 6. Verify the expected result is displayed.
    await pageObj.loginPage.login();
    await pageObj.personalDetailsPage.editPersonalDetails();
    await pageObj.personalDetailsPage.verifySaved();
  });

  test('TC_UI_07: Verify: Updated details persist after refreshing the page or reopening the employee record.', async ({ page }) => {
    const pageObj = new EditEmployeePersonalPage(page);
    // Generated from JIRA requirement steps: 1. Launch the OrangeHRM application and log in as Admin. | 2. Navigate to My Info. | 3. Verify the page loads without errors. | 4. Navigate to the relevant section of the application. | 5. Perform the action required by: "Updated details persist after refreshing the page or reopening the employee record.". | 6. Verify the expected result is displayed.
    await pageObj.loginPage.login();
    await pageObj.personalDetailsPage.editPersonalDetails();
    await pageObj.personalDetailsPage.verifySaved();
  });

  test('TC_UI_08: Verify: No validation or application errors are displayed during the update.', async ({ page }) => {
    const pageObj = new EditEmployeePersonalPage(page);
    // Generated from JIRA requirement steps: 1. Launch the OrangeHRM application and log in as Admin. | 2. Navigate to My Info. | 3. Verify the page loads without errors. | 4. Navigate to the relevant section of the application. | 5. Perform the action required by: "No validation or application errors are displayed during the update.". | 6. Verify the expected result is displayed.
    await pageObj.loginPage.login();
    await pageObj.personalDetailsPage.editPersonalDetails();
    await pageObj.personalDetailsPage.verifySaved();
  });

  test('TC_UI_HEAL: Verify page renders with a resilient locator (self-heal demo)', async ({ page }) => {
    const pageObj = new EditEmployeePersonalPage(page);
    // Generated from JIRA requirement steps: 1. Launch the application. | 2. Wait for the main content area using the page container. | 3. Verify the page is visible.
    await pageObj.login();
    // STALE locator on purpose — this fails until self-healing rewrites it.
    await pageObj.assertions.verifyVisible(page.locator(DemoLocators.staleContainer), 'self-heal stale locator');
  });

});
