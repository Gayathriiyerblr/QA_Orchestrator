/**
 * playwright-results-reporter.js
 * Custom Playwright reporter that writes artifacts/{JIRA_ID}/results.json
 * in the shape the orchestrator and report generator consume:
 *   { jiraId, suite, timestamp, total, passed, failed, results: [...] }
 *
 * The JIRA ID is derived from the spec filename: tests/<jiraId>.spec.ts
 * or tests/<jiraId>-api.spec.ts (e.g. scrum-10 -> SCRUM-10).
 */
const fs = require('fs');
const path = require('path');

const SPEC_PREFIX = 'scrum-';
const SPEC_SUFFIX = '.spec.ts';

function deriveJiraId(testFile) {
  const base = path.basename(testFile);
  if (!base.startsWith(SPEC_PREFIX) || !base.endsWith(SPEC_SUFFIX)) {
    return null;
  }
  const core = base.slice(SPEC_PREFIX.length, -SPEC_SUFFIX.length).replace('-api', '');
  return `SCRUM-${core}`.toUpperCase();
}

function normalizeTestId(fullTitle) {
  // Test titles are authored as "TC_UI_01: Update Personal Details Success".
  const match = fullTitle.match(/^(TC_[A-Z]+_\d+)/);
  return match ? match[1] : fullTitle;
}

class PlaywrightResultsReporter {
  constructor(options) {
    this.jiraId = (options && options.jiraId) || null;
    this.results = [];
    this.startTime = Date.now();
  }

  onTestBegin(test) {
    this.startTime = Date.now();
    // Derive the JIRA ID from the test file actually being run (e.g.
    // tests/scrum-32.spec.ts -> SCRUM-32). This is more reliable than scanning
    // the tests/ directory, which can pick the wrong spec when several exist.
    if (!this.jiraId) {
      const file = (test && test.location && test.location.file) || test.file;
      if (file) this.jiraId = deriveJiraId(file);
    }
  }

  onTestEnd(test, result) {
    const tcid = normalizeTestId(test.title);
    const entry = {
      tcid,
      status: result.status === 'passed' ? 'PASS' : 'FAIL',
      duration: `${((result.duration || 0) / 1000).toFixed(1)}s`,
    };
    if (result.status !== 'passed') {
      const error = result.errors && result.errors[0];
      let msg = error ? (error.message || 'Assertion failed during test execution.') : 'Assertion failed during test execution.';
      // Strip ANSI escape sequences that Playwright embeds in error messages
      msg = msg.replace(/\u001b\[[0-9;]*m/g, '');
      entry.error = msg;
    }
    this.results.push(entry);
  }

  onEnd() {
    const jiraId = this.jiraId || (this.results.length > 0 && this.guessJiraId()) || 'SCRUM-10';
    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;

    const payload = {
      jiraId,
      suite: 'Regression',
      timestamp: new Date().toISOString(),
      total: this.results.length,
      passed,
      failed,
      results: this.results,
    };

    const outPath = path.join(__dirname, `../artifacts/${jiraId}/results.json`);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, JSON.stringify(payload, null, 2), 'utf8');
    console.log(`[REPORTER] Wrote ${this.results.length} result(s) to ${outPath}`);
  }

  guessJiraId() {
    // Fall back to the first spec file found in tests/ matching our naming
    try {
      const testsDir = path.join(__dirname, '../tests');
      const file = fs.readdirSync(testsDir).find(f => f.endsWith(SPEC_SUFFIX));
      return file ? deriveJiraId(file) : 'SCRUM-10';
    } catch {
      return 'SCRUM-10';
    }
  }
}

module.exports = PlaywrightResultsReporter;
