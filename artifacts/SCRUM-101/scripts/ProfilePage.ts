import { Page } from '@playwright/test';

export class ProfilePage {
  constructor(private page: Page) {}

  // Dynamic XPath locators
  private myInfoLink = "//span[text()='My Info']";
  private nicknameInput = "//input[@name='middleName']"; // AI-Healed: Was //label[text()='Nickname']/../../div[2]/input
  private saveButton = "//button[@type='submit' and contains(., 'Save')]";

  async navigateToMyInfo() {
    await this.page.click(this.myInfoLink);
  }

  async updateNickname(name: string) {
    await this.page.fill(this.nicknameInput, name);
    await this.page.click(this.saveButton);
  }
}
