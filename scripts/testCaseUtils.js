/**
 * testCaseUtils.js
 * Shared helpers for parsing test-case CSV sources into structured, JIRA-format rows.
 * Handles quoted multi-line fields (steps) that break naive split-on-comma parsers.
 */
const ExcelJS = require('exceljs');

/**
 * Parse CSV text (including quoted fields containing commas and newlines)
 * into an array of objects keyed by the header row.
 */
function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;

  const textStr = String(text || '').replace(/^\uFEFF/, '');
  for (let i = 0; i < textStr.length; i++) {
    const ch = textStr[i];
    if (inQuotes) {
      if (ch === '"') {
        if (textStr[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      row.push(field);
      field = '';
    } else if (ch === '\n') {
      row.push(field);
      field = '';
      rows.push(row);
      row = [];
    } else if (ch !== '\r') {
      field += ch;
    }
  }
  // Flush the last field/row if the file does not end with a newline
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  if (rows.length === 0) return [];
  const headers = rows[0].map(h => h.trim());
  return rows.slice(1).map(r => {
    const obj = {};
    headers.forEach((h, idx) => { obj[h] = (r[idx] || '').trim(); });
    return obj;
  });
}

/**
 * Normalize a raw steps string into a numbered multi-line list,
 * one step per line (JIRA-friendly).
 */
function buildSteps(rawSteps) {
  if (!rawSteps) return '';
  const steps = String(rawSteps)
    .split(/\r?\n/)
    .map(s => s.trim())
    .filter(Boolean);

  return steps.map((step, idx) => `${idx + 1}. ${step.replace(/^\d+[.)]\s*/, '')}`).join('\n');
}

/**
 * Build a JIRA-format Excel workbook (sheet "Test Cases") from test-case rows.
 * Rows use the same column set the orchestrator's Excel agent writes.
 */
function buildTestCaseWorkbook(jiraId, rows) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Test Cases');

  // Column definitions (JIRA format)
  sheet.columns = [
    { header: 'Test Case ID',              key: 'tcid',       width: 18 },
    { header: 'Requirement ID (JIRA ID)',  key: 'jiraId',     width: 26 },
    { header: 'Test Summary',              key: 'summary',    width: 40 },
    { header: 'Test Steps',                key: 'steps',      width: 55 },
    { header: 'Expected Result',           key: 'expected',   width: 40 },
    { header: 'Actual Result',             key: 'actual',     width: 40 },
    { header: 'Priority',                  key: 'priority',   width: 12 },
    { header: 'Test Type',                 key: 'testType',   width: 18 },
    { header: 'Automation Status',         key: 'autoStatus', width: 20 },
    { header: 'Execution Status',          key: 'execStatus', width: 20 },
    { header: 'Defect ID',                 key: 'defectId',   width: 22 },
  ];

  // Style the header row
  sheet.getRow(1).eachCell(cell => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF6366F1' } };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = { bottom: { style: 'thin', color: { argb: 'FF000000' } } };
  });
  sheet.getRow(1).height = 28;

  // Populate rows (pre-execution: blank actuals, Not Run status)
  rows.forEach(tc => {
    const row = sheet.addRow({
      tcid:       tc.tcid,
      jiraId:     jiraId,
      summary:    tc.summary,
      steps:      tc.steps,
      expected:   tc.expected,
      actual:     '',
      priority:   tc.priority,
      testType:   tc.type,
      autoStatus: 'Automated',
      execStatus: 'Not Run',
      defectId:   ''
    });
    row.eachCell(cell => {
      cell.alignment = { vertical: 'top', wrapText: true };
      cell.border = { bottom: { style: 'hair', color: { argb: 'FFDDDDDD' } } };
    });
    // Height based on step count so multi-line steps render fully
    const stepLines = String(tc.steps || '').split('\n').length;
    row.height = Math.max(30, stepLines * 15 + 10);
  });

  return workbook;
}

module.exports = { parseCSV, buildSteps, buildTestCaseWorkbook };

