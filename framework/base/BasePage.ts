/**
 * BasePage.ts — every website page object extends this.
 *
 * Exposes:
 *   - `element`   (ElementActions) — wait+scroll+retry+log+screenshot on click/fill/...
 *   - `wait`      (WaitHelper)     — waitForLoader/Toast/Spinner/Network/PageLoad/UntilVisible
 *   - `assertions`(BaseAssertions) — verifyVisible/verifyText/verifyURL/verifyTitle/verifyElementCount
 *   - `helpers`   (table/dropdown/calendar/upload/frame/window) — generic UI helpers
 *   - direct delegates: click/type/getText/isVisible
 *
 * Dependency flow: Tests → Website Page Objects → BasePage → ElementActions |
 * WaitHelper | BaseAssertions → Logger / Utils / API → Playwright APIs
 */
import { Locator, Page } from '@playwright/test';
import { ElementActions } from '../wrappers/ElementActions';
import { WaitHelper } from '../wrappers/WaitHelper';
import { BaseAssertions } from './BaseAssertions';
import { TableHelper } from '../wrappers/TableHelper';
import { DropdownHelper } from '../wrappers/DropdownHelper';
import { CalendarHelper } from '../wrappers/CalendarHelper';
import { FileUploadHelper } from '../wrappers/FileUploadHelper';
import { FrameHelper } from '../wrappers/FrameHelper';
import { WindowHelper } from '../wrappers/WindowHelper';
import { logger } from '../utils/Logger';

export class BasePage {
  protected readonly page: Page;
  protected readonly log: typeof logger;

  readonly element: ElementActions;
  readonly wait: WaitHelper;
  readonly assertions: BaseAssertions;
  readonly table: TableHelper;
  readonly dropdown: DropdownHelper;
  readonly calendar: CalendarHelper;
  readonly upload: FileUploadHelper;
  readonly frame: FrameHelper;
  readonly window: WindowHelper;

  constructor(page: Page) {
    this.page = page;
    this.log = logger;
    this.element = new ElementActions(page);
    this.wait = new WaitHelper(page);
    this.assertions = new BaseAssertions(page);
    this.table = new TableHelper(page, this.element);
    this.dropdown = new DropdownHelper(page, this.element);
    this.calendar = new CalendarHelper(page, this.element);
    this.upload = new FileUploadHelper(page, this.element);
    this.frame = new FrameHelper(page, this.element);
    this.window = new WindowHelper(page);
  }

  // ── Direct convenience delegates ────────────────────────────────────────────
  async click(locator: Locator): Promise<void> {
    await this.element.click(locator);
  }

  async type(locator: Locator, value: string): Promise<void> {
    await this.element.fill(locator, value);
  }

  async getText(locator: Locator): Promise<string> {
    return this.element.getText(locator);
  }

  async isVisible(locator: Locator): Promise<boolean> {
    return this.element.isVisible(locator);
  }
}
