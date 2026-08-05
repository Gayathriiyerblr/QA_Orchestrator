/**
 * generate_testcases_from_requirements.js — AI Test Generation Agent
 *
 * Derives UI and API test cases from artifacts/{jiraId}/requirements.json
 * (which itself is generated from the live JIRA ticket by
 * generate_requirements.js). Writes:
 *   - artifacts/{jiraId}/{jiraId}_ProfileManagement_UI.csv  (UI test cases)
 *   - artifacts/{jiraId}/{jiraId}_ProfileManagement_API.csv (API test cases)
 *   - artifacts/{jiraId}/testcases.json                     (structured manifest)
 *
 * These CSVs feed the existing JIRA-format Excel sheet generator, so the whole
 * test-case layer now traces back to the JIRA ticket instead of hand-written
 * files.
 */
const fs = require('fs');
const path = require('path');
const { moduleFromSummary } = require('./jiraClient');

/** Escape a value for CSV (quote if it contains commas, quotes, or newlines). */
function csvField(value) {
  const s = String(value == null ? '' : value);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Build a CSV from rows (array of objects) using the given headers. */
function toCSV(headers, rows) {
  const lines = [headers.map(csvField).join(',')];
  for (const row of rows) {
    lines.push(headers.map(h => csvField(row[h] || '')).join(','));
  }
  return lines.join('\n') + '\n';
}

/** Guess the module label from requirements (used in filenames). */
function guessModule(requirements) {
  const moduleName = (requirements.analysis && requirements.analysis.module) || requirements.title || '';
  return moduleFromSummary(moduleName).replace(/[^a-zA-Z0-9_]/g, '_') || 'Module';
}

/** Extract the target application URL from the JIRA description (e.g. https://bstackdemo.com/). */
function extractBaseUrl(requirements) {
  const desc = `${requirements.description || ''}\n${requirements.title || ''}`;
  const match = desc.match(/https?:\/\/[^\s)\]|>]+/);
  return match ? match[0].replace(/[.,;]+$/, '') : null;
}

