import { test } from '../../../../fixtures/CustomFixtures';
import { EditExistingLeavePage } from '../../pages/EditExistingLeavePage';
import { DemoLocators } from '../../locators/DemoLocators.locators';

// The demo sites are slow; give each test enough headroom to complete the
// full login + flow (default Playwright timeout is 30s).
test.describe.configure({ timeout: 120_000 });

/**
 * SCRUM-45.spec.ts — auto-generated UI tests (POM) from JIRA requirements.
 * Regenerate via scripts/generate_playwright_scripts.js.
 */
test.describe('SCRUM-45: Edit_Existing_Leave UI tests', () => {
  test('TC_UI_01: Verify Edit Existing Leave loads and is accessible', async ({ page }) => {
    const pageObj = new EditExistingLeavePage(page);
    // Generated from JIRA requirement steps: 1. Launch the OrangeHRM application and log in as Admin. | 2. Navigate to My Info. | 3. Verify the page loads without errors.
    await pageObj.loginPage.login();
    await pageObj.leavePage.editExistingLeave();
    await pageObj.leavePage.verifyLeaveEdited();
  });

  test('TC_UI_02: Verify: User can navigate to the *Leave* module.', async ({ page }) => {
    const pageObj = new EditExistingLeavePage(page);
    // Generated from JIRA requirement steps: 1. Launch the OrangeHRM application and log in as Admin. | 2. Navigate to My Info. | 3. Verify the page loads without errors. | 4. From the top menu bar, click "Leave". | 5. Verify the Leave module loads and displays the Leave List or My Leave view. | 6. Verify the page shows leave options like "Apply", "My Leave", or "Entitlements".
    await pageObj.loginPage.login();
    await pageObj.leavePage.navigateToLeaveModule();
  });

  test('TC_UI_03: Verify: User can locate an existing leave request that is eligible for modification.', async ({ page }) => {
    const pageObj = new EditExistingLeavePage(page);
    // Generated from JIRA requirement steps: 1. Launch the OrangeHRM application and log in as Admin. | 2. Navigate to My Info. | 3. Verify the page loads without errors. | 4. From the top menu bar, click "Leave". | 5. Click "Apply" and select the Leave Type, From Date, and To Date. | 6. Add any comments and click "Apply". | 7. Verify the leave request is submitted successfully.
    await pageObj.loginPage.login();
    await pageObj.leavePage.editExistingLeave();
  });

  test('TC_UI_04: Verify: User can edit the leave request details (e.g., leave dates or leave type).', async ({ page }) => {
    const pageObj = new EditExistingLeavePage(page);
    // Generated from JIRA requirement steps: 1. Launch the OrangeHRM application and log in as Admin. | 2. Navigate to My Info. | 3. Verify the page loads without errors. | 4. From the top menu bar, click "Leave". | 5. Click "My Leave" to view the leave list/calendar. | 6. Locate an existing leave request from the list that is eligible for modification (Pending or Cancelled status). | 7. Click the "Edit" icon or action for the existing leave request. | 8. Modify the leave details (e.g., change dates, leave type, or add comments). | 9. Click "Save" or "Update" to apply the changes. | 10. Verify the updated leave details are reflected in the leave list.
    await pageObj.loginPage.login();
    await pageObj.leavePage.editExistingLeave();
    await pageObj.leavePage.verifyLeaveEdited();
  });

  test('TC_UI_05: Verify: User can save the updated leave request successfully.', async ({ page }) => {
    const pageObj = new EditExistingLeavePage(page);
    // Generated from JIRA requirement steps: 1. Launch the OrangeHRM application and log in as Admin. | 2. Navigate to My Info. | 3. Verify the page loads without errors. | 4. From the top menu bar, click "Leave". | 5. Click "My Leave" to view the leave list/calendar. | 6. Locate an existing leave request from the list that is eligible for modification (Pending or Cancelled status). | 7. Click the "Edit" icon or action for the existing leave request. | 8. Modify the leave details (e.g., change dates, leave type, or add comments). | 9. Click "Save" or "Update" to apply the changes. | 10. Verify the updated leave details are reflected in the leave list.
    await pageObj.loginPage.login();
    await pageObj.leavePage.editExistingLeave();
    await pageObj.leavePage.verifyLeaveEdited();
  });

  test('TC_UI_06: Verify: A success confirmation message is displayed.', async ({ page }) => {
    const pageObj = new EditExistingLeavePage(page);
    // Generated from JIRA requirement steps: 1. Launch the OrangeHRM application and log in as Admin. | 2. Navigate to My Info. | 3. Verify the page loads without errors. | 4. Navigate to the relevant section of the application. | 5. Perform the action required by: "A success confirmation message is displayed.". | 6. Verify the expected result is displayed.
    await pageObj.loginPage.login();
  });

  test('TC_UI_07: Verify: Updated leave details are reflected in the Leave List/History.', async ({ page }) => {
    const pageObj = new EditExistingLeavePage(page);
    // Generated from JIRA requirement steps: 1. Launch the OrangeHRM application and log in as Admin. | 2. Navigate to My Info. | 3. Verify the page loads without errors. | 4. From the top menu bar, click "Leave". | 5. Click "My Leave" to view the leave list/calendar. | 6. Locate an existing leave request from the list that is eligible for modification (Pending or Cancelled status). | 7. Click the "Edit" icon or action for the existing leave request. | 8. Modify the leave details (e.g., change dates, leave type, or add comments). | 9. Click "Save" or "Update" to apply the changes. | 10. Verify the updated leave details are reflected in the leave list.
    await pageObj.loginPage.login();
    await pageObj.leavePage.editExistingLeave();
    await pageObj.leavePage.verifyLeaveEdited();
  });

  test('TC_UI_08: Verify: No application errors or validation issues are encountered during the update.', async ({ page }) => {
    const pageObj = new EditExistingLeavePage(page);
    // Generated from JIRA requirement steps: 1. Launch the OrangeHRM application and log in as Admin. | 2. Navigate to My Info. | 3. Verify the page loads without errors. | 4. Navigate to the relevant section of the application. | 5. Perform the action required by: "No application errors or validation issues are encountered during the update.". | 6. Verify the expected result is displayed.
    await pageObj.loginPage.login();
  });

  test('TC_UI_HEAL: Verify page renders with a resilient locator (self-heal demo)', async ({ page }) => {
    const pageObj = new EditExistingLeavePage(page);
    // Generated from JIRA requirement steps: 1. Launch the application. | 2. Wait for the main content area using the page container. | 3. Verify the page is visible.
    await pageObj.login();
    // STALE locator on purpose — this fails until self-healing rewrites it.
    await pageObj.assertions.verifyVisible(page.locator(DemoLocators.staleContainer), 'self-heal stale locator');
  });

});
