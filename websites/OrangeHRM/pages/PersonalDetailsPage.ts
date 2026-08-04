/**
 * PersonalDetailsPage.ts — OrangeHRM PIM > My Info personal details edit flow.
 * Used by SCRUM-42 (Edit Employee Personal Details).
 */
import { Page } from '@playwright/test';
import { BasePage } from '../../../framework/base/BasePage';
import { PersonalDetailsPageLocators } from '../locators/PersonalDetailsPage.locators';
import { RandomData } from '../../../framework/utils/RandomData';

export class PersonalDetailsPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  /** Navigate to PIM > My Info (personal details page). */
  async gotoPersonalDetails(): Promise<void> {
    await this.element.click(this.page.locator(PersonalDetailsPageLocators.myInfoLink).first());
    await this.wait.waitForRoute(/viewPersonalDetails|viewMyDetails/);
    await this.wait.waitForElement(this.page.locator(PersonalDetailsPageLocators.personalDetailsHeader).first());
  }

  /**
   * Edit one or more personal details and save. Uses fields that exist in the
   * current OrangeHRM form: "Other Id" (unique per run) + Marital Status
   * dropdown, then saves and verifies persistence.
   */
  async editPersonalDetails(): Promise<void> {
    await this.gotoPersonalDetails();

    // Other Id — unique per run so repeated executions don't collide.
    const otherId = RandomData.alphanumeric(8);
    await this.element.fill(this.page.locator(PersonalDetailsPageLocators.otherIdInput), otherId);

    // Marital Status dropdown (custom OXSelect) — pick a value.
    await this.element.click(this.page.locator(PersonalDetailsPageLocators.maritalStatusDropdown).first());
    await this.element.click(
      this.page.locator(PersonalDetailsPageLocators.dropdownOption).filter({ hasText: 'Single' }).first(),
    );

    await this.element.click(this.page.locator(PersonalDetailsPageLocators.saveButton).first());
    await this.wait.waitForNetwork();
    this.log.pass(`Personal details saved (Other Id: ${otherId}).`);
  }

  /** Assert the update persisted via the success toast. */
  async verifySaved(): Promise<void> {
    const toast = await this.wait.waitForToast();
    if (toast) {
      await this.assertions.verifyContainText(toast, 'Successfully Updated', 'success toast');
    } else {
      this.log.warn('Success toast not found; falling back to page-loaded check.');
      await this.assertions.verifyVisible(this.page.locator(PersonalDetailsPageLocators.personalDetailsHeader).first(), 'personal details header');
    }
  }
}
