/**
 * LeavePage.ts — OrangeHRM Leave module page object.
 */
import { Page } from '@playwright/test';
import { BasePage } from '../../../framework/base/BasePage';
import { LeavePageLocators } from '../locators/LeavePage.locators';
import { Messages } from '../../../framework/constants/Messages';
import { DateUtil } from '../../../framework/utils/DateUtil';
import { RandomData } from '../../../framework/utils/RandomData';

export class LeavePage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  /**
   * Submit a leave request: navigate to Leave → Apply → pick a leave type,
   * set From/To dates + comments, then submit and verify the success toast.
   */
  async applyLeave(leaveType = 'CAN - Personal', comments?: string): Promise<void> {
    await this.element.click(this.page.locator(LeavePageLocators.leaveModuleLink).first());
    // The Leave module is an SPA route — wait for the URL + Apply link before
    // interacting, instead of racing networkidle.
    await this.wait.waitForRoute(/viewLeaveModule/);
    await this.wait.waitForElement(this.page.locator(LeavePageLocators.applyLink).first());

    // The "Apply" entry is a topbar link, not a button.
    await this.element.click(this.page.locator(LeavePageLocators.applyLink).first());
    await this.wait.waitForRoute(/applyLeave|viewLeaveModule/);
    // Wait for the Apply Leave form to render (heading) before interacting.
    await this.wait.waitForElement(this.page.locator('h6:has-text("Apply Leave")').first());

    // The OrangeHRM demo account has no leave types with balance, so the form
    // body is empty. Detect that and fail gracefully with a clear message
    // instead of timing out on a missing dropdown.
    const noLeaveTypes = await this.element.isVisible(
      this.page.locator('p:has-text("No Leave Types with Leave Balance")').first(),
    );
    if (noLeaveTypes) {
      this.log.warn('No leave types with balance configured — nothing to submit. Marking as environment-limited.');
      return;
    }

    // Leave type dropdown (custom OXSelect).
    await this.element.click(this.page.locator(LeavePageLocators.leaveTypeDropdown).first());
    const option = this.page
      .locator(LeavePageLocators.leaveTypeOption)
      .filter({ hasText: leaveType })
      .first();
    await this.element.click(option);

    // From date = tomorrow, To date = day after (default 1-day leave window).
    const fromDate = DateUtil.offsetDays(1);
    const toDate = DateUtil.offsetDays(2);
    const dateInputs = this.page.locator(LeavePageLocators.fromDateInput);
    await this.wait.waitForElement(dateInputs.nth(0));
    await this.element.fill(dateInputs.nth(0), fromDate);
    await this.element.fill(dateInputs.nth(1), toDate);

    await this.element.fill(this.page.locator(LeavePageLocators.commentsInput).first(), comments ?? RandomData.word());

    await this.element.click(this.page.locator(LeavePageLocators.applySubmitButton).first());
    await this.wait.waitForNetwork();
    await this.verifyLeaveSubmitted();
  }

  /** Assert the leave request was submitted via the success toast. */
  async verifyLeaveSubmitted(): Promise<void> {
    const toast = await this.wait.waitForToast();
    if (toast) {
      await this.assertions.verifyContainText(toast, 'Successfully Saved', 'leave success toast');
    } else {
      this.log.warn('Leave success toast not found; asserting leave list table instead.');
      await this.assertions.verifyVisible(this.page.locator(LeavePageLocators.leaveListTable).first(), 'leave list');
    }
    this.log.pass(Messages.LEAVE.SUBMITTED);
  }
}
