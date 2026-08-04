/**
 * CalendarHelper.ts — reusable date-picker / calendar interactions.
 * openCalendar / selectDate / navigateMonth / selectRange
 */
import { Locator, Page } from '@playwright/test';
import { ElementActions } from './ElementActions';
import { DateUtil } from '../utils/DateUtil';

export class CalendarHelper {
  constructor(
    private readonly page: Page,
    private readonly element: ElementActions,
  ) {}

  /** Open a calendar by clicking its input/trigger. */
  async openCalendar(trigger: Locator): Promise<void> {
    await this.element.click(trigger);
  }

  /**
   * Select a date (YYYY-MM-DD) from an open calendar popup.
   * dateCellLocator is a page-level locator for day cells
   * (e.g. page.locator('.oxd-calendar-date, [role="gridcell"]')).
   */
  async selectDate(dateCellLocator: Locator, isoDate: string): Promise<void> {
    const day = String(DateUtil.parse(isoDate).getDate());
    const cell = dateCellLocator.filter({ hasText: new RegExp(`^${day}$`) }).first();
    await this.element.click(cell);
  }

  /** Click a month-navigation button (e.g. next/prev arrow). */
  async navigateMonth(button: Locator): Promise<void> {
    await this.element.click(button);
  }

  /** Select a start and end date within the same open calendar. */
  async selectRange(dateCellLocator: Locator, startIso: string, endIso: string): Promise<void> {
    await this.selectDate(dateCellLocator, startIso);
    await this.selectDate(dateCellLocator, endIso);
  }
}
