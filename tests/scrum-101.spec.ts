import { test, expect } from '@playwright/test';
import { ProfilePage } from '../artifacts/SCRUM-101/scripts/ProfilePage';

test.describe('SCRUM-101: Profile Management - Personal Details', () => {
  let profilePage: ProfilePage;

  test.beforeEach(async ({ page }) => {
    // Basic Login (Assuming credentials or session handle)
    await page.goto('https://opensource-demo.orangehrmlive.com/web/index.php/auth/login');
    await page.fill('input[name="username"]', 'Admin');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    profilePage = new ProfilePage(page);
    await profilePage.navigateToMyInfo();
  });

  test('TC_UI_01: Update Personal Details Success', async ({ page }) => {
    await profilePage.updateNickname('AI_Orchestrator');
    // Verify success message
    await expect(page.locator('text=Successfully Updated')).toBeVisible();
  });

  test('TC_UI_02: Attempt Save without Changes', async ({ page }) => {
    await page.click("//button[@type='submit' and contains(., 'Save')]");
    // Verify no error message
    const error = page.locator('.oxd-input-group__message');
    await expect(error).not.toBeVisible();
  });

  test('TC_UI_03: Validation on Long Nickname', async ({ page }) => {
    const longName = 'A'.repeat(201);
    await profilePage.updateNickname(longName);
    // Verify validation error
    await expect(page.locator('text=Should not exceed 200 characters')).toBeVisible();
  });
});
