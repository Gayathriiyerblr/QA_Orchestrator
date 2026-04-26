# Jira Bug Report

## Bug Ticket: SCRUM-BUG-001 (Mocked)
**Title:** Search Reset Button Timeout on Employee List Page
**Priority:** High
**Environment:** Automated Playwright Execution, Chrome (Headless)

### Description
During the automated execution of the Employee search workflow, the script timed out after 30000ms while attempting to locate and click the "Reset" button on the PIM Employee List page.

### Steps to Reproduce
1. Log into OrangeHRM as Admin.
2. Navigate to PIM -> Employee List.
3. Search for an Employee ID.
4. Attempt to click the "Reset" button to clear the form.

### Expected Result
The "Reset" button should be clickable, and the form should be cleared for the next search.

### Actual Result
The locator `button[type="button"]:has-text("Reset")` could not be found or was not clickable within the 30-second timeout.

### Attachments
- [Screenshot of the error state](file:///d:/end%20to%20end%20orchestration/artifacts/bug_screenshot.png)
