import { Page } from '@playwright/test';

export class AdminPage {
  constructor(private page: Page) {}

  // Dynamic XPaths
  private adminMenu = "//span[text()='Admin']";
  private addButton = "//button[contains(., 'Add')]";
  private usernameSearchInput = "//label[text()='Username']/../../div[2]/input";
  private searchButton = "//button[@type='submit' and contains(., 'Search')]";

  async navigateToAdmin() {
    await this.page.click(this.adminMenu);
  }

  async searchUser(username: string) {
    await this.page.fill(this.usernameSearchInput, username);
    await this.page.click(this.searchButton);
  }
}
