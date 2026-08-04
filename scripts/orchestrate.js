const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const io = require('socket.io-client');
const ExcelJS = require('exceljs');
const generateReport = require('./generate_report');
const { parseCSV, buildSteps, buildTestCaseWorkbook } = require('./testCaseUtils');
const { logBug, postTestResultsToJira } = require('./jiraClient');
const { generateRequirements } = require('./generate_requirements');
const { generateTestCasesFromRequirements } = require('./generate_testcases_from_requirements');
const { generatePlaywrightScripts, resolveSite } = require('./generate_playwright_scripts');

const socket = io('http://localhost:5000');

// ─────────────────────────────────────────────────────────────────────────────
// Spec resolution — specs now live under websites/<Site>/tests/<JIRA_ID>/.
// Find the site folder for a JIRA ID (reads testcases.json when available).
// ─────────────────────────────────────────────────────────────────────────────
function findSiteForJira(jiraId) {
  const testcasesPath = path.join(__dirname, `../artifacts/${jiraId}/testcases.json`);
  if (fs.existsSync(testcasesPath)) {
    try {
      const app = JSON.parse(fs.readFileSync(testcasesPath, 'utf8')).app || {};
      const site = resolveSite(app);
      if (site) return site;
    } catch { /* fall through to scan */ }
  }
  // Fallback: scan websites/<Site>/tests/<JIRA_ID>/ for the spec.
  const websitesDir = path.join(__dirname, '../websites');
  if (fs.existsSync(websitesDir)) {
    for (const site of fs.readdirSync(websitesDir)) {
      const specDir = path.join(websitesDir, site, 'tests', jiraId.toUpperCase());
      if (fs.existsSync(specDir)) return site;
    }
  }
  return null;
}

