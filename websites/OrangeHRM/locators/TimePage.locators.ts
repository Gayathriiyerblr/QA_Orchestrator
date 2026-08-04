/**
 * TimePage.locators.ts — OrangeHRM Time module locators.
 */
export const TimePageLocators = {
  timeModuleLink: 'a[href*="viewTimeModule"]',
  timesheetTable: '.oxd-table, table',
  employeeAutocomplete: 'input[placeholder="Type for hints..."]',
  autocompleteOption: '.oxd-autocomplete-option, [role="option"]',
  viewButton: 'button:has-text("View")',
  timesheetRows: '.oxd-table-body .oxd-table-row',
  pageBody: 'body',
} as const;
