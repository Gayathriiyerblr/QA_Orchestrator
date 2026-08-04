/**
 * TableHelper.ts — reusable table interactions shared by every project.
 * clickRow / getCellValue / searchRow / deleteRow / editRow / verifyRowExists
 */
import { Locator, Page } from '@playwright/test';
import { ElementActions } from './ElementActions';

export class TableHelper {
  constructor(
    private readonly page: Page,
    private readonly element: ElementActions,
  ) {}

  /**
   * Build a locator for a row whose any cell contains `searchText`.
   * tableLocator is the <table> or .oxd-table locator.
   */
  rowContaining(tableLocator: Locator, searchText: string): Locator {
    return tableLocator
      .locator('tr, .oxd-table-row')
      .filter({ hasText: searchText })
      .first();
  }

  /** Click a row that contains the given text. */
  async clickRow(tableLocator: Locator, searchText: string): Promise<void> {
    await this.element.click(this.rowContaining(tableLocator, searchText));
  }

  /** Get the text of a cell (by 0-based column index) in a matching row. */
  async getCellValue(tableLocator: Locator, searchText: string, columnIndex: number): Promise<string> {
    const row = this.rowContaining(tableLocator, searchText);
    const cell = row.locator('td, .oxd-table-cell').nth(columnIndex);
    return this.element.getText(cell);
  }

  /** Return true if a row containing the text exists. */
  async rowExists(tableLocator: Locator, searchText: string): Promise<boolean> {
    const count = await tableLocator
      .locator('tr, .oxd-table-row')
      .filter({ hasText: searchText })
      .count();
    return count > 0;
  }

  /** Search a table (e.g. via a search input) and wait for results. */
  async searchRow(searchInput: Locator, searchText: string): Promise<void> {
    await this.element.fill(searchInput, searchText);
    await this.element.press(searchInput, 'Enter');
    await this.element.waitForPageSettle();
  }

  /** Click the delete action within a row (assumes a button matching `actionText`). */
  async deleteRow(tableLocator: Locator, searchText: string, actionText = 'Delete'): Promise<void> {
    const row = this.rowContaining(tableLocator, searchText);
    await this.element.click(row.locator(`button:has-text("${actionText}"), .oxd-icon-button:has-text("${actionText}")`).first());
  }

  /** Click the edit action within a row. */
  async editRow(tableLocator: Locator, searchText: string, actionText = 'Edit'): Promise<void> {
    const row = this.rowContaining(tableLocator, searchText);
    await this.element.click(row.locator(`button:has-text("${actionText}"), .oxd-icon-button:has-text("${actionText}")`).first());
  }
}