/** Resolve the spec paths for a JIRA ticket, or [] when not found. */
function resolveSpecsForJira(jiraId) {
  const site = findSiteForJira(jiraId);
  if (!site) return [];
  const testDir = path.join(__dirname, `../websites/${site}/tests/${jiraId.toUpperCase()}`);
  const specs = [];
  const ui = path.join(testDir, `${jiraId.toLowerCase()}.spec.ts`);
  const api = path.join(testDir, `${jiraId.toLowerCase()}-api.spec.ts`);
  if (fs.existsSync(ui)) specs.push(path.relative(path.join(__dirname, '..'), ui).split(path.sep).join('/'));
  if (fs.existsSync(api)) specs.push(path.relative(path.join(__dirname, '..'), api).split(path.sep).join('/'));
  return specs;
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared helper: write an Excel workbook even when the target file is locked
// by an open Excel session. Retries briefly, then falls back to a `<name>.locked`
// sibling so the run never aborts.
// ─────────────────────────────────────────────────────────────────────────────
async function writeExcelSafely(workbook, outPath, label) {
  try {
    await workbook.xlsx.writeFile(outPath);
    console.log(`[TEST-CASE AGENT] ${label}: ${outPath}`);
    return { writtenTo: outPath };
  } catch (err) {
    if (err.code !== 'EBUSY' && err.code !== 'EPERM') throw err;
    console.warn(`[TEST-CASE AGENT] ${outPath} is locked (open in Excel). Retrying...`);
    for (let attempt = 1; attempt <= 5; attempt++) {
      await new Promise(r => setTimeout(r, 1500));
      try {
        await workbook.xlsx.writeFile(outPath);
        console.log(`[TEST-CASE AGENT] ${label}: ${outPath}`);
        return { writtenTo: outPath };
      } catch (retryErr) {
        if (retryErr.code !== 'EBUSY' && retryErr.code !== 'EPERM') throw retryErr;
      }
    }
    const altPath = outPath.replace(/\.xlsx$/i, '.locked.xlsx');
    await workbook.xlsx.writeFile(altPath);
    console.warn(`[TEST-CASE AGENT] ${label}: ${outPath} still locked; wrote to ${altPath}. Close Excel and re-run to update the primary sheet.`);
    return { writtenTo: altPath };
  }
}

// AI Agent Module Imports (Conceptual or Real)
const SelfHealer = require('./SelfHealer');
const selfHealer = new SelfHealer();

async function logJiraBugs(jiraId, failedTestCases) {
  const reqPath = path.join(__dirname, `../artifacts/${jiraId}/requirements.json`);
  const requirements = fs.existsSync(reqPath) ? JSON.parse(fs.readFileSync(reqPath, 'utf8')) : null;

  let loggedCount = 0;

  // 1. Log bug for each failed test case (UI or API)
  for (const tc of failedTestCases) {
    const base = String(tc.tcid || '').split(':')[0].trim();
    if (requirements && (requirements.bugs || []).some(b => String(b.tcid || '').split(':')[0].trim() === base)) continue;
    const bug = {
      tcid: tc.tcid,
      title: `[BUG] Test Case ${base} failed`,
      description: `Test case ${tc.tcid} failed during automated execution.\nError: ${tc.error || 'Assertion failed during test execution.'}`,
      severity: tc.tcid.startsWith('TC_API') ? 'High' : 'High',
      status: 'Open'
    };

    const logged = await logBug(jiraId, bug);
    loggedCount++;

    socket.emit('update_status', {
      type: 'STATUS_UPDATE',
      status: `Bug Agent: Logged ${logged.bugId} under user story ${jiraId}${logged.loggedToJira ? ' (JIRA)' : ' (mock)'}`
    });
    console.log(`[BUG AGENT] Logged ticket: ${logged.bugId}${logged.loggedToJira ? ` -> ${logged.jiraUrl}` : ' (mock)'}`);
  }

  // 2. Log bug for Military Service field — ONLY when the ticket is actually
  // about My Info / Personal Details (leftover from the old hand-written story;
  // it must not fire for unrelated tickets).
  const isPersonalDetailsStory = requirements &&
    (/(my info|personal detail)/i.test(requirements.title || '') ||
     /(my info|personal detail)/i.test(requirements.description || ''));
  if (isPersonalDetailsStory && !(requirements.bugs || []).some(b => b.tcid === 'TC_UI_MILITARY')) {
    const logged = await logBug(jiraId, {
      tcid: "TC_UI_MILITARY",
      title: `[BUG] Military Service field is completely missing from the Personal Details form`,
      description: `The user story requirements specify updating the Military Service field, but this field is not present on the Personal Details page in the OrangeHRM system.`,
      severity: "Medium",
      status: "Open"
    });
    loggedCount++;

    socket.emit('update_status', {
      type: 'STATUS_UPDATE',
      status: `Bug Agent: Logged ${logged.bugId} under user story ${jiraId}${logged.loggedToJira ? ' (JIRA)' : ' (mock)'}`
    });
    console.log(`[BUG AGENT] Logged ticket: ${logged.bugId}${logged.loggedToJira ? ` -> ${logged.jiraUrl}` : ' (mock)'}`);
  }

  if (loggedCount > 0) {
    console.log(`[BUG AGENT] Logged ${loggedCount} bug(s) for ${jiraId}.`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Excel Test Case Sheet Generator (JIRA Format) – Phase 1.5
// Runs BEFORE test execution. Builds the sheet from the JIRA-derived test-case
// manifest (testcases.json) so the Excel always traces back to the JIRA ticket.
// ─────────────────────────────────────────────────────────────────────────────
async function generateInitialExcelTestCases(jiraId) {
  const artifactsDir = path.join(__dirname, `../artifacts/${jiraId}`);
  const testcasesPath = path.join(artifactsDir, 'testcases.json');
  if (!fs.existsSync(testcasesPath)) return;

  const testcases = JSON.parse(fs.readFileSync(testcasesPath, 'utf8'));

  // UI test cases from the generated manifest
  const uiRows = (testcases.ui || []).map(tc => ({
    tcid: tc.tcid,
    summary: tc.scenario,
    steps: buildSteps(tc.steps),
    expected: tc.expected,
    priority: tc.priority || 'Medium',
    type: 'UI'
  })).filter(r => r.tcid);

  // API test cases from the generated manifest
  const apiRows = (testcases.api || []).map(tc => {
    const method = (tc.method || 'GET').toUpperCase();
    const payload = (tc.payload || '{}').trim();
    const expectedCode = tc.expectedCode || '200';
    const validation = tc.validation || '';
    return {
      tcid: tc.tcid,
      summary: `${method} ${tc.endpoint}`,
      steps: `1. Send a ${method} request to ${tc.endpoint}.\n2. Payload: ${payload}\n3. Verify the response status code and body.`,
      expected: `HTTP ${expectedCode} - ${validation}`,
      priority: 'Medium',
      type: 'API'
    };
  }).filter(r => r.tcid);

  const allRows = [...uiRows, ...apiRows];

  const workbook = buildTestCaseWorkbook(jiraId, allRows);

  const outPath = path.join(artifactsDir, `${jiraId}_TestCases.xlsx`);
  await writeExcelSafely(workbook, outPath, 'JIRA-format test case sheet generated');
  socket.emit('update_status', { type: 'STATUS_UPDATE', status: 'Test Case Agent: Generated JIRA Excel sheet.' });
}

// ─────────────────────────────────────────────────────────────────────────────
// Excel Test Case Results Updater – Phase 8
// Runs AFTER test execution. Updates actuals, statuses, and defect IDs.
// ─────────────────────────────────────────────────────────────────────────────
async function updateExcelTestCasesWithResults(jiraId, results) {
  const artifactsDir = path.join(__dirname, `../artifacts/${jiraId}`);
  const xlsxPath = path.join(artifactsDir, `${jiraId}_TestCases.xlsx`);
  if (!fs.existsSync(xlsxPath)) {
    console.warn('[TEST-CASE AGENT] Excel sheet not found, skipping update.');
    return;
  }

  // Load bugs from requirements.json for Defect ID mapping
  const reqPath = path.join(artifactsDir, 'requirements.json');
  const requirements = fs.existsSync(reqPath) ? JSON.parse(fs.readFileSync(reqPath, 'utf8')) : {};
  const bugs = requirements.bugs || [];

  const testCases = results.results || [];
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(xlsxPath);
  const sheet = workbook.getWorksheet('Test Cases');

  // Build lookup maps
  const resultsMap = {};
  testCases.forEach(tc => { resultsMap[tc.tcid] = tc; });
  const bugsMap = {};
  bugs.forEach(b => { bugsMap[b.tcid] = b.bugId; });

  // Header is row 1; data starts at row 2.
  // Column letters (persist across file reads; keys do not).
  const COL = { tcid: 'A', actual: 'F', autoStatus: 'I', execStatus: 'J', defectId: 'K' };

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // skip header
    const tcid = row.getCell(COL.tcid).value;
    if (!tcid) return;

    const result = resultsMap[tcid];
    if (result) {
      const isPassed = result.status === 'PASS';
      // Actual Result
      row.getCell(COL.actual).value = isPassed
        ? 'Test passed successfully.'
        : (result.error || 'Assertion failed.');
      // Execution Status
      const execCell = row.getCell(COL.execStatus);
      execCell.value = isPassed ? 'Pass' : 'Fail';
      execCell.font = { bold: true, color: { argb: isPassed ? 'FF22C55E' : 'FFEF4444' } };
      // Defect ID
      if (!isPassed && bugsMap[tcid]) {
        row.getCell(COL.defectId).value = bugsMap[tcid];
        row.getCell(COL.defectId).font = { color: { argb: 'FFEF4444' } };
      }
    }
    // Always mark as Automated since we ran the tests
    row.getCell(COL.autoStatus).value = 'Automated';
  });

  // Also flag the Military Service bug row if present (no direct test case result)
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const tcid = row.getCell(COL.tcid).value;
    if (tcid === 'TC_UI_MILITARY' || tcid === 'TC_UI_03') {
      if (!row.getCell(COL.defectId).value && bugsMap[tcid]) {
        row.getCell(COL.defectId).value = bugsMap[tcid];
        row.getCell(COL.defectId).font = { color: { argb: 'FFEF4444' } };
      }
    }
  });

  await writeExcelSafely(workbook, xlsxPath, 'Excel test case sheet updated with execution results');
  socket.emit('update_status', { type: 'STATUS_UPDATE', status: 'Test Case Agent: Updated Excel with results & defect IDs.' });
}

