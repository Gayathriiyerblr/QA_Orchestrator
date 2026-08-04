/**
 * BaseAPI.ts — base class for API test helpers.
 * Wraps an APIClient and exposes get/post/put/delete, plus status assertions.
 */
import { expect } from '@playwright/test';
import { APIClient } from '../api/APIClient';
import { logger } from '../utils/Logger';

export class BaseAPI {
  protected readonly api: APIClient;
  protected readonly log: typeof logger;

  constructor(apiBaseURL: string, log: typeof logger = logger) {
    this.api = new APIClient({ baseURL: apiBaseURL });
    this.log = log;
  }

  protected async expectStatus(method: () => Promise<{ status(): number }>, expected: number, label: string): Promise<void> {
    const res = await method();
    expect(res.status()).toBe(expected);
    this.log.pass(`${label} → HTTP ${expected}`);
  }

  async dispose(): Promise<void> {
    await this.api.dispose();
  }
}