/** Clean a credential value: strip leading bullets, {{curly}} placeholders, and trailing notes. */
function cleanCredential(raw) {
  return String(raw || '')
    .replace(/^\s*[*•-]+\s*/, '')                       // leading bullet
    .replace(/[{}]+/g, '')                                // all {{ }} braces
    .replace(/[_({].*$/, '')                              // trailing note like _(Select...) or (Select...)
    .trim();
}

/**
 * Detect the target website from a JIRA ticket's description/title/base URL.
 * Uses both explicit identifiers (URLs, "OrangeHRM", "BrowserStack") and
 * domain keywords, so a ticket like "Edit Employee Personal Details (PIM
 * Module)" is correctly classified as OrangeHRM even without the literal name.
 * Returns 'OrangeHRM' | 'BrowserStackDemo' | null.
 */
function detectSite(requirements) {
  const text = `${requirements.title || ''} ${requirements.description || ''} ${extractBaseUrl(requirements) || ''}`;
  const s = text.toLowerCase();

  // Explicit URL / name matches win first.
  if (/orangehrm|opensource-demo/.test(s)) return 'OrangeHRM';
  if (/bstackdemo|browserstack/.test(s)) return 'BrowserStackDemo';

  // OrangeHRM domain keywords (its module vocabulary).
  const orangeKeywords = [
    'pim module', 'pim', 'my info', 'personal detail', 'employee record',
    'admin module', 'leave module', 'recruitment', 'timesheet', 'performance',
    'add employee', 'edit employee', 'employee list', 'attendance', 'dashboard module',
    'claim module', 'directory', 'maintenance', 'buzz', 'overtime', 'candidate',
    'vacanc', 'shift', 'pay grade', 'job title', 'employment status',
    'orangehrm', 'opensource-demo',
  ];
  if (orangeKeywords.some(k => s.includes(k))) return 'OrangeHRM';

  // BrowserStack / e-commerce domain keywords.
  const ecomKeywords = [
    'product', 'cart', 'checkout', 'bag', 'order', 'search product',
    'brand filter', 'add to cart', 'sign in page', 'bstackdemo', 'browserstack',
  ];
  if (ecomKeywords.some(k => s.includes(k))) return 'BrowserStackDemo';

  return null;
}

/** Extract username/password from the JIRA description (demo credentials). */
function extractCredentials(requirements) {
  const desc = requirements.description || '';
  const lines = desc.split(/\r?\n/).map(l => l.trim());
  let username = null;
  let password = null;
  for (const line of lines) {
    const m = line.match(/^\*?\s*(?:username|user name)\s*[::]\s*(.+)$/i);
    if (m && !username) username = cleanCredential(m[1]);
    const p = line.match(/^\*?\s*(?:password|passwd)\s*[::]\s*(.+)$/i);
    if (p && !password) password = cleanCredential(p[1]);
  }
  return { username, password };
}

/**
 * Build detailed, concrete test steps for an acceptance criterion by mapping
 * the criterion's intent (keywords) to real user actions. Returns a numbered
 * step list that always starts with the login/launch steps and ends with an
 * explicit verification.
 */
function buildDetailedSteps(scenario, { loginSteps, isOrangeHrm, appName }) {
  const s = String(scenario || '').toLowerCase();
  const login = Array.isArray(loginSteps) ? loginSteps.slice() : [];
  const next = login.length + 1;
  const actionSteps = [];

  // OrangeHRM module actions
  if (isOrangeHrm) {
    if (/\bpim\b/.test(s)) {
      actionSteps.push(
        `${next}. From the top menu bar, click "PIM".`,
        `${next + 1}. Click the "Add" button to open the Add Employee form.`,
        `${next + 2}. Enter a First Name, Last Name, and a unique Employee Id.`,
        `${next + 3}. Click "Save" to create the employee record.`,
        `${next + 4}. Verify the employee is created and the success message is displayed.`
      );
    } else if (/edit.*leave|leave.*edit|modify.*leave|leave.*modify|update.*leave|leave.*update/i.test(s)) {
      // EDIT EXISTING LEAVE - specific to editing existing leave requests
      actionSteps.push(
        `${next}. From the top menu bar, click "Leave".`,
        `${next + 1}. Click "My Leave" to view the leave list/calendar.`,
        `${next + 2}. Locate an existing leave request from the list that is eligible for modification (Pending or Cancelled status).`,
        `${next + 3}. Click the "Edit" icon or action for the existing leave request.`,
        `${next + 4}. Modify the leave details (e.g., change dates, leave type, or add comments).`,
        `${next + 5}. Click "Save" or "Update" to apply the changes.`,
        `${next + 6}. Verify the updated leave details are reflected in the leave list.`
      );
    } else if (/\bleave\b/.test(s) && !/navigate/i.test(s)) {
      actionSteps.push(
        `${next}. From the top menu bar, click "Leave".`,
        `${next + 1}. Click "Apply" and select the Leave Type, From Date, and To Date.`,
        `${next + 2}. Add any comments and click "Apply".`,
        `${next + 3}. Verify the leave request is submitted successfully.`
      );
    } else if (/navigate.*leave|leave.*navigate|my leave\b/i.test(s)) {
      // NAVIGATE TO LEAVE MODULE - just verify navigation, no apply
      actionSteps.push(
        `${next}. From the top menu bar, click "Leave".`,
        `${next + 1}. Verify the Leave module loads and displays the Leave List or My Leave view.`,
        `${next + 2}. Verify the page shows leave options like "Apply", "My Leave", or "Entitlements".`
      );
    } else if (/\bleave\b/.test(s)) {
      actionSteps.push(
        `${next}. From the top menu bar, click "Leave".`,
        `${next + 1}. Verify the Leave module loads successfully.`
      );
    } else if (/\brecruitment\b/.test(s)) {
      actionSteps.push(
        `${next}. From the top menu bar, click "Recruitment".`,
        `${next + 1}. Navigate to the "Candidates" or "Vacancies" section.`,
        `${next + 2}. Verify the current job vacancies and candidate list are displayed.`
      );
    } else if (/\btime\b/.test(s)) {
      actionSteps.push(
        `${next}. From the top menu bar, click "Time".`,
        `${next + 1}. Open "Timesheets" and select an employee.`,
        `${next + 2}. Verify the timesheet is displayed with the recorded hours.`
      );
    } else {
      actionSteps.push(
        `${next}. Navigate to the relevant section of the application.`,
        `${next + 1}. Perform the action required by: "${scenario}".`,
        `${next + 2}. Verify the expected result is displayed.`
      );
    }
    return [...login, ...actionSteps].join('\n');
  }

  // BrowserStack / e-commerce actions
  if (/\bnavigate to the application\b/.test(s)) {
    actionSteps.push(
      `${next}. Open the application URL in a browser.`,
      `${next + 1}. Wait for the home page to load completely.`,
      `${next + 2}. Verify the product listings and site header are visible.`
    );
  } else if (/\baccess the sign in page\b/.test(s)) {
    actionSteps.push(
      `${next}. On the home page, locate the "Sign In" link in the header.`,
      `${next + 1}. Click "Sign In".`,
      `${next + 2}. Verify the Sign In page loads with Username and Password fields.`
    );
  } else if (/\blog in using valid demo credentials\b/.test(s)) {
    actionSteps.push(
      `${next}. On the Sign In page, click the "Username" dropdown and select a valid demo user.`,
      `${next + 1}. Click the "Password" dropdown and select the matching demo password.`,
      `${next + 2}. Click "Log In".`,
      `${next + 3}. Verify the user is redirected to the home page.`
    );
  } else if (/\buser name is displayed after successful login\b/.test(s)) {
    actionSteps.push(
      `${next}. After logging in, inspect the top-right corner of the header.`,
      `${next + 1}. Verify the logged-in user name is displayed.`
    );
  } else if (/\bno authentication errors\b/.test(s)) {
    actionSteps.push(
      `${next}. After logging in with valid credentials, check for error banners or alerts.`,
      `${next + 1}. Verify no authentication error message is displayed.`
    );
  } else if (/\bsearch for a product\b/.test(s)) {
    actionSteps.push(
      `${next}. Locate the search box on the home page.`,
      `${next + 1}. Type a product name (e.g. "iPhone") and submit the search.`,
      `${next + 2}. Verify matching products are displayed in the results.`
    );
  } else if (/\bfilter products by brand\b/.test(s)) {
    actionSteps.push(
      `${next}. Locate the brand filter on the product listing page.`,
      `${next + 1}. Select a brand (e.g. "Apple").`,
      `${next + 2}. Verify the product list updates to show only that brand.`
    );
  } else if (/\bfiltered products are displayed correctly\b/.test(s)) {
    actionSteps.push(
      `${next}. Apply a brand or category filter.`,
      `${next + 1}. Inspect each product card in the results.`,
      `${next + 2}. Verify all displayed products match the applied filter.`
    );
  } else if (/\bsearch and filter results are updated without page errors\b/.test(s)) {
    actionSteps.push(
      `${next}. Perform a search and then apply a brand filter.`,
      `${next + 1}. Watch the results area as it updates.`,
      `${next + 2}. Verify the results update in place with no page errors or console errors.`
    );
  } else if (/\bproduct details remain accessible after filtering\b/.test(s)) {
    actionSteps.push(
      `${next}. Apply a brand filter to the product list.`,
      `${next + 1}. Click on any filtered product card.`,
      `${next + 2}. Verify the product detail page opens and shows full details.`
    );
  } else if (/\bselect any available product\b/.test(s)) {
    actionSteps.push(
      `${next}. From the product listing, click on a product card.`,
      `${next + 1}. Verify the product detail page opens.`,
      `${next + 2}. Verify the product name, price, and image are displayed.`
    );
  } else if (/\badd the selected product to the cart\b/.test(s)) {
    actionSteps.push(
      `${next}. On a product detail page, click "Add to Cart".`,
      `${next + 1}. Verify the product is added without errors.`
    );
  } else if (/\bcart icon updates with the correct item count\b/.test(s)) {
    actionSteps.push(
      `${next}. Add a product to the cart.`,
      `${next + 1}. Inspect the cart icon in the header.`,
      `${next + 2}. Verify the cart icon shows the correct item count.`
    );
  } else if (/\badded product appears in the shopping cart\b/.test(s)) {
    actionSteps.push(
      `${next}. Add a product to the cart.`,
      `${next + 1}. Open the shopping cart.`,
      `${next + 2}. Verify the added product appears in the cart list.`
    );
  } else if (/\bproduct price and quantity are displayed correctly\b/.test(s)) {
    actionSteps.push(
      `${next}. Open the shopping cart containing the added product.`,
      `${next + 1}. Verify the product price matches the listing price.`,
      `${next + 2}. Verify the quantity is displayed correctly.`
    );
  } else {
    actionSteps.push(
      `${next}. Perform the action required by: "${scenario}".`,
      `${next + 1}. Verify the expected result is displayed.`
    );
  }
  return [...login, ...actionSteps].join('\n');
}

/** Map an acceptance criterion to a concrete expected-result statement. */
function expectedForScenario(scenario) {
  const s = String(scenario || '').toLowerCase();
  const table = [
    [/\bnavigate to the application\b/, 'The application loads and the home page is displayed.'],
    [/\baccess the sign in page\b/, 'The Sign In page is displayed with Username and Password fields.'],
    [/\blog in using valid demo credentials\b/, 'The user is logged in and redirected to the home page.'],
    [/\buser name is displayed\b/, 'The logged-in user name is visible in the header.'],
    [/\bno authentication errors\b/, 'No authentication error message is displayed.'],
    [/\bsearch for a product\b/, 'Matching products are displayed in the search results.'],
    [/\bfilter products by brand\b/, 'The product list is filtered to the selected brand.'],
    [/\bfiltered products are displayed correctly\b/, 'All displayed products match the applied filter.'],
    [/\bresults are updated without page errors\b/, 'Search/filter results update in place with no errors.'],
    [/\bproduct details remain accessible\b/, 'Product details open correctly after filtering.'],
    [/\bselect any available product\b/, 'The product detail page opens with full details.'],
    [/\badd the selected product to the cart\b/, 'The product is added to the cart successfully.'],
    [/\bcart icon updates with the correct item count\b/, 'The cart icon shows the correct item count.'],
    [/\badded product appears in the shopping cart\b/, 'The added product is visible in the shopping cart.'],
    [/\bproduct price and quantity are displayed correctly\b/, 'The cart shows the correct price and quantity.'],
    [/\bpim\b/, 'The employee record is created successfully in the PIM module.'],
    [/edit.*leave|leave.*edit|modify.*leave|leave.*modify/i, 'The existing leave request is updated successfully.'],
    [/\bleave\b/, 'The leave request is submitted successfully.'],
    [/\brecruitment\b/, 'The recruitment vacancies/candidates are displayed.'],
    [/\btime\b/, 'The employee timesheet is displayed with recorded hours.'],
    [/success.*confirmation|confirmation.*message/i, 'A success confirmation message is displayed.'],
    [/reflected.*(leave|list|history)|leave.*list.*history/i, 'The updated leave details are reflected in the Leave List/History.'],
  ];
  const hit = table.find(([re]) => re.test(s));
  return hit ? hit[1] : `The action for "${scenario}" completes successfully with the expected result displayed.`;
}

/**
 * Derive test cases from the requirement acceptance criteria + title.
 * The steps are app-aware: they use the base URL and credentials parsed from
 * the JIRA ticket, so SCRUM-10 (OrangeHRM) and SCRUM-32 (BrowserStack) get
 * completely different, correct test cases.
 */
function generateTestCases(requirements) {
  const criteria = requirements.acceptanceCriteria || [];
  const uiCases = [];
  const apiCases = [];

  const baseUrl = extractBaseUrl(requirements);
  const { username, password } = extractCredentials(requirements);
  const appName = (requirements.analysis && requirements.analysis.module) || 'the application';
  const site = detectSite(requirements);
  const isOrangeHrm = site === 'OrangeHRM';

  // Login steps — derived from the ticket, not hardcoded.
  const launchStep = baseUrl
    ? `1. Navigate to ${baseUrl}.`
    : '1. Launch the application.';
  const loginSteps = username && password
    ? [
        launchStep,
        `2. Sign in with username "${username}" and password "${password}".`,
        '3. Verify login succeeds and the home page loads.',
      ]
    : isOrangeHrm
      ? [
          '1. Launch the OrangeHRM application and log in as Admin.',
          '2. Navigate to My Info.',
          '3. Verify the page loads without errors.',
        ]
      : [
          launchStep,
          '2. Verify the application loads and is accessible.',
        ];

  // Always include a smoke test for the app.
  uiCases.push({
    tcid: 'TC_UI_01',
    scenario: `Verify ${appName} loads and is accessible`,
    steps: loginSteps.join('\n'),
    expected: 'The application loads successfully and is accessible.',
    priority: 'High',
    severity: 'Critical',
  });

  // Map each acceptance criterion to a UI test case with detailed, concrete
  // steps derived from the criterion's intent (not a vague placeholder).
  criteria.forEach((criterion, idx) => {
    const uiIdx = uiCases.length + 1;
    const scenario = criterion.replace(/^[\s]*([-*•]|\d+[.)]|#)\s+/, '').trim();
    // Skip structural / non-scenario criteria: the "Acceptance Criteria :"
    // header, and access-detail lines (URL / Username / Password) that are
    // credentials, not test scenarios.
    const sLower = scenario.toLowerCase();
    if (!scenario) return;
    if (/^acceptance criteria/i.test(sLower)) return;
    if (/^(url|username|user name|password)\b/.test(sLower)) return;

    uiCases.push({
      tcid: `TC_UI_0${uiIdx}`,
      scenario: `Verify: ${scenario}`,
      steps: buildDetailedSteps(scenario, { loginSteps, isOrangeHrm, appName }),
      expected: expectedForScenario(scenario),
      priority: 'Medium',
      severity: 'Major',
    });

    // API test — only for OrangeHRM (which has a backend); external apps like
    // BrowserStack have no local API to test.
    if (isOrangeHrm) {
      const apiEndpoint = apiEndpointForModule(scenario.toLowerCase());
      if (apiEndpoint) {
        const alreadyGenerated = apiCases.some(
          x => x.endpoint === apiEndpoint && x.method === 'GET'
        );
        if (alreadyGenerated) return;
        const apiIdx = apiCases.length + 1;
        apiCases.push({
          tcid: `TC_API_0${apiIdx}`,
          endpoint: apiEndpoint,
          method: 'GET',
          payload: '{}',
          expectedCode: '200',
          validation: `Response returns HTTP 200 and verifies the module is reachable`,
        });
      }
    }
  });

  // ── Demo/negative cases: exercise the self-healing and bug-reporting paths ──
  // TC_UI_HEAL uses a deliberately stale locator that times out on the first
  // attempt; the Self-Healing agent rewrites it to a working locator and the
  // test passes on re-run. TC_API_BUG / TC_UI_BUG assert something the app
  // genuinely violates, so a real JIRA bug is logged for it.
  uiCases.push({
    tcid: 'TC_UI_HEAL',
    scenario: 'Verify page renders with a resilient locator (self-heal demo)',
    steps: [
      '1. Launch the application.',
      '2. Wait for the main content area using the page container.',
      '3. Verify the page is visible.',
    ].join('\n'),
    expected: 'The page content is rendered and visible.',
    priority: 'Medium',
    severity: 'Major',
    healable: true,
  });

  if (isOrangeHrm) {
    // The mock backend intentionally accepts over-length nicknames (200) while
    // the requirement says 30 chars max — so this assertion genuinely fails.
    apiCases.push({
      tcid: 'TC_API_BUG',
      endpoint: '/api/personal-details',
      method: 'PUT',
      payload: JSON.stringify({ nickname: 'X'.repeat(31) }),
      expectedCode: '400',
      validation: 'Server rejects nicknames longer than 30 characters (known bug: backend accepts them)',
      knownBug: true,
    });
  } else {
    // Non-OrangeHRM app: a UI assertion that the app violates (e.g. an
    // element that doesn't exist) — logs a bug without needing a backend.
    uiCases.push({
      tcid: 'TC_UI_BUG',
      scenario: 'Verify the application exposes a session timeout notice',
      steps: [
        '1. Launch the application.',
        '2. Look for a session timeout notice on the page.',
        '3. Verify it is displayed.',
      ].join('\n'),
      expected: 'A session timeout notice is displayed (known bug: not implemented).',
      priority: 'Low',
      severity: 'Major',
      knownBug: true,
    });
  }

  return { uiCases, apiCases };
}

/** Map a detected module to a real API endpoint served by the dashboard backend. */
function apiEndpointForModule(module) {
  if (!module) return null;
  // Only endpoints the dashboard backend (dashboard/backend/server.js) actually
  // serves — generated tests must be runnable, not aspirational.
  const map = {
    'my info': '/api/personal-details',
    'personal': '/api/personal-details',
    'dashboard': '/api/results',
    'admin': '/api/results',
    'pim': '/api/results',
    'leave': '/api/results',
    'recruitment': '/api/results',
    'time': '/api/results',
    'explore': '/api/results',
    'orangehrm': '/api/results',
    'module': '/api/results',
  };
  // Any module with no dedicated endpoint still verifies the API is reachable
  // via the results endpoint (returns 200 on the live backend).
  return map[module] || '/api/results';
}

/**
 * Generate all test-case artifacts for a JIRA ticket.
 * Returns { uiCsv, apiCsv, testcases, writtenTo }.
 */
async function generateTestCasesFromRequirements(jiraId) {
  const artifactsDir = path.join(__dirname, `../artifacts/${jiraId}`);
  const reqPath = path.join(artifactsDir, 'requirements.json');
  if (!fs.existsSync(reqPath)) {
    throw new Error(`requirements.json not found for ${jiraId} — run the Requirement Agent first.`);
  }
  const requirements = JSON.parse(fs.readFileSync(reqPath, 'utf8'));
  const module = guessModule(requirements);

  const { uiCases, apiCases } = generateTestCases(requirements);

  // 1. UI CSV
  const uiCsvPath = path.join(artifactsDir, `${jiraId}_${module}_UI.csv`);
  const uiCsv = toCSV(['TCID', 'Scenario', 'Steps', 'Expected', 'Priority', 'Severity'], uiCases);

  // 2. API CSV
  const apiCsvPath = path.join(artifactsDir, `${jiraId}_${module}_API.csv`);
  const apiCsv = toCSV(
    ['TCID', 'Endpoint', 'Method', 'Payload', 'Expected Code', 'Validation'],
    apiCases.map(c => ({
      TCID: c.tcid,
      Endpoint: c.endpoint,
      Method: c.method,
      Payload: c.payload,
      'Expected Code': c.expectedCode,
      Validation: c.validation,
    }))
  );

  // 3. Structured manifest (consumed by the Playwright generator + dashboard)
  const app = {
    baseUrl: extractBaseUrl(requirements),
    username: extractCredentials(requirements).username,
    password: extractCredentials(requirements).password,
    site: detectSite(requirements),
    isOrangeHrm: detectSite(requirements) === 'OrangeHRM',
  };
  const testcases = {
    jiraId,
    module,
    app,
    generatedAt: new Date().toISOString(),
    source: requirements.source || 'JIRA',
    ui: uiCases,
    api: apiCases,
  };
  const testcasesPath = path.join(artifactsDir, 'testcases.json');

  fs.writeFileSync(uiCsvPath, uiCsv, 'utf8');
  fs.writeFileSync(apiCsvPath, apiCsv, 'utf8');
  fs.writeFileSync(testcasesPath, JSON.stringify(testcases, null, 2), 'utf8');

  console.log(`[TEST-GEN AGENT] Generated ${uiCases.length} UI + ${apiCases.length} API test cases for ${jiraId} (module: ${module})`);
  return { uiCsvPath, apiCsvPath, testcasesPath, uiCases, apiCases, testcases };
}

module.exports = { generateTestCasesFromRequirements, generateTestCases, toCSV, apiEndpointForModule, guessModule, extractBaseUrl, extractCredentials, detectSite };
