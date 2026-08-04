/**
 * playwright-results-reporter.js
 * Custom Playwright reporter that writes artifacts/{JIRA_ID}/results.json
 * in the shape the orchestrator and report generator consume:
 *   { jiraId, suite, timestamp, total, passed, failed, results: [...] }
 *
 * The JIRA ID is derived from the spec path:
 *   websites/<Site>/tests/<JIRA_ID>/<jiraId>.spec.ts
 *   websites/<Site>/tests/<JIRA_ID>/<jiraId>-api.spec.ts
 * (e.g. websites/OrangeHRM/tests/SCRUM-10/scrum-10.spec.ts -> SCRUM-10)
 */
const fs = require('fs');
const path = require('path');

const SPEC_SUFFIX = '.spec.ts';

function deriveJiraId(testFile) {
  if (!testFile || !testFile.endsWith(SPEC_SUFFIX)) return null;
  const norm = testFile.split(path.sep).join('/');
  // Strip the "-api" marker from the spec filename, then read the parent dir
  // name as the JIRA ID (websites/<Site>/tests/<JIRA_ID>/<file>.spec.ts).
  const fileBase = path.basename(norm).replace(SPEC_SUFFIX, '').replace(/-api$/, '');
  const parentDir = path.basename(path.dirname(norm));
  const jiraFromParent = parentDir.toUpperCase();
  if (/^SCRUM-\d+$/.test(jiraFromParent)) return jiraFromParent;
  // Fallback for flat layouts: scrum-<N>.spec.ts in tests/.
  const legacy = norm.match(/[\\/]scrum-(\d+)(?:-api)?\.spec\.ts$/);
  if (legacy) return `SCRUM-${legacy[1]}`;
  // Final fallback: file base like "scrum-10".
  const fileMatch = fileBase.match(/^scrum-(\d+)$/i);
  if (fileMatch) return `SCRUM-${fileMatch[1]}`;
  return null;
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
    // Fall back to the first spec file found under websites/**/tests/**/
    try {
      const websitesDir = path.join(__dirname, '../websites');
      if (fs.existsSync(websitesDir)) {
        for (const site of fs.readdirSync(websitesDir)) {
          const testsRoot = path.join(websitesDir, site, 'tests');
          if (!fs.existsSync(testsRoot)) continue;
          const walk = dir => {
            for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
              const full = path.join(dir, entry.name);
              if (entry.isDirectory()) {
                const found = walk(full);
                if (found) return found;
              } else if (entry.name.endsWith(SPEC_SUFFIX)) {
                return full;
              }
            }
            return null;
          };
          const file = walk(testsRoot);
          if (file) return deriveJiraId(file);
        }
      }
    } catch { /* ignore */ }
    return 'SCRUM-10';
  }
}

module.exports = PlaywrightResultsReporter;
