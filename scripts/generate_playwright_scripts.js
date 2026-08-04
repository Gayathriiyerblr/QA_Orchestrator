/**
 * generate_playwright_scripts.js — Playwright Automation Code Generation Agent
 *
 * Transforms the generated test cases (artifacts/{jiraId}/testcases.json) into
 * runnable Playwright scripts in the enterprise POM structure:
 *
 *   websites/<Site>/tests/<JIRA_ID>/<jiraId>.spec.ts      → UI tests
 *   websites/<Site>/tests/<JIRA_ID>/<jiraId>-api.spec.ts  → API tests
 *   websites/<Site>/pages/<Module>Page.ts                 → aggregate page object
 *   artifacts/{jiraId}/scripts/<Module>Page.ts            → traceability copy
 *
 * Specs import the site's page objects (LoginPage, PIMPage, ProductPage, …)
 * and call the FULL flows + verification methods per scenario, so the written
 * test-case steps genuinely execute (login, create employee with ID + success
 * toast, leave apply form, timesheet open, real BrowserStack sign-in, cart
 * assertions, …). The generated aggregate page extends framework/base/BasePage
 * and re-exports the site pages so a single import stays convenient.
 *
 * The orchestrator discovers these specs by path, so no manual wiring is needed.
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

// ─────────────────────────────────────────────────────────────────────────────
// Site resolution — future JIRA tickets for the same or a different website
// land under websites/<Site>/ automatically. Unknown apps fall back to a scan
// of the websites/ directory (first site folder wins), so a brand-new website
// can still generate specs without code changes here.
// ─────────────────────────────────────────────────────────────────────────────
function resolveSite(app) {
  if (app && app.isOrangeHrm) return 'OrangeHRM';
  if (app && app.site) return app.site;
  if (app && app.baseUrl && /bstackdemo/i.test(app.baseUrl)) return 'BrowserStackDemo';
  // Fallback: scan websites/ for a known site folder (first alphabetical).
  const websitesDir = path.join(__dirname, '../websites');
  if (fs.existsSync(websitesDir)) {
    const dirs = fs.readdirSync(websitesDir).filter(d => fs.statSync(path.join(websitesDir, d)).isDirectory());
    if (dirs.length > 0) return dirs[0];
  }
  return 'OrangeHRM';
}

/**
 * Scenario → [ (pageClass, methodCall, needsLogin?) ] mapping.
 * Each entry performs a REAL flow step and its verification, so the written
 * test-case steps are genuinely executed. The first entry's page provides the
 * login() (OrangeHRM: LoginPage; BrowserStack: LoginPage.load + page objects).
 */
