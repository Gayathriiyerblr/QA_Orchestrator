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
  const isOrangeHrm = /orangehrm|opensource-demo/i.test(`${requirements.description || ''} ${baseUrl || ''}`);

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

  // Map each acceptance criterion to a UI smoke test.
  criteria.forEach((criterion, idx) => {
    const c = String(criterion || '').toLowerCase();
    const uiIdx = uiCases.length + 1;
    const scenario = criterion.replace(/^[\s]*([-*•]|\d+[.)]|#)\s+/, '');
    uiCases.push({
      tcid: `TC_UI_0${uiIdx}`,
      scenario: `Verify acceptance criterion: ${scenario}`,
      steps: [
        ...loginSteps,
        ...(isOrangeHrm ? [`${loginSteps.length + 1}. Navigate to the relevant module.`] : []),
        `${loginSteps.length + (isOrangeHrm ? 2 : 1)}. Perform the action described in the acceptance criterion: ${scenario}.`,
        `${loginSteps.length + (isOrangeHrm ? 3 : 2)}. Verify the expected outcome.`,
      ].join('\n'),
      expected: `The system satisfies the criterion: ${criterion}`,
      priority: 'Medium',
      severity: 'Major',
    });

    // API test — only for OrangeHRM (which has a backend); external apps like
    // BrowserStack have no local API to test.
    if (isOrangeHrm) {
      const apiEndpoint = apiEndpointForModule(c);
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
    isOrangeHrm: /orangehrm|opensource-demo/i.test(`${requirements.description || ''} ${extractBaseUrl(requirements) || ''}`),
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

module.exports = { generateTestCasesFromRequirements, generateTestCases, toCSV, apiEndpointForModule, guessModule, extractBaseUrl, extractCredentials };
