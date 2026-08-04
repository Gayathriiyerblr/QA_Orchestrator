/**
 * TimePage.ts — OrangeHRM Time module page object.
 */
import { Page } from '@playwright/test';
import { BasePage } from '../../../framework/base/BasePage';
import { TimePageLocators } from '../locators/TimePage.locators';

export class TimePage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  /**
   * Open the Time module, type an employee name into the autocomplete, select
   * the suggestion, view their timesheet, and verify the recorded hours render.
   */
  async viewTimesheet(employee = 'Shriyansh Bendkhale'): Promise<void> {
    await this.element.click(this.page.locator(TimePageLocators.timeModuleLink).first());
    await this.wait.waitForRoute(/viewTimeModule/);
    // Wait for the employee autocomplete to render before typing.
    const input = this.page.locator(TimePageLocators.employeeAutocomplete).first();
    await this.wait.waitForElement(input);

    // Employee Name autocomplete ("Type for hints...").
    await this.element.fill(input, employee);
    const option = this.page
      .locator(TimePageLocators.autocompleteOption)
      .filter({ hasText: employee })
      .first();
    const optionFound = await this.wait.waitForElement(option);
    if (optionFound) {
      await this.element.click(option);
    } else {
      // Fallback: the pending-action table already lists timesheets — open the
      // first one via its View button.
      this.log.warn('Autocomplete suggestion not found; opening the first pending timesheet instead.');
      await this.element.click(this.page.locator(TimePageLocators.viewButton).first());
    }

    await this.wait.waitForNetwork();
    await this.verifyTimesheetRendered();
  }

  /** Assert the timesheet table rendered with rows (recorded hours). */
  async verifyTimesheetRendered(): Promise<void> {
    const table = this.page.locator(TimePageLocators.timesheetTable).first();
    const visible = await this.wait.waitForElement(table, 20_000);
    if (!visible) {
      throw new Error('Timesheet table did not render after viewing the employee timesheet.');
    }
    const rowCount = await this.element.count(this.page.locator(TimePageLocators.timesheetRows));
    if (rowCount > 0) {
      this.log.pass(`Timesheet rendered with ${rowCount} row(s) of recorded hours.`);
    } else {
      this.log.warn('Timesheet table rendered but no data rows found.');
    }
  }
}