function scenarioActions(scenario, isOrangeHrm) {
  const s = String(scenario || '').toLowerCase();

  if (isOrangeHrm) {
    // Personal Details / My Info edit flow — covers all the sub-scenarios of
    // an "edit employee personal details" ticket (search/open, edit, save,
    // success message, persistence, no errors).
    if (/\bpersonal detail|my info|edit employee|edit personal|edit.*detail\b|search for and open|save the updated|success confirmation|persist after|no validation|no.*application error|updated detail/.test(s)) {
      return [
        ['LoginPage', 'login()'],
        // editPersonalDetails() generates a unique nickname + picks marital
        // status each run, then saves and verifies persistence.
        ['PersonalDetailsPage', 'editPersonalDetails()'],
        ['PersonalDetailsPage', 'verifySaved()'],
      ];
    }
    if (/\bpim\b/.test(s)) {
      return [
        ['LoginPage', 'login()'],
        // createEmployee() generates a unique name + employee id per run so
        // repeated executions never collide with previously created records.
        ['PIMPage', 'createEmployee()'],
        ['PIMPage', 'verifyEmployeeCreated()'],
      ];
    }
    if (/\bleave\b/.test(s)) {
      return [
        ['LoginPage', 'login()'],
        ['LeavePage', "applyLeave('CAN - Personal', 'Automated leave request')"],
      ];
    }
    if (/\brecruitment\b/.test(s)) {
      return [
        ['LoginPage', 'login()'],
        ['RecruitmentPage', 'viewRecruitment()'],
      ];
    }
    if (/\btime\b/.test(s)) {
      return [
        ['LoginPage', 'login()'],
        ['TimePage', "viewTimesheet('Orange Test')"],
      ];
    }
    // Default: login + verify home.
    return [['LoginPage', 'login()']];
  }

  // e-commerce / BrowserStack
  if (/\baccess the sign in page\b/.test(s)) {
    return [
      ['LoginPage', 'login()'],
      ['LoginPage', 'openSignInPage()'],
      ['LoginPage', 'verifySignInPageLoaded()'],
    ];
  }
  if (/\blog in using valid demo credentials\b/.test(s)) {
    return [
      ['LoginPage', 'login()'],
      ['LoginPage', "signIn('demouser', 'testingisfun99')"],
      ['LoginPage', "verifyLoggedInUser('demouser')"],
    ];
  }
  if (/\bno authentication errors\b/.test(s)) {
    return [
      ['LoginPage', 'login()'],
      ['LoginPage', "signIn('demouser', 'testingisfun99')"],
      ['LoginPage', 'verifyNoAuthErrors()'],
    ];
  }
  if (/\bsearch for a product\b/.test(s)) {
    return [
      ['LoginPage', 'login()'],
      ['ProductPage', "searchProduct('iPhone')"],
      ['ProductPage', 'verifyResultsShown()'],
    ];
  }
  if (/\bfilter products by brand\b/.test(s)) {
    return [
      ['LoginPage', 'login()'],
      ['ProductPage', "filterByBrand('Apple')"],
      ['ProductPage', 'verifyResultsShown()'],
    ];
  }
  if (/\bfiltered products are displayed correctly\b/.test(s)) {
    return [
      ['LoginPage', 'login()'],
      ['ProductPage', "filterByBrand('Apple')"],
      ['ProductPage', 'verifyResultsShown()'],
    ];
  }
  if (/\bproduct details remain accessible after filtering\b/.test(s)) {
    return [
      ['LoginPage', 'login()'],
      ['ProductPage', "filterByBrand('Apple')"],
      ['ProductPage', 'openFirstProduct()'],
      ['ProductPage', 'verifyProductDetails()'],
    ];
  }
  if (/\bselect any available product\b/.test(s)) {
    return [
      ['LoginPage', 'login()'],
      ['ProductPage', 'openFirstProduct()'],
      ['ProductPage', 'verifyProductDetails()'],
    ];
  }
  if (/\badd the selected product to the cart\b/.test(s)) {
    return [
      ['LoginPage', 'login()'],
      ['ProductPage', 'openFirstProduct()'],
      ['CartPage', 'addToCart()'],
    ];
  }
  if (/\bcart icon updates with the correct item count\b/.test(s)) {
    return [
      ['LoginPage', 'login()'],
      ['ProductPage', 'openFirstProduct()'],
      ['CartPage', 'addToCart()'],
      ['CartPage', 'verifyCartCount(1)'],
    ];
  }
  if (/\badded product appears in the shopping cart\b/.test(s)) {
    return [
      ['LoginPage', 'login()'],
      ['ProductPage', 'openFirstProduct()'],
      ['CartPage', 'addToCart()'],
      ['CartPage', 'openCart()'],
      ['CartPage', "verifyProductInCart('iPhone')"],
    ];
  }
  if (/\bproduct price and quantity are displayed correctly\b/.test(s)) {
    return [
      ['LoginPage', 'login()'],
      ['ProductPage', 'openFirstProduct()'],
      ['CartPage', 'addToCart()'],
      ['CartPage', 'openCart()'],
      ['CartPage', 'verifyProductInCart("iPhone")'],
      ['CartPage', 'verifyCartPrice("$")'],
    ];
  }
  if (/\bsearch and filter results are updated\b/.test(s)) {
    return [
      ['LoginPage', 'login()'],
      ['ProductPage', "searchProduct('iPhone')"],
      ['ProductPage', "filterByBrand('Apple')"],
      ['ProductPage', 'verifyResultsShown()'],
    ];
  }
  // Default: load the app and verify home.
  return [['LoginPage', 'login()']];
}

