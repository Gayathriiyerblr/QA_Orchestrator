/**
 * APIClient.ts — shared HTTP client wrapper over Playwright's request API.
 * get/post/put/patch/delete with optional auth-header injection and logging.
 * Usage:
 *   const api = new APIClient(apiBaseURL);
 *   await api.get('/api/results');
 */
import { request as pwRequest, APIRequestContext, APIResponse } from '@playwright/test';
import { logger } from '../utils/Logger';

export interface APIClientOptions {
  baseURL: string;
  token?: string | null;
  extraHeaders?: Record<string, string>;
}

export class APIClient {
  private ctx: APIRequestContext | null = null;
  readonly baseURL: string;
  private token: string | null;
  private extraHeaders: Record<string, string>;

  constructor(options: APIClientOptions) {
    this.baseURL = options.baseURL.replace(/\/$/, '');
    this.token = options.token ?? null;
    this.extraHeaders = options.extraHeaders ?? {};
  }

  /** Lazily create the shared request context. */
  private async context(): Promise<APIRequestContext> {
    if (!this.ctx) {
      this.ctx = await pwRequest.newContext({ baseURL: this.baseURL });
    }
    return this.ctx;
  }

  setToken(token: string | null): void {
    this.token = token;
  }

  private headers(): Record<string, string> {
    const h: Record<string, string> = { ...this.extraHeaders };
    if (this.token) h.Authorization = `Bearer ${this.token}`;
    return h;
  }

  async get<T = unknown>(endpoint: string): Promise<APIResponse> {
    logger.info(`API GET ${endpoint}`);
    const ctx = await this.context();
    return ctx.get(endpoint, { headers: this.headers() });
  }

  async post<T = unknown>(endpoint: string, data?: T): Promise<APIResponse> {
    logger.info(`API POST ${endpoint}`);
    const ctx = await this.context();
    return ctx.post(endpoint, { headers: this.headers(), data: (data ?? {}) as object });
  }

  async put<T = unknown>(endpoint: string, data?: T): Promise<APIResponse> {
    logger.info(`API PUT ${endpoint}`);
    const ctx = await this.context();
    return ctx.put(endpoint, { headers: this.headers(), data: (data ?? {}) as object });
  }

  async patch<T = unknown>(endpoint: string, data?: T): Promise<APIResponse> {
    logger.info(`API PATCH ${endpoint}`);
    const ctx = await this.context();
    return ctx.patch(endpoint, { headers: this.headers(), data: (data ?? {}) as object });
  }

  async delete(endpoint: string): Promise<APIResponse> {
    logger.info(`API DELETE ${endpoint}`);
    const ctx = await this.context();
    return ctx.delete(endpoint, { headers: this.headers() });
  }

  async dispose(): Promise<void> {
    await this.ctx?.dispose();
    this.ctx = null;
  }
}