async function orchestrate(jiraId) {
  console.log(`[ORCHESTRATOR] Starting workflow for ${jiraId}`);
  socket.emit('update_status', { type: 'STATUS_UPDATE', status: 'Jira Agent: Fetching Ticket...' });

  // 1. Requirement Agent Work (Phase 1)
  // Requirements are derived from the live JIRA ticket (source of truth), not
  // from a hand-written local file. If JIRA is unreachable, it falls back to a
  // saved local prompt so the pipeline still works offline.
  socket.emit('update_status', { type: 'STATUS_UPDATE', status: `Requirement Agent: Fetching ${jiraId} from JIRA...` });
  const reqGen = await generateRequirements(jiraId);
  if (!reqGen.written) {
    console.error(`[ORCHESTRATOR] Could not obtain requirements for ${jiraId}. Aborting.`);
    return;
  }

  const reqPath = path.join(__dirname, `../artifacts/${jiraId}/requirements.json`);
  const requirements = JSON.parse(fs.readFileSync(reqPath, 'utf8'));
  console.log(`[ORCHESTRATOR] Requirement (${reqGen.source}): ${requirements.title}`);

    // 1.2 AI Test Generation (Phase 2)
    // Derive UI + API test cases from the JIRA requirements and write the
    // CSV/testcases.json manifest that the Excel + automation layers consume.
    socket.emit('update_status', { type: 'STATUS_UPDATE', status: 'Test Gen Agent: Generating UI & API test cases...' });
    try {
      await generateTestCasesFromRequirements(jiraId);
    } catch (genErr) {
      console.warn(`[ORCHESTRATOR] Test generation skipped: ${genErr.message}`);
    }

    // 1.5 Generate JIRA-Format Excel Test Case Sheet (Pre-execution)
    socket.emit('update_status', { type: 'STATUS_UPDATE', status: 'Test Case Agent: Generating JIRA Excel test cases...' });
    await generateInitialExcelTestCases(jiraId);

    // 3. Automation Code Generation (Phase 3)
    // Transform the generated test cases into POM Playwright scripts so the
    // execution step below always runs the latest JIRA-derived tests.
    socket.emit('update_status', { type: 'STATUS_UPDATE', status: 'Automation Agent: Generating Playwright scripts...' });
    try {
      const gen = generatePlaywrightScripts(jiraId);
      socket.emit('update_status', { type: 'DATA_UPDATE', data: { automationGenerated: true, recentLogs: [`Generated ${gen.testcases.ui.length} UI + ${gen.testcases.api.length} API specs`] } });
    } catch (genErr) {
      console.warn(`[ORCHESTRATOR] Playwright generation skipped: ${genErr.message}`);
    }

    // 2. Execute Tests (Phase 4)
    socket.emit('update_status', { type: 'STATUS_UPDATE', status: 'Launching Browser & Running Tests...' });
    try {
      console.log(`[ORCHESTRATOR] Launching real browser for ${jiraId}...`);
      
      // Execute real playwright tests in headed mode.
      // UI spec: websites/<Site>/tests/<JIRA_ID>/<jiraId>.spec.ts
      // API spec: websites/<Site>/tests/<JIRA_ID>/<jiraId>-api.spec.ts
      const specsToRun = resolveSpecsForJira(jiraId);

      if (specsToRun.length > 0) {
        // Run from the ROOT directory so Playwright finds the config and tests
        execSync(`npx playwright test ${specsToRun.join(' ')} --headed`, { 
          stdio: 'inherit', 
          cwd: path.join(__dirname, '..') 
        });
      } else {
        console.warn(`[ORCHESTRATOR] No specific test file found for ${jiraId}. Running simulation instead.`);
        // Fallback to simulation if no real test exists yet
        await new Promise(r => setTimeout(r, 2000));
      }

      const results = JSON.parse(fs.readFileSync(path.join(__dirname, `../artifacts/${jiraId}/results.json`), 'utf8'));
    
    // Check if we have an array of test results to iterate over
    const testCases = results.results || [];
    
    // Call Bug Agent if there are failed test cases
    const failedCases = testCases.filter(r => r.status === 'FAIL');
    await logJiraBugs(jiraId, failedCases);

    // Phase 8: Update Excel test case sheet with execution results
    socket.emit('update_status', { type: 'STATUS_UPDATE', status: 'Test Case Agent: Updating Excel with results...' });
    await updateExcelTestCasesWithResults(jiraId, results);

    // Phase 8.5: Post test-case sheet to JIRA (attachment, or comment fallback)
    socket.emit('update_status', { type: 'STATUS_UPDATE', status: 'Bug Agent: Posting test results to JIRA...' });
    await postTestResultsToJira(jiraId, results);

    if (testCases.length > 0) {
      for (const res of testCases) {
        socket.emit('update_status', { 
          type: 'DATA_UPDATE', 
          data: { 
            totalTests: results.total || testCases.length,
            passed: results.passed,
            failed: results.failed,
            recentLogs: [`Executed ${res.tcid}: ${res.status}`]
          } 
        });
        await new Promise(r => setTimeout(r, 1000));
      }
    }

    // 3. AI Insights (Phase 9)
    socket.emit('update_status', { type: 'STATUS_UPDATE', status: 'Generating AI Insights...' });
    const insights = generateAIInsights(results);
    fs.writeFileSync(path.join(__dirname, `../artifacts/${jiraId}/insights.json`), JSON.stringify(insights, null, 2));

    socket.emit('update_status', { type: 'STATUS_UPDATE', status: 'Workflow Complete' });
    console.log(`[ORCHESTRATOR] Workflow finished for ${jiraId}`);

    // Generate Final HTML Report
    generateReport(jiraId);

    } catch (error) {
      console.error(`[ORCHESTRATOR] Execution failed:`, error);

      // 4. Self-Healing Agent (Phase 5)
      // Identify the failed tests, heal each healable one, then re-run the
      // affected spec to confirm the fix. Tests that pass after healing are
      // marked PASS; the rest are reported as bugs.
      socket.emit('update_status', { type: 'STATUS_UPDATE', status: 'Self-Heal Agent: Attempting recovery...' });
      const resultsPath = path.join(__dirname, `../artifacts/${jiraId}/results.json`);
      const failedCases = fs.existsSync(resultsPath)
        ? (JSON.parse(fs.readFileSync(resultsPath, 'utf8')).results || []).filter(r => r.status === 'FAIL')
        : [];

      const healableFailures = failedCases.filter(r => String(r.tcid).includes('HEAL'));
      if (healableFailures.length > 0) {
        console.log(`[SELF-HEAL] Found ${healableFailures.length} healable failure(s): ${healableFailures.map(r => r.tcid).join(', ')}`);
        for (const tc of healableFailures) {
          try {
            const healed = await selfHealer.heal(jiraId, tc.tcid, '.self-heal-stale-locator', tc.error || 'Locator timeout');
            console.log(`[SELF-HEAL] ${tc.tcid} healed to: ${healed.newLocator}`);
            // Patch the site's locators file so the re-run uses the healed locator.
            const site = findSiteForJira(jiraId);
            if (site) {
              // The healable locator lives in DemoLocators.locators.ts.
              selfHealer.patchLocators(jiraId, site, 'DemoLocators', '.self-heal-stale-locator', healed.newLocator);
            } else {
              selfHealer.patchSpec(jiraId, '.self-heal-stale-locator', healed.newLocator);
            }
          } catch (healError) {
            console.error(`[SELF-HEAL] Healing ${tc.tcid} failed:`, healError.message);
          }
        }
        socket.emit('update_status', { type: 'DATA_UPDATE', data: { healed: healableFailures.length } });

        // Re-run the spec so healed tests pass and only true failures remain.
        try {
          const specsToRun = resolveSpecsForJira(jiraId);
          if (specsToRun.length > 0) {
            execSync(`npx playwright test ${specsToRun.join(' ')}`, { stdio: 'inherit', cwd: path.join(__dirname, '..') });
          }
        } catch (rerunErr) {
          console.warn(`[SELF-HEAL] Re-run after healing reported failures (expected for known bugs):`, rerunErr.message);
        }
      } else {
        console.log('[SELF-HEAL] No healable (flaky-locator) failures detected.');
      }

      // 5. Bug Agent (Phase 6) — only log bugs for persistent failures.
      socket.emit('update_status', { type: 'STATUS_UPDATE', status: 'Bug Agent: Reporting failures to Jira...' });
      console.log(`[BUG AGENT] Creating Jira ticket for persistent failures.`);

      try {
        if (fs.existsSync(resultsPath)) {
          const results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
          const persistentFailures = (results.results || []).filter(r => r.status === 'FAIL' && !String(r.tcid).includes('HEAL'));
          await logJiraBugs(jiraId, persistentFailures);
          // Update Excel even on failure — so results are captured
          await updateExcelTestCasesWithResults(jiraId, results);
          // Post test-case sheet + execution summary comment to JIRA (even on failure)
          await postTestResultsToJira(jiraId, results);
        } else {
          await logJiraBugs(jiraId, [{ tcid: 'EXEC_FAIL', status: 'FAIL', error: error.message }]);
        }
      } catch (err) {
        console.error('[BUG AGENT] Failed to log bugs or update Excel:', err.message);
      }

      // 6. AI Insights (Phase 9) — generate on failure too, so the insights
      // always reflect the actual run (previously a stale "all passed" insight
      // could remain from an earlier successful run and contradict the bugs).
      socket.emit('update_status', { type: 'STATUS_UPDATE', status: 'Generating AI Insights...' });
      try {
        if (fs.existsSync(resultsPath)) {
          const results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
          const insights = generateAIInsights(results);
          fs.writeFileSync(path.join(__dirname, `../artifacts/${jiraId}/insights.json`), JSON.stringify(insights, null, 2));
          console.log(`[ORCHESTRATOR] AI insights generated for ${jiraId} (failure run).`);
        }
      } catch (insightErr) {
        console.error('[ORCHESTRATOR] Failed to generate AI insights:', insightErr.message);
      }

      // Always generate the HTML report so it reflects the latest run (even on failure)
      try {
        generateReport(jiraId);
      } catch (reportErr) {
        console.error('[REPORTER] Failed to generate report:', reportErr.message);
      }
      
      socket.emit('update_status', { type: 'STATUS_UPDATE', status: 'Error handled' });
    }
}