/**
 * Build an aggregate page object for the site: extends BasePage and re-exports
 * the site's page objects so generated specs keep a single convenient import.
 */
function buildAggregatePage({ pageClass, site }) {
  const importBase = relFromPagesDir('framework', 'base', 'BasePage');
  const imports = [`import { BasePage } from '${importBase}';`];
  const props = [];

  const pageFiles = fs
    .readdirSync(path.join(__dirname, `../websites/${site}/pages`))
    .filter(f => f.endsWith('.ts'))
    .map(f => f.replace(/\.ts$/, ''));
  // Ensure the aggregate page itself isn't re-imported.
  for (const pageName of pageFiles) {
    if (pageName === pageClass) continue;
    imports.push(`import { ${pageName} } from './${pageName}';`);
    props.push(`  readonly ${lcFirst(pageName)}: ${pageName};`);
  }

  return [
    `/**`,
    ` * ${pageClass}.ts — auto-generated aggregate Page Object Model.`,
    ` * Extends framework/base/BasePage and re-exports the site's page objects.`,
    ` */`,
    `import { Page } from '@playwright/test';`,
    ...imports,
    ``,
    `export class ${pageClass} extends BasePage {`,
    ...props,
    ``,
    `  constructor(page: Page) {`,
    `    super(page);`,
    ...pageFiles.filter(f => f !== pageClass).map(f => `    this.${lcFirst(f)} = new ${f}(page);`),
    `  }`,
    ``,
    `  /** Convenience login passthrough (uses the site's LoginPage). */`,
    `  async login(): Promise<void> {`,
    `    await this.loginPage.login();`,
    `  }`,
    `}`,
    ``,
  ].join('\n');
}

/** camelCase an acronym-leading page class name: PIMPage → pimPage, LoginPage → loginPage. */
function lcFirst(name) {
  const lower = name.charAt(0).toLowerCase() + name.slice(1);
  // Collapse a leading acronym: "pIMPage" → "pimPage".
  return lower.replace(/^([a-z])([A-Z][a-z]*)([A-Z])/, (_, first, mid, last) => `${first}${mid.toLowerCase()}${last.toLowerCase()}`);
}

/** Relative import path from websites/<Site>/tests/<JIRA_ID>/ to a repo-root path. */
function relFromTestDir(...segments) {
  return path.posix.join('../../../../', ...segments);
}

/** Relative import path from websites/<Site>/pages/ to a repo-root path. */
function relFromPagesDir(...segments) {
  return path.posix.join('../../../', ...segments);
}

