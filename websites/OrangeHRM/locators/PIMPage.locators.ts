/**
 * PIMPage.locators.ts — OrangeHRM PIM module locators.
 */
export const PIMPageLocators = {
  pimModuleLink: 'a[href*="viewPimModule"]',
  addButton: 'button:has-text("Add")',
  firstNameInput: 'input[name="firstName"]',
  lastNameInput: 'input[name="lastName"]',
  employeeIdInput: '.oxd-input-group:has(label:has-text("Employee Id")) input, input[class*="employee"]',
  saveButton: 'button[type="submit"]',
  employeeTable: '.oxd-table, table',
  successToast: '.oxd-toast, .toast',
  employeeHeader: '.orangehrm-edit-employee, .oxd-topbar-header, h6:has-text("Personal Details")',
} as const;
