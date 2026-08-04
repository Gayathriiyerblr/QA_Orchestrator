import { test } from '../../../../fixtures/CustomFixtures';
import { ExploreOrangeHRMSourcePage } from '../../pages/ExploreOrangeHRMSourcePage';
import { DemoLocators } from '../../locators/DemoLocators.locators';

// The demo sites are slow; give each test enough headroom to complete the
// full login + flow (default Playwright timeout is 30s).
test.describe.configure({ timeout: 120_000 });

/**
 * SCRUM-10.spec.ts — auto-generated UI tests (POM) from JIRA requirements.
 * Regenerate via scripts/generate_playwright_scripts.js.
 */
test.describe('SCRUM-10: Explore_OrangeHRM_source UI tests', () => {
  test('TC_UI_01: Verify Explore OrangeHRM source loads and is accessible', async ({ page }) => {
    const pageObj = new ExploreOrangeHRMSourcePage(page);
    // Generated from JIRA requirement steps: 1. Navigate to https://opensource-demo.orangehrmlive.com/. | 2. Sign in with username "Admin" and password "admin123". | 3. Verify login succeeds and the home page loads.
    await pageObj.loginPage.login();
  });

  test('TC_UI_02: Verify: PIM: Create a test employee record.', async ({ page }) => {
    const pageObj = new ExploreOrangeHRMSourcePage(page);
    // Generated from JIRA requirement steps: 1. Navigate to https://opensource-demo.orangehrmlive.com/. | 2. Sign in with username "Admin" and password "admin123". | 3. Verify login succeeds and the home page loads. | 4. From the top menu bar, click "PIM". | 5. Click the "Add" button to open the Add Employee form. | 6. Enter a First Name, Last Name, and a unique Employee Id. | 7. Click "Save" to create the employee record. | 8. Verify the employee is created and the success message is displayed.
    await pageObj.loginPage.login();
    await pageObj.pimPage.createEmployee();
    await pageObj.pimPage.verifyEmployeeCreated();
  });

  test('TC_UI_03: Verify: Leave: Submit a practice leave request.', async ({ page }) => {
    const pageObj = new ExploreOrangeHRMSourcePage(page);
    // Generated from JIRA requirement steps: 1. Navigate to https://opensource-demo.orangehrmlive.com/. | 2. Sign in with username "Admin" and password "admin123". | 3. Verify login succeeds and the home page loads. | 4. From the top menu bar, click "Leave". | 5. Click "Apply" and select the Leave Type, From Date, and To Date. | 6. Add any comments and click "Apply". | 7. Verify the leave request is submitted successfully.
    await pageObj.loginPage.login();
    await pageObj.leavePage.applyLeave('CAN - Personal', 'Automated leave request');
  });

  test('TC_UI_04: Verify: Recruitment: View current job vacancies.', async ({ page }) => {
    const pageObj = new ExploreOrangeHRMSourcePage(page);
    // Generated from JIRA requirement steps: 1. Navigate to https://opensource-demo.orangehrmlive.com/. | 2. Sign in with username "Admin" and password "admin123". | 3. Verify login succeeds and the home page loads. | 4. From the top menu bar, click "Recruitment". | 5. Navigate to the "Candidates" or "Vacancies" section. | 6. Verify the current job vacancies and candidate list are displayed.
    await pageObj.loginPage.login();
    await pageObj.recruitmentPage.viewRecruitment();
  });

  test('TC_UI_05: Verify: Time: Review a sample employee timesheet.', async ({ page }) => {
    const pageObj = new ExploreOrangeHRMSourcePage(page);
    // Generated from JIRA requirement steps: 1. Navigate to https://opensource-demo.orangehrmlive.com/. | 2. Sign in with username "Admin" and password "admin123". | 3. Verify login succeeds and the home page loads. | 4. From the top menu bar, click "Time". | 5. Open "Timesheets" and select an employee. | 6. Verify the timesheet is displayed with the recorded hours.
    await pageObj.loginPage.login();
    await pageObj.timePage.viewTimesheet('Orange Test');
  });

  test('TC_UI_HEAL: Verify page renders with a resilient locator (self-heal demo)', async ({ page }) => {
    const pageObj = new ExploreOrangeHRMSourcePage(page);
    // Generated from JIRA requirement steps: 1. Launch the application. | 2. Wait for the main content area using the page container. | 3. Verify the page is visible.
    await pageObj.login();
    // STALE locator on purpose — this fails until self-healing rewrites it.
    await pageObj.assertions.verifyVisible(page.locator(DemoLocators.staleContainer), 'self-heal stale locator');
  });

});