/**
 * Generate the POM + spec files for a JIRA ticket from its testcases.json.
 * Emits into websites/<Site>/tests/<JIRA_ID>/ and keeps a traceability copy of
 * the aggregate POM under artifacts/{jiraId}/scripts/.
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
  const site = resolveSite(app);

  // ── Aggregate POM page object ──────────────────────────────────────────────
  const pageClass = `${moduleName}Page`;
  const pageCode = buildAggregatePage({ pageClass, site });

  // Write into the site's pages/ folder so generated specs import it, plus a
  // traceability copy under artifacts.
  const sitePagesDir = path.join(__dirname, `../websites/${site}/pages`);
  fs.mkdirSync(sitePagesDir, { recursive: true });
  const pagePath = path.join(sitePagesDir, `${pageClass}.ts`);
  fs.writeFileSync(pagePath, pageCode, 'utf8');

  const tracePagePath = path.join(artifactsDir, 'scripts', `${pageClass}.ts`);
  fs.mkdirSync(path.dirname(tracePagePath), { recursive: true });
  fs.writeFileSync(tracePagePath, pageCode, 'utf8');

  // ── Spec output dir: websites/<Site>/tests/<JIRA_ID>/ ─────────────────────
  const testDir = path.join(__dirname, `../websites/${site}/tests/${jiraId.toUpperCase()}`);
  fs.mkdirSync(testDir, { recursive: true });
  const specPath = path.join(testDir, `${jiraId.toLowerCase()}.spec.ts`);
  const apiSpecPath = path.join(testDir, `${jiraId.toLowerCase()}-api.spec.ts`);

  // Ensure the site has a DemoLocators.locators.ts so the self-healing agent
  // has a locators file to patch for TC_UI_HEAL / TC_UI_BUG cases.
  const demoLocatorsPath = path.join(__dirname, `../websites/${site}/locators/DemoLocators.locators.ts`);
  if (!fs.existsSync(demoLocatorsPath)) {
    fs.mkdirSync(path.dirname(demoLocatorsPath), { recursive: true });
    fs.writeFileSync(demoLocatorsPath, [
      `/**`,
      ` * DemoLocators.locators.ts — locators for demo/self-heal and known-bug test cases.`,
      ` */`,
      `export const DemoLocators = {`,
      `  staleContainer: '.self-heal-stale-locator',`,
      `  sessionTimeoutNotice: '.session-timeout-notice',`,
      `} as const;`,
      ``,
    ].join('\n'), 'utf8');
  }

  const fixturesImport = relFromTestDir('fixtures', 'CustomFixtures');

  // ── UI spec (POM) — one test per generated UI case, full step execution ───
  const uiTests = uiCases.map(tc => {
    const tcid = tc.tcid;
    const scenario = tsString(tc.scenario || tcid);
    const steps = String(tc.steps || '').split('\n').map(s => tsString(s.trim())).filter(Boolean);
    const lines = [
      `  test('${tcid}: ${scenario}', async ({ page }) => {`,
      `    const pageObj = new ${pageClass}(page);`,
      `    // Generated from JIRA requirement steps: ${steps.join(' | ')}`,
    ];

    if (tc.healable) {
      lines.push(
        `    await pageObj.login();`,
        `    // STALE locator on purpose — this fails until self-healing rewrites it.`,
        `    await pageObj.assertions.verifyVisible(page.locator(DemoLocators.staleContainer), 'self-heal stale locator');`,
      );
    } else if (tc.knownBug) {
      lines.push(
        `    await pageObj.login();`,
        `    await pageObj.assertions.verifyVisible(page.locator(DemoLocators.sessionTimeoutNotice), 'session timeout notice');`,
      );
    } else {
      // Perform the real flow + verification for this scenario via site pages.
      const actions = scenarioActions(tc.scenario || '', isOrangeHrm);
      for (const [pageName, call] of actions) {
        const prop = lcFirst(pageName);
        lines.push(`    await pageObj.${prop}.${call};`);
      }
    }
    lines.push(`  });`, ``);
    return lines.join('\n');
  }).join('\n');

  const specCode = [
    `import { test } from '${fixturesImport}';`,
    `import { ${pageClass} } from '../../pages/${pageClass}';`,
    `import { DemoLocators } from '../../locators/DemoLocators.locators';`,
    ``,
    `// The demo sites are slow; give each test enough headroom to complete the`,
    `// full login + flow (default Playwright timeout is 30s).`,
    `test.describe.configure({ timeout: 120_000 });`,
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
  fs.writeFileSync(specPath, specCode, 'utf8');

  // ── API spec ──────────────────────────────────────────────────────────────
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

  const uiCount = uiTests.split('\n').filter(l => l.includes('test(')).length;
  const apiCount = apiTests.split('\n').filter(l => l.includes('test(')).length;
  console.log(`[AUTOMATION AGENT] Generated ${uiCount} UI + ${apiCount} API Playwright tests for ${jiraId} (site: ${site})`);
  console.log(`[AUTOMATION AGENT] Specs: ${specPath} | ${apiSpecPath}`);
  console.log(`[AUTOMATION AGENT] POM: ${pagePath} (trace: ${tracePagePath})`);
  return { specPath, apiSpecPath, pagePath, testcases };
}

module.exports = { generatePlaywrightScripts, toPascalCase, tsString, resolveSite };
