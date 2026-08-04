/**
 * FileUploadHelper.ts — reusable file upload/download interactions.
 * uploadFile / verifyUploadedFile / downloadFile
 */
import { Locator, Page } from '@playwright/test';
import { ElementActions } from './ElementActions';

export class FileUploadHelper {
  constructor(
    private readonly page: Page,
    private readonly element: ElementActions,
  ) {}

  /** Upload a file via an <input type="file"> locator (or the hidden input). */
  async uploadFile(fileInput: Locator, filePath: string): Promise<void> {
    await fileInput.setInputFiles(filePath);
    this.element['log']?.pass?.(`Uploaded file: ${filePath}`);
  }

  /** Upload multiple files at once. */
  async uploadFiles(fileInput: Locator, filePaths: string[]): Promise<void> {
    await fileInput.setInputFiles(filePaths);
  }

  /** Verify an uploaded file name appears somewhere on the page. */
  async verifyUploadedFile(locator: Locator, fileName: string): Promise<boolean> {
    const text = await this.element.getText(locator);
    return text.includes(fileName);
  }

  /** Trigger a download and return the suggested filename. */
  async downloadFile(trigger: Locator): Promise<string | null> {
    const [download] = await Promise.all([
      this.page.waitForEvent('download'),
      this.element.click(trigger),
    ]);
    return download.suggestedFilename();
  }
}
