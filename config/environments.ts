/**
 * environments.ts — environment registry (dev/qa) with per-site base URLs
 * and the shared API base URL. Website-agnostic; consumers pick their env via
 * getEnvironment(process.env.ENV ?? 'dev').
 */
import { getBaseURL, getApiBaseURL, SITES, SiteName } from '../framework/constants/URLs';

export interface Environment {
  name: string;
  baseURL(site: SiteName): string;
  apiBaseURL: string;
}

function buildEnv(name: string): Environment {
  return {
    name,
    baseURL: (site) => getBaseURL(site, name),
    apiBaseURL: getApiBaseURL(name),
  };
}

export const ENVIRONMENTS: Record<string, Environment> = {
  dev: buildEnv('dev'),
  qa: buildEnv('qa'),
};

export function getEnvironment(env: string = 'dev'): Environment {
  return ENVIRONMENTS[env] ?? ENVIRONMENTS.dev ?? buildEnv('dev');
}

export { SITES, getBaseURL };
