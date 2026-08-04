/**
 * ScreenshotUtil.ts — reusable screenshot helpers.
 * take()             → plain screenshot
 * takeFailure()      → screenshot + console log, for on-failure hooks
 * takeFullPage()     → full-page screenshot
 * takeElement()      → element-scoped screenshot
 * Saves under artifacts/{jiraId}/screenshots/ (or a caller-supplied dir).
 */
import { Page, Locator } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

function normalizeName(name: string): string {
  return String(name || 'screenshot')
    .replace(/[^a-zA-Z0-9_-]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 80);
}

function resolveDir(jiraId?: string): string {
  const base = jiraId
    ? path.join(process.cwd(), 'artifacts', jiraId, 'screenshots')
    : path.join(process.cwd(), 'test-results', 'screenshots');
  fs.mkdirSync(base, { recursive: true });
  return base;
}

/** Capture a screenshot and return its absolute path (or null on failure). */
export async function take(page: Page, name: string, jiraId?: string): Promise<string | null> {
  try {
    const dir = resolveDir(jiraId);
    const file = path.join(dir, `${normalizeName(name)}-${Date.now()}.png`);
    await page.screenshot({ path: file });
    return file;
  } catch {
    return null;
  }
}

/** Full-page screenshot. */
export async function takeFullPage(page: Page, name: string, jiraId?: string): Promise<string | null> {
  try {
    const dir = resolveDir(jiraId);
    const file = path.join(dir, `${normalizeName(name)}-${Date.now()}.png`);
    await page.screenshot({ path: file, fullPage: true });
    return file;
  } catch {
    return null;
  }
}

/** Element-scoped screenshot. */
export async function takeElement(locator: Locator, name: string, jiraId?: string): Promise<string | null> {
  try {
    const dir = resolveDir(jiraId);
    const file = path.join(dir, `${normalizeName(name)}-${Date.now()}.png`);
    await locator.screenshot({ path: file });
    return file;
  } catch {
    return null;
  }
}

/** Failure screenshot — always safe to call from an afterEach/onFailure hook. */
export async function takeFailure(page: Page, name: string, jiraId?: string): Promise<string | null> {
  const file = await take(page, `FAIL_${name}`, jiraId);
  // eslint-disable-next-line no-console
  if (file) console.log(`[SCREENSHOT] Failure capture saved to ${file}`);
  return file;
}
