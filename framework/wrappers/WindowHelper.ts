/**
 * WindowHelper.ts — reusable multi-tab/window interactions.
 * openInNewTab / switchToPopup / closeCurrentTab / getWindowCount
 */
import { Page } from '@playwright/test';

export class WindowHelper {
  constructor(private readonly page: Page) {}

  /** Open a URL in a new tab and return the new page. */
  async openInNewTab(url: string): Promise<Page> {
    const [newPage] = await Promise.all([
      this.page.waitForEvent('popup'),
      this.page.evaluate((u) => window.open(u, '_blank'), url),
    ]);
    return newPage;
  }

  /** Switch to the most recently opened popup page. */
  async switchToPopup(): Promise<Page> {
    const pages = this.page.context().pages();
    return pages[pages.length - 1] ?? this.page;
  }

  /** Close the current page and return to the original. */
  async closeCurrentTab(popup: Page): Promise<void> {
    await popup.close();
  }

  /** Number of open pages in the context. */
  getWindowCount(): number {
    return this.page.context().pages().length;
  }
}
