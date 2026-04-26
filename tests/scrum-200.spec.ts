import { test, expect } from '@playwright/test';

test.describe('SCRUM-200: Admin - User Management', () => {
  test('User Life Cycle: Search and Filter', async ({ page }) => {
    // 1. Navigate and Login
    await page.goto('https://opensource-demo.orangehrmlive.com/web/index.php/auth/login');
    await page.fill('input[name="username"]', 'Admin');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');

    // 2. Go to Admin -> User Management
    await page.click('text=Admin');
    await expect(page).toHaveURL(/admin\/viewSystemUsers/);

    // 3. Perform a Search
    await page.fill('.oxd-input-group:has-text("Username") input', 'Admin');
    await page.click('button[type="submit"]');

    // 4. Verify results
    await expect(page.locator('.oxd-table-body')).toBeVisible();
    console.log('Search completed successfully.');
  });
});
