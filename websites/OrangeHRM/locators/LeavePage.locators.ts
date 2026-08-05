/**
 * LeavePage.locators.ts — OrangeHRM Leave module locators.
 */
export const LeavePageLocators = {
  leaveModuleLink: 'a[href*="viewLeaveModule"]',
  leaveListTable: '.oxd-table, table',
  applyLink: 'a:has-text("Apply")',
  leaveListLink: 'a[href*="viewLeaveList"], a:has-text("Leave List")',
  myLeaveLink: 'a[href*="viewMyLeave"], a:has-text("My Leave")',
  leaveTypeDropdown: '.oxd-select',
  leaveTypeOption: '.oxd-select-option',
  fromDateInput: 'input[placeholder="yyyy-dd-mm"]',
  toDateInput: 'input[placeholder="yyyy-dd-mm"]',
  commentsInput: 'textarea',
  applySubmitButton: 'button[type="submit"]',
  successToast: '.oxd-toast, .toast',
} as const;
