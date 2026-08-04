/**
 * RecruitmentPage.ts — OrangeHRM Recruitment module page object.
 */
import { Page } from '@playwright/test';
import { BasePage } from '../../../framework/base/BasePage';
import { RecruitmentPageLocators } from '../locators/RecruitmentPage.locators';

export class RecruitmentPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  /** Open the Recruitment module and verify the candidate/vacancy list. */
  async viewRecruitment(): Promise<void> {
    await this.element.click(this.page.locator(RecruitmentPageLocators.recruitmentModuleLink).first());
    await this.wait.waitForNetwork();
    await this.assertions.verifyVisible(this.page.locator(RecruitmentPageLocators.candidatesTable).first(), 'recruitment list');
  }
}
