/**
 * FrameHelper.ts — reusable iframe interactions.
 * frame() / clickInFrame / fillInFrame / getTextInFrame
 */
import { Locator, Page } from '@playwright/test';
import { ElementActions } from './ElementActions';

export class FrameHelper {
  constructor(
    private readonly page: Page,
    private readonly element: ElementActions,
  ) {}

  /** Get the first frame matching a frame locator/selector. */
  frame(frameSelector: string | Locator): ReturnType<Page['frameLocator']> {
    return typeof frameSelector === 'string'
      ? this.page.frameLocator(frameSelector)
      : this.page.frameLocator(frameSelector.toString());
  }

  async clickInFrame(frameSelector: string | Locator, selector: string): Promise<void> {
    await this.frame(frameSelector).locator(selector).click();
  }

  async fillInFrame(frameSelector: string | Locator, selector: string, value: string): Promise<void> {
    await this.frame(frameSelector).locator(selector).fill(value);
  }

  async getTextInFrame(frameSelector: string | Locator, selector: string): Promise<string> {
    return (await this.frame(frameSelector).locator(selector).textContent()) ?? '';
  }
}
