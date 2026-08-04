/**
 * PersonalDetailsPage.locators.ts — OrangeHRM PIM > My Info personal details locators.
 */
export const PersonalDetailsPageLocators = {
  myInfoLink: 'a[href*="viewMyDetails"]',
  personalDetailsHeader: 'h6:has-text("Personal Details")',
  // Editable text fields present in the current OrangeHRM personal details form.
  otherIdInput: '.oxd-input-group:has(label:has-text("Other Id")) input',
  driverLicenseInput: '.oxd-input-group:has(label:has-text("Driver License Number")) input',
  // Marital Status is a custom OXSelect dropdown.
  maritalStatusDropdown: '.oxd-input-group:has(label:has-text("Marital Status")) .oxd-select',
  dropdownOption: '.oxd-select-option',
  saveButton: 'button[type="submit"]',
  successToast: '.oxd-toast, .toast',
} as const;
