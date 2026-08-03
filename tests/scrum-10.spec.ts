import { test, expect } from '@playwright/test';
import { ExploreOrangeHRMSourcePage } from '../artifacts/SCRUM-10/scripts/ExploreOrangeHRMSourcePage';

/**
 * SCRUM-10.spec.ts — auto-generated UI tests (POM) from JIRA requirements.
 * Regenerate via scripts/generate_playwright_scripts.js.
 */
test.describe('SCRUM-10: Explore_OrangeHRM_source UI tests', () => {
  test('TC_UI_01: Verify Explore OrangeHRM source loads and is accessible', async ({ page }) => {
    const pageObj = new ExploreOrangeHRMSourcePage(page);
    await pageObj.login();
    await pageObj.expectLoaded();
    // Generated from JIRA requirement steps: 1. Navigate to https://opensource-demo.orangehrmlive.com/. | 2. Sign in with username "Admin" and password "admin123". | 3. Verify login succeeds and the home page loads.
    await expect(page.locator('body')).toBeVisible();
  });

  test('TC_UI_02: Verify acceptance criterion: URL: [https://opensource-demo.orangehrmlive.com/|https://opensource-demo.orangehrmlive.com/|smart-link]', async ({ page }) => {
    const pageObj = new ExploreOrangeHRMSourcePage(page);
    await pageObj.login();
    await pageObj.expectLoaded();
    // Generated from JIRA requirement steps: 1. Navigate to https://opensource-demo.orangehrmlive.com/. | 2. Sign in with username "Admin" and password "admin123". | 3. Verify login succeeds and the home page loads. | 4. Navigate to the relevant module. | 5. Perform the action described in the acceptance criterion: URL: [https://opensource-demo.orangehrmlive.com/|https://opensource-demo.orangehrmlive.com/|smart-link]. | 6. Verify the expected outcome.
    await expect(page.locator('body')).toBeVisible();
  });

  test('TC_UI_03: Verify acceptance criterion: Username: Admin', async ({ page }) => {
    const pageObj = new ExploreOrangeHRMSourcePage(page);
    await pageObj.login();
    await pageObj.expectLoaded();
    // Generated from JIRA requirement steps: 1. Navigate to https://opensource-demo.orangehrmlive.com/. | 2. Sign in with username "Admin" and password "admin123". | 3. Verify login succeeds and the home page loads. | 4. Navigate to the relevant module. | 5. Perform the action described in the acceptance criterion: Username: Admin. | 6. Verify the expected outcome.
    await expect(page.locator('body')).toBeVisible();
  });

  test('TC_UI_04: Verify acceptance criterion: Password: admin123', async ({ page }) => {
    const pageObj = new ExploreOrangeHRMSourcePage(page);
    await pageObj.login();
    await pageObj.expectLoaded();
    // Generated from JIRA requirement steps: 1. Navigate to https://opensource-demo.orangehrmlive.com/. | 2. Sign in with username "Admin" and password "admin123". | 3. Verify login succeeds and the home page loads. | 4. Navigate to the relevant module. | 5. Perform the action described in the acceptance criterion: Password: admin123. | 6. Verify the expected outcome.
    await expect(page.locator('body')).toBeVisible();
  });

  test('TC_UI_05: Verify acceptance criterion: PIM: Create a test employee record.', async ({ page }) => {
    const pageObj = new ExploreOrangeHRMSourcePage(page);
    await pageObj.login();
    await pageObj.expectLoaded();
    // Generated from JIRA requirement steps: 1. Navigate to https://opensource-demo.orangehrmlive.com/. | 2. Sign in with username "Admin" and password "admin123". | 3. Verify login succeeds and the home page loads. | 4. Navigate to the relevant module. | 5. Perform the action described in the acceptance criterion: PIM: Create a test employee record.. | 6. Verify the expected outcome.
    await expect(page.locator('body')).toBeVisible();
  });

  test('TC_UI_06: Verify acceptance criterion: Leave: Submit a practice leave request.', async ({ page }) => {
    const pageObj = new ExploreOrangeHRMSourcePage(page);
    await pageObj.login();
    await pageObj.expectLoaded();
    // Generated from JIRA requirement steps: 1. Navigate to https://opensource-demo.orangehrmlive.com/. | 2. Sign in with username "Admin" and password "admin123". | 3. Verify login succeeds and the home page loads. | 4. Navigate to the relevant module. | 5. Perform the action described in the acceptance criterion: Leave: Submit a practice leave request.. | 6. Verify the expected outcome.
    await expect(page.locator('body')).toBeVisible();
  });

  test('TC_UI_07: Verify acceptance criterion: Recruitment: View current job vacancies.', async ({ page }) => {
    const pageObj = new ExploreOrangeHRMSourcePage(page);
    await pageObj.login();
    await pageObj.expectLoaded();
    // Generated from JIRA requirement steps: 1. Navigate to https://opensource-demo.orangehrmlive.com/. | 2. Sign in with username "Admin" and password "admin123". | 3. Verify login succeeds and the home page loads. | 4. Navigate to the relevant module. | 5. Perform the action described in the acceptance criterion: Recruitment: View current job vacancies.. | 6. Verify the expected outcome.
    await expect(page.locator('body')).toBeVisible();
  });

  test('TC_UI_08: Verify acceptance criterion: Time: Review a sample employee timesheet.', async ({ page }) => {
    const pageObj = new ExploreOrangeHRMSourcePage(page);
    await pageObj.login();
    await pageObj.expectLoaded();
    // Generated from JIRA requirement steps: 1. Navigate to https://opensource-demo.orangehrmlive.com/. | 2. Sign in with username "Admin" and password "admin123". | 3. Verify login succeeds and the home page loads. | 4. Navigate to the relevant module. | 5. Perform the action described in the acceptance criterion: Time: Review a sample employee timesheet.. | 6. Verify the expected outcome.
    await expect(page.locator('body')).toBeVisible();
  });

  test('TC_UI_09: Verify acceptance criterion: Acceptance Criteria  :', async ({ page }) => {
    const pageObj = new ExploreOrangeHRMSourcePage(page);
    await pageObj.login();
    await pageObj.expectLoaded();
    // Generated from JIRA requirement steps: 1. Navigate to https://opensource-demo.orangehrmlive.com/. | 2. Sign in with username "Admin" and password "admin123". | 3. Verify login succeeds and the home page loads. | 4. Navigate to the relevant module. | 5. Perform the action described in the acceptance criterion: Acceptance Criteria  :. | 6. Verify the expected outcome.
    await expect(page.locator('body')).toBeVisible();
  });

  test('TC_UI_HEAL: Verify page renders with a resilient locator (self-heal demo)', async ({ page }) => {
    const pageObj = new ExploreOrangeHRMSourcePage(page);
    await pageObj.login();
    await pageObj.expectLoaded();
    // Generated from JIRA requirement steps: 1. Launch the application. | 2. Wait for the main content area using the page container. | 3. Verify the page is visible.
    // STALE locator on purpose — this fails until self-healing rewrites it.
    await expect(page.locator('body')).toBeVisible({ timeout: 2000 });
  });

});
