/**
 * URLs.ts — registry of website base URLs per environment.
 * Website-agnostic; each site resolves its base URL through getBaseURL(site).
 */

export const SITES = {
  OrangeHRM: 'OrangeHRM',
  BrowserStackDemo: 'BrowserStackDemo',
} as const;

export type SiteName = (typeof SITES)[keyof typeof SITES];

export const BASE_URLS: Record<SiteName, Record<string, string>> = {
  [SITES.OrangeHRM]: {
    dev: 'https://opensource-demo.orangehrmlive.com/web/index.php/auth/login',
    qa: 'https://opensource-demo.orangehrmlive.com/web/index.php/auth/login',
  },
  [SITES.BrowserStackDemo]: {
    dev: 'https://bstackdemo.com/',
    qa: 'https://bstackdemo.com/',
  },
};

export const API_BASE_URL = {
  dev: 'http://localhost:5000',
  qa: 'http://localhost:5000',
} as const;

/** Resolve a site's base URL for an environment (defaults to 'dev'). */
export function getBaseURL(site: SiteName, env: string = 'dev'): string {
  const urls = BASE_URLS[site] ?? {};
  return urls[env] ?? urls.dev ?? '';
}

/** Resolve the shared API base URL for an environment (defaults to 'dev'). */
export function getApiBaseURL(env: string = 'dev'): string {
  return API_BASE_URL[env as keyof typeof API_BASE_URL] ?? API_BASE_URL.dev;
}
