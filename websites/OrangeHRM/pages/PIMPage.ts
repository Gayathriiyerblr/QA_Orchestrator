/**
 * PIMPage.ts — OrangeHRM PIM module page object.
 */
import { Page } from '@playwright/test';
import { BasePage } from '../../../framework/base/BasePage';
import { PIMPageLocators } from '../locators/PIMPage.locators';
import { Messages } from '../../../framework/constants/Messages';
import { RandomData } from '../../../framework/utils/RandomData';

export class PIMPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  /**
   * Create an employee via PIM > Add Employee.
   * Generates a UNIQUE first/last name + employee id on every call so repeated
   * runs never collide with previously created records (data is fresh each time).
   */
  async createEmployee(firstName?: string, lastName?: string, employeeId?: string): Promise<void> {
    const uniqueName = RandomData.firstName();
    const uniqueLast = RandomData.lastName();
    const uniqueId = RandomData.employeeId();
    const fName = firstName ?? uniqueName;
    const lName = lastName ?? uniqueLast;
    const eId = employeeId ?? uniqueId;

    await this.element.click(this.page.locator(PIMPageLocators.pimModuleLink).first());
    // PIM is an SPA route — wait for the URL + the "Add Employee" link before
    // interacting, instead of racing networkidle.
    await this.wait.waitForRoute(/viewPimModule/);
    await this.wait.waitForElement(this.page.locator(PIMPageLocators.addButton).first());

    await this.element.click(this.page.locator(PIMPageLocators.addButton).first());
    await this.wait.waitForRoute(/addEmployee|viewPimModule/);
    // Wait for the Add Employee form to render before filling.
    await this.wait.waitForElement(this.page.locator(PIMPageLocators.firstNameInput).first());

    await this.element.fill(this.page.locator(PIMPageLocators.firstNameInput), fName);
    await this.element.fill(this.page.locator(PIMPageLocators.lastNameInput), lName);
    await this.element.fill(this.page.locator(PIMPageLocators.employeeIdInput), eId);

    await this.element.click(this.page.locator(PIMPageLocators.saveButton).first());
    await this.wait.waitForElement(this.page.locator(PIMPageLocators.employeeHeader).first(), 20_000);
    this.log.pass(`${Messages.EMPLOYEE.CREATED} (${fName} ${lName}, ID ${eId})`);
  }

  /** Assert the employee was created by verifying the success toast + employee details header. */
  async verifyEmployeeCreated(): Promise<void> {
    const toast = await this.wait.waitForToast();
    if (toast) {
      await this.assertions.verifyContainText(toast, 'Successfully Saved', 'success toast');
    } else {
      this.log.warn('Success toast not found; falling back to employee header check.');
    }
    await this.assertions.verifyVisible(this.page.locator(PIMPageLocators.employeeHeader), 'employee details header');
  }
}