/**
 * Generate AI insights for a run using the Command Code CLI (cmdc -p), which
 * routes through the user's configured LLM. When multiple test cases fail, the
 * LLM is asked for a per-test-case root cause + suggestion (keyed by TCID), so
 * each bug gets its own analysis. Falls back to static diagnostics when cmdc
 * is unavailable, times out, or the run passed cleanly.
 */
function generateAIInsights(results) {
  const testCases = results.results || [];
  const failures = testCases.filter(r => r.status === 'FAIL');

  // No failure — keep the concise summary.
  if (failures.length === 0 && results.status !== 'FAIL') {
    return { summary: 'All tests passed. System stable.' };
  }

  const prompt = [
    'You are a senior QA automation engineer analyzing a Playwright test execution run with failing test cases.',
    'For EACH failing test case below, provide:',
    '1. ROOT_CAUSE_<TCID>: a concise 1-2 sentence root cause analysis specific to that test.',
    '2. SUGGESTION_<TCID>: a concrete, actionable fix recommendation (locator strategy, wait, or logic).',
    'Use the exact test case IDs in the markers. Return ONLY those lines.',
    '',
    failures
      .map(r => `- ${r.tcid} (${String(r.tcid).includes('API') ? 'API' : 'UI'}): ${(r.error || 'No error detail').split('\n').join(' | ')}`)
      .join('\n'),
  ].join('\n');

  try {
    const out = execSync(
      `cmdc -p ${JSON.stringify(prompt)} --skip-onboarding --no-auto-update --no-session`,
      { encoding: 'utf8', timeout: 120000, stdio: ['pipe', 'pipe', 'ignore'] }
    ).trim();

    // Parse per-test-case ROOT_CAUSE_<TCID> / SUGGESTION_<TCID> lines.
    const insights = {};
    for (const tc of failures) {
      const id = tc.tcid;
      const rc = (out.match(new RegExp(`ROOT_CAUSE_${id}\\s*:\\s*(.+)`, 'i')) || [])[1];
      const sug = (out.match(new RegExp(`SUGGESTION_${id}\\s*:\\s*(.+)`, 'i')) || [])[1];
      if (rc || sug) {
        insights[id] = {
          rootCause: (rc || 'No root cause identified.').trim(),
          suggestion: (sug || 'Review the failing test case and execution logs.').trim(),
        };
      }
    }

    if (Object.keys(insights).length > 0) {
      return { insights, generatedBy: 'LLM (Command Code)' };
    }
    console.warn('[INSIGHTS] LLM response lacked per-test markers, using fallback.');
  } catch (err) {
    console.warn('[INSIGHTS] LLM call failed, using fallback:', err.message);
  }

  // Static fallback if the LLM call failed — one generic entry per failing test.
  const fallbackInsights = {};
  for (const tc of failures) {
    fallbackInsights[tc.tcid] = {
      rootCause: 'Locator timeout / assertion mismatch detected. DOM structure or API contract may have changed.',
      suggestion: 'Review the failing test case, locator strategy, and expected vs actual values.',
    };
  }
  if (Object.keys(fallbackInsights).length > 0) return { insights: fallbackInsights };

  return {
    insights: {
      GLOBAL: {
        rootCause: 'Global execution failure detected in regression suite.',
        suggestion: 'Review logs in artifacts for detailed stack trace.',
      },
    },
  };
}

// Get Jira ID from command line or default to SCRUM-10. Normalize unicode dashes/hyphens.
const targetJiraId = (process.argv[2] || 'SCRUM-10')
  .trim()
  .replace(/[\u2010\u2011\u2012\u2013\u2014\u2212]/g, '-');

let orchestrationStarted = false;

socket.on('connect', () => {
  if (orchestrationStarted) return; // Prevent re-runs on reconnect
  orchestrationStarted = true;
  console.log(`[ORCHESTRATOR] Connected to backend. Starting orchestration for ${targetJiraId}...`);
  orchestrate(targetJiraId).finally(() => {
    console.log('[ORCHESTRATOR] Disconnecting from backend...');
    socket.disconnect();
    setTimeout(() => process.exit(0), 1000); // Allow final socket messages to flush
  });
});

socket.on('connect_error', (err) => {
  console.error('[ORCHESTRATOR] Connection error:', err.message);
  process.exit(1);
});
