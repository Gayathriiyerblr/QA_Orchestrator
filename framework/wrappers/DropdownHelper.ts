/**
 * DropdownHelper.ts — reusable select/dropdown interactions.
 * Handles native <select> plus common custom dropdowns (listbox/role options).
 */
import { Page, Locator } from '@playwright/test';
import { TIMEOUTS } from '../constants/TestConstants';
import { ElementActions } from './ElementActions';

export class DropdownHelper {
  constructor(
    private readonly page: Page,
    private readonly element: ElementActions,
  ) {}

  /** Select by visible label from a native <select>. */
  async selectByLabel(select: Locator, label: string): Promise<void> {
    await select.selectOption({ label });
    this.element['log']?.pass?.(`Dropdown selected "${label}"`);
  }

  /** Select by value from a native <select>. */
  async selectByValue(select: Locator, value: string): Promise<void> {
    await select.selectOption(value);
  }

  /** Select by index from a native <select>. */
  async selectByIndex(select: Locator, index: number): Promise<void> {
    await select.selectOption({ index });
  }

  /**
   * Select an option in a custom (non-native) dropdown: click the trigger,
   * then click the option containing `label`. `optionLocator` should be a
   * page-level locator (e.g. page.locator('.oxd-select-dropdown .oxd-select-option')).
   */
  async selectCustomDropdown(trigger: Locator, optionLocator: Locator, label: string): Promise<void> {
    await this.element.click(trigger);
    const option = optionLocator.filter({ hasText: label }).first();
    await option.waitFor({ state: 'visible', timeout: TIMEOUTS.ACTION });
    await this.element.click(option);
  }

  /** Get the currently selected option text from a native <select>. */
  async getSelectedText(select: Locator): Promise<string> {
    return (await select.inputValue()) ?? '';
  }
}
