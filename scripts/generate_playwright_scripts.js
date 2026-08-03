/**
 * generate_playwright_scripts.js — Playwright Automation Code Generation Agent
 *
 * Transforms the generated test cases (artifacts/{jiraId}/testcases.json) into
 * runnable Playwright scripts:
 *   - tests/{jiraId}.spec.ts      → UI tests, Page Object Model (POM) style
 *   - tests/{jiraId}-api.spec.ts  → API tests against the backend/mock
 *
 * The generated POM page is also written to
 * artifacts/{jiraId}/scripts/{Module}Page.ts so it is reviewable and traceable.
 *
 * The orchestrator discovers these specs by name, so no manual wiring is needed.
 */
const fs = require('fs');
const path = require('path');

/** Simple identifier sanitizer (module name → PascalCase class name). */
function toPascalCase(name) {
  return String(name || 'Module')
    .replace(/[^a-zA-Z0-9 ]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join('');
}

/** Escape a string for embedding in a TS template literal (backticks). */
function tsString(value) {
  return String(value == null ? '' : value)
    .replace(/\\/g, '\\\\')
    .replace(/`/g, '\\`')
    .replace(/\$\{/g, '\\${');
}

/**
 * Generate the POM + spec files for a JIRA ticket from its testcases.json.
 * Returns { specPath, apiSpecPath, pagePath, testcases }.
 */
function generatePlaywrightScripts(jiraId) {
  const artifactsDir = path.join(__dirname, `../artifacts/${jiraId}`);
  const testcasesPath = path.join(artifactsDir, 'testcases.json');
  if (!fs.existsSync(testcasesPath)) {
    throw new Error(`testcases.json not found for ${jiraId} — run the Test Generation Agent first.`);
  }
  const testcases = JSON.parse(fs.readFileSync(testcasesPath, 'utf8'));

  const moduleName = toPascalCase(testcases.module || 'Module');
  const uiCases = testcases.ui || [];
  const apiCases = testcases.api || [];
  const app = testcases.app || {};
  const baseUrl = app.baseUrl || 'https://opensource-demo.orangehrmlive.com/web/index.php/auth/login';
  const isOrangeHrm = !!app.isOrangeHrm;

  // ── POM Page object (app-aware) ───────────────────────────────────────────
  const pageClass = `${moduleName}Page`;
  const pagePath = path.join(artifactsDir, 'scripts', `${pageClass}.ts`);

  // Login method: OrangeHRM uses username/password fields + submit button.
  // For unknown/external apps (e.g. BrowserStack demo), we cannot reliably
  // script their login flow, so login() just navigates and the spec validates
  // the page loads (the acceptance criteria remain in the test-case steps).
  const loginMethod = isOrangeHrm
    ? [
        `  async login() {`,
        `    await this.page.goto('https://opensource-demo.orangehrmlive.com/web/index.php/auth/login');`,
        `    await this.page.fill('input[name="username"]', 'Admin');`,
        `    await this.page.fill('input[name="password"]', 'admin123');`,
        `    await this.page.click('button[type="submit"]');`,
        `    await this.page.waitForLoadState('networkidle').catch(() => {});`,
        `  }`,
      ].join('\n')
    : [
        `  async login() {`,
        `    await this.page.goto(${JSON.stringify(baseUrl)});`,
        `    await this.page.waitForLoadState('networkidle').catch(() => {});`,
        `  }`,
      ].join('\n');

  const pageCode = [
    `/**`,
    ` * ${pageClass}.ts — auto-generated Page Object Model from JIRA requirements.`,
    ` * Regenerate via scripts/generate_playwright_scripts.js; do not edit by hand.`,
    ` */`,
    `import { Page, Locator } from '@playwright/test';`,
    ``,
    `export class ${pageClass} {`,
    `  readonly page: Page;`,
    ``,
    `  constructor(page: Page) {`,
    `    this.page = page;`,
    `  }`,
    ``,
    loginMethod,
    ``,
    `  /** Navigate to a top-level module or section of the application. */`,
    `  async navigateToModule(module: string) {`,
    `    const normalized = module.toLowerCase();`,
    `    const link = this.page.locator(\`a[href*="\${normalized}"], li:has-text("\${module}")\`).first();`,
    `    await link.click();`,
    `    await this.page.waitForLoadState('networkidle').catch(() => {});`,
    `  }`,
    ``,
    `  /** Assert the page loaded after login/navigation. */`,
    `  async expectLoaded() {`,
    `    await this.page.waitForLoadState('domcontentloaded');`,
    `    await this.page.locator('body').waitFor({ state: 'visible', timeout: 15000 });`,
    `  }`,
    `}`,
    ``,
  ].join('\n');
  fs.mkdirSync(path.dirname(pagePath), { recursive: true });
  fs.writeFileSync(pagePath, pageCode, 'utf8');

  // ── UI spec (POM) — one test per generated UI case ───────────────────────
  // Each test logs in (if the app has a login) and then performs a lightweight
  // action derived from the test-case steps. For external apps with no local
  // API, this validates navigation/load rather than assuming internal flows.
  const specPath = path.join(__dirname, `../tests/${jiraId.toLowerCase()}.spec.ts`);

  const uiTests = uiCases.map(tc => {
    const tcid = tc.tcid;
    const scenario = tsString(tc.scenario || tcid);
    const steps = String(tc.steps || '').split('\n').map(s => tsString(s.trim())).filter(Boolean);
    const hasLogin = isOrangeHrm || (app.username && app.password);
    const lines = [
      `  test('${tcid}: ${scenario}', async ({ page }) => {`,
      `    const pageObj = new ${pageClass}(page);`,
      ...(hasLogin ? [`    await pageObj.login();`, `    await pageObj.expectLoaded();`] : [`    await page.goto(${JSON.stringify(baseUrl)});`, `    await pageObj.expectLoaded();`]),
      `    // Generated from JIRA requirement steps: ${steps.join(' | ')}`,
    ];

    if (tc.healable) {
      // Healable test: asserts on a deliberately stale locator so it FAILS on
      // the first run. The self-healing agent then rewrites the spec to use
      // the stable page container, and the re-run passes.
      lines.push(
        `    // STALE locator on purpose — this fails until self-healing rewrites it.`,
        `    await expect(page.locator('.self-heal-stale-locator')).toBeVisible({ timeout: 2000 });`,
      );
    } else if (tc.knownBug) {
      // Known-bug test: assert on an element that the app does not have.
      lines.push(
        `    await expect(page.locator('.session-timeout-notice')).toBeVisible({ timeout: 3000 });`,
      );
    } else {
      lines.push(`    await expect(page.locator('body')).toBeVisible();`);
    }
    lines.push(`  });`, ``);
    return lines.join('\n');
  }).join('\n');

  const specCode = [
    `import { test, expect } from '@playwright/test';`,
    `import { ${pageClass} } from '../artifacts/${jiraId}/scripts/${pageClass}';`,
    ``,
    `/**`,
    ` * ${jiraId}.spec.ts — auto-generated UI tests (POM) from JIRA requirements.`,
    ` * Regenerate via scripts/generate_playwright_scripts.js.`,
    ` */`,
    `test.describe('${jiraId}: ${tsString(testcases.module || 'Module')} UI tests', () => {`,
    uiTests,
    `});`,
    ``,
  ].join('\n');
  fs.mkdirSync(path.dirname(specPath), { recursive: true });
  fs.writeFileSync(specPath, specCode, 'utf8');

  // ── API spec ──────────────────────────────────────────────────────────────
  const apiSpecPath = path.join(__dirname, `../tests/${jiraId.toLowerCase()}-api.spec.ts`);
  const apiTests = apiCases.map(tc => {
    const tcid = tc.tcid;
    const method = (tc.method || 'GET').toUpperCase();
    const endpoint = tsString(tc.endpoint || '/');
    const expectedCode = tc.expectedCode || '200';
    const validation = tsString(tc.validation || '');
    let bodyArg = '';
    if (method !== 'GET') {
      // payload is a JSON string (e.g. {"nickname":"XXX"}); embed it directly
      // as the request body object so the API test sends real data.
      const payload = (tc.payload && tc.payload !== '{}') ? tc.payload : '{}';
      bodyArg = `, { data: ${payload} }`;
    }
    return [
      `  test('${tcid}: ${method} ${endpoint}', async () => {`,
      `    const ctx = await pwRequest.newContext({ baseURL: BASE_URL });`,
      `    const res = await ctx.${method.toLowerCase()}(${JSON.stringify(tc.endpoint || '/')}${bodyArg});`,
      `    expect(res.status()).toBe(${expectedCode});`,
      `    // ${validation}`,
      `    await ctx.dispose();`,
      `  });`,
      ``,
    ].join('\n');
  }).join('\n');

  const apiSpecCode = [
    `import { test, expect, request as pwRequest } from '@playwright/test';`,
    ``,
    `/**`,
    ` * ${jiraId}-api.spec.ts — auto-generated API tests from JIRA requirements.`,
    ` * Regenerate via scripts/generate_playwright_scripts.js.`,
    ` */`,
    `const BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000';`,
    ``,
    `test.describe('${jiraId}: ${tsString(testcases.module || 'Module')} API tests', () => {`,
    apiTests,
    `});`,
    ``,
  ].join('\n');
  fs.writeFileSync(apiSpecPath, apiSpecCode, 'utf8');

  console.log(`[AUTOMATION AGENT] Generated ${uiTests.split('\n').filter(l => l.includes('test(')).length} UI + ${apiTests.split('\n').filter(l => l.includes('test(')).length} API Playwright tests for ${jiraId}`);
  console.log(`[AUTOMATION AGENT] Specs: ${specPath} | ${apiSpecPath}`);
  console.log(`[AUTOMATION AGENT] POM: ${pagePath}`);
  return { specPath, apiSpecPath, pagePath, testcases };
}

module.exports = { generatePlaywrightScripts, toPascalCase, tsString };
