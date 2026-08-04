/**
 * LeavePage.locators.ts — OrangeHRM Leave module locators.
 */
export const LeavePageLocators = {
  leaveModuleLink: 'a[href*="viewLeaveModule"]',
  leaveListTable: '.oxd-table, table',
  applyLink: 'a:has-text("Apply")',
  leaveTypeDropdown: '.oxd-select',
  leaveTypeOption: '.oxd-select-option',
  fromDateInput: 'input[placeholder="yyyy-dd-mm"]',
  toDateInput: 'input[placeholder="yyyy-dd-mm"]',
  commentsInput: 'textarea',
  applySubmitButton: 'button[type="submit"]',
  successToast: '.oxd-toast, .toast',
} as const;
