/**
 * jiraClient.js
 * Thin client for logging bugs to JIRA.
 *
 * - When JIRA_URL / JIRA_USER_EMAIL / JIRA_API_TOKEN are set in the environment,
 *   bugs are created via the JIRA Cloud REST API (v3) under the parent story
 *   (parent key = the SCRUM ticket being orchestrated).
 * - Otherwise it falls back to the local mock: the bug is appended to
 *   artifacts/{jiraId}/requirements.json under a `bugs[]` array (so the
 *   orchestrator/report flow keeps working offline).
 */
const fs = require('fs');
const path = require('path');

// Load .env from the project root if present (native, no dependency).
// Lets JIRA credentials live in a gitignored .env instead of the environment.
try {
  const envPath = path.join(__dirname, '../.env');
  if (fs.existsSync(envPath)) {
    for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      if (process.env[key] === undefined) process.env[key] = value;
    }
  }
} catch { /* ignore env load errors */ }

const MAX_ATTEMPTS = 3;
const BACKOFF_MS = 1000;

function isJiraConfigured() {
  return !!(process.env.JIRA_URL && process.env.JIRA_USER_EMAIL && process.env.JIRA_API_TOKEN);
}

function buildBugPayload(bug, parentKey) {
  const summary = bug.title || `[BUG] ${bug.tcid} failed`;

  // Description as ADF (JIRA Cloud requires ADF for descriptions on create).
  const paragraphs = [
    `${bug.description || 'Test case failed during automated execution.'}`,
    `Test Case: ${bug.tcid}`,
    `Severity: ${bug.severity || 'Medium'}`,
    `Environment: Automated Playwright Execution, Chrome`,
    `Reported via: OrchestrAI`,
    `Parent Story: ${parentKey || 'N/A'}`,
  ];

  const description = {
    type: 'doc',
    version: 1,
    content: paragraphs.map(text => ({
      type: 'paragraph',
      content: [{ type: 'text', text }],
    })),
  };

  const fields = {
    project: { key: parentKey.split('-')[0] },
    summary,
    description,
    issuetype: { name: 'Bug' },
  };

  // NOTE: `parent` is only valid for sub-task issue types. SCRUM-10 is a Story,
  // so we do not set it here; the link to the parent is added after creation
  // via the issue links API (createJiraBug).
  return fields;
}

async function createJiraBug(bug, parentKey) {
  const baseUrl = process.env.JIRA_URL.replace(/\/+$/, '');
  const email = process.env.JIRA_USER_EMAIL;
  const token = process.env.JIRA_API_TOKEN;
  const auth = Buffer.from(`${email}:${token}`).toString('base64');

  const payload = buildBugPayload(bug, parentKey);
  const url = `${baseUrl}/rest/api/3/issue`;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fields: payload }),
      });

      if (res.ok) {
        const data = await res.json();
        const key = data.key || data.id;
        // Link the bug to the parent story (works for any issue type).
        if (parentKey) {
          try {
            const linkRes = await fetch(`${baseUrl}/rest/api/3/issueLink`, {
              method: 'POST',
              headers: {
                Authorization: `Basic ${auth}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                type: { name: 'Relates' },
                inwardIssue: { key },
                outwardIssue: { key: parentKey },
              }),
            });
            if (!linkRes.ok) {
              console.warn(`[BUG AGENT] Issue link to ${parentKey} failed (${linkRes.status}) - bug still created.`);
            }
          } catch (linkErr) {
            console.warn(`[BUG AGENT] Issue link to ${parentKey} failed: ${linkErr.message} - bug still created.`);
          }
        }
        return { ok: true, key, url: `${baseUrl}/browse/${key}` };
      }

      const errText = await res.text();
      if (res.status === 429 || res.status >= 500) {
        // Transient — retry with backoff
        await new Promise(r => setTimeout(r, BACKOFF_MS * attempt));
        continue;
      }
      return { ok: false, error: `JIRA API ${res.status}: ${errText.slice(0, 500)}` };
    } catch (err) {
      if (attempt === MAX_ATTEMPTS) {
        return { ok: false, error: `JIRA request failed: ${err.message}` };
      }
      await new Promise(r => setTimeout(r, BACKOFF_MS * attempt));
    }
  }
  return { ok: false, error: 'JIRA request failed after retries' };
}

/**
 * Log a bug. Returns the JIRA key (real or mock).
 */
/** Normalize a TCID to its base key (strip scenario suffix: "TC_API_BUG: PUT ..." -> "TC_API_BUG"). */
function baseTcid(tcid) {
  return String(tcid || '').split(':')[0].trim();
}

async function logBug(jiraId, bug) {
  if (isJiraConfigured()) {
    // Guard: skip if a bug already exists for this test case (dedup by TCID).
    const existing = readBugs(jiraId);
    if (existing.some(b => baseTcid(b.tcid) === baseTcid(bug.tcid))) {
      console.log(`[BUG AGENT] Bug for ${baseTcid(bug.tcid)} already logged under ${jiraId}; skipping duplicate.`);
      const dup = existing.find(b => baseTcid(b.tcid) === baseTcid(bug.tcid));
      return { ...bug, bugId: dup.bugId, jiraUrl: dup.jiraUrl, status: 'Open', loggedToJira: !!dup.jiraUrl };
    }
    const result = await createJiraBug(bug, jiraId);
    if (result.ok) {
      // Record the real JIRA key so subsequent runs don't duplicate the bug.
      recordBugInRequirements(jiraId, { ...bug, bugId: result.key, jiraUrl: result.url, loggedToJira: true });
      return { ...bug, bugId: result.key, jiraUrl: result.url, status: 'Open', loggedToJira: true };
    }
    console.warn(`[BUG AGENT] JIRA API failed (${result.error}); falling back to local mock.`);
  }

  // Mock fallback: append to requirements.json bugs[]
  const reqPath = path.join(__dirname, `../artifacts/${jiraId}/requirements.json`);
  if (fs.existsSync(reqPath)) {
    const requirements = JSON.parse(fs.readFileSync(reqPath, 'utf8'));
    requirements.bugs = requirements.bugs || [];
    const mockId = `BUG-${jiraId}-${baseTcid(bug.tcid)}`;
    if (!requirements.bugs.some(b => baseTcid(b.tcid) === baseTcid(bug.tcid))) {
      requirements.bugs.push({
        bugId: mockId,
        tcid: bug.tcid,
        title: bug.title,
        description: bug.description,
        severity: bug.severity || 'Medium',
        status: 'Open',
        loggedToJira: false,
      });
      fs.writeFileSync(reqPath, JSON.stringify(requirements, null, 2), 'utf8');
    }
    return { ...bug, bugId: mockId, status: 'Open', loggedToJira: false };
  }

  return { ...bug, bugId: `BUG-${jiraId}-${baseTcid(bug.tcid)}`, status: 'Open', loggedToJira: false };
}

/** Read the current bugs[] array for a ticket (empty array if absent). */
function readBugs(jiraId) {
  try {
    const reqPath = path.join(__dirname, `../artifacts/${jiraId}/requirements.json`);
    if (!fs.existsSync(reqPath)) return [];
    const requirements = JSON.parse(fs.readFileSync(reqPath, 'utf8'));
    return Array.isArray(requirements.bugs) ? requirements.bugs : [];
  } catch {
    return [];
  }
}

/** Append a logged bug to artifacts/{jiraId}/requirements.json (dedup keyed by base TCID). */
function recordBugInRequirements(jiraId, bug) {
  try {
    const reqPath = path.join(__dirname, `../artifacts/${jiraId}/requirements.json`);
    if (!fs.existsSync(reqPath)) return;
    const requirements = JSON.parse(fs.readFileSync(reqPath, 'utf8'));
    requirements.bugs = requirements.bugs || [];
    if (!requirements.bugs.some(b => baseTcid(b.tcid) === baseTcid(bug.tcid))) {
      requirements.bugs.push({
        bugId: bug.bugId,
        tcid: bug.tcid,
        title: bug.title,
        description: bug.description,
        severity: bug.severity || 'Medium',
        status: 'Open',
        jiraUrl: bug.jiraUrl,
        loggedToJira: true,
      });
      fs.writeFileSync(reqPath, JSON.stringify(requirements, null, 2), 'utf8');
    }
  } catch { /* ignore */ }
}

/**
 * Build the comment content as a list of blocks (heading/paragraph/bullet).
 * When `options.attachedFilename` is set the comment stays concise: executed-on
 * date-time, pass/fail counts, and the attached file name. Without it, each test
 * case is listed with its status (fallback used when the attachment fails).
 */
function buildResultsComment(jiraId, results, options = {}) {
  const testCases = (results && results.results) || [];
  const passed = testCases.filter(t => t.status === 'PASS').length;
  const failed = testCases.filter(t => t.status === 'FAIL').length;
  const executedOn = new Date(results.timestamp || Date.now()).toLocaleString();

  const blocks = [
    { type: 'heading', text: 'Automated Test Execution Report' },
    { type: 'paragraph', text: `Executed On: ${executedOn}` },
    { type: 'paragraph', text: `Total: ${results.total || testCases.length} | Passed: ${passed} | Failed: ${failed}` },
  ];

  if (options.attachedFilename) {
    blocks.push({ type: 'paragraph', text: `Test result ${options.attachedFilename} attached in the attachments.` });
  } else {
    testCases.forEach(t => {
      const type = String(t.tcid).includes('API') ? 'API' : 'UI';
      const error = t.error ? ` - ${t.error.split('\n')[0] || ''}` : '';
      blocks.push({ type: 'bullet', text: `${t.tcid} (${type}): ${t.status}${error}` });
    });
  }

  return blocks;
}

/** Convert comment blocks into an Atlassian Document Format (ADF) body. */
function adfFromBlocks(blocks) {
  return {
    type: 'doc',
    version: 1,
    content: (blocks || []).map(b => {
      if (b.type === 'heading') {
        return { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: b.text }] };
      }
      if (b.type === 'bullet') {
        return {
          type: 'bulletList',
          content: [{ type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: b.text }] }] }],
        };
      }
      return { type: 'paragraph', content: [{ type: 'text', text: b.text }] };
    }),
  };
}

/** Render comment blocks to plain text (used by the local mock fallback). */
function blocksToText(blocks) {
  return (blocks || []).map(b => b.text).join('\n');
}

async function jiraRequest(baseUrl, auth, pathname, { method = 'GET', body, contentType, form } = {}) {
  const headers = {
    Authorization: `Basic ${auth}`,
    'X-Atlassian-Token': 'no-check',
  };
  if (contentType) headers['Content-Type'] = contentType;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const res = await fetch(`${baseUrl}${pathname}`, { method, headers, body });
      if (res.ok || res.status === 404) {
        return res;
      }
      const errText = await res.text();
      if (res.status === 429 || res.status >= 500) {
        await new Promise(r => setTimeout(r, BACKOFF_MS * attempt));
        continue;
      }
      return { ok: false, error: `JIRA API ${res.status}: ${errText.slice(0, 500)}`, status: res.status };
    } catch (err) {
      if (attempt === MAX_ATTEMPTS) return { ok: false, error: `JIRA request failed: ${err.message}` };
      await new Promise(r => setTimeout(r, BACKOFF_MS * attempt));
    }
  }
  return { ok: false, error: 'JIRA request failed after retries' };
}

/**
 * Attach a file to the JIRA issue via POST /rest/api/3/issue/{key}/attachments
 * (multipart/form-data, field name "file").
 */
async function attachFileToJira(jiraId, filePath) {
  if (!fs.existsSync(filePath)) return { ok: false, error: `File not found: ${filePath}` };

  const baseUrl = process.env.JIRA_URL.replace(/\/+$/, '');
  const auth = Buffer.from(`${process.env.JIRA_USER_EMAIL}:${process.env.JIRA_API_TOKEN}`).toString('base64');

  const form = new FormData();
  const blob = new Blob([fs.readFileSync(filePath)]);
  form.append('file', blob, path.basename(filePath));

  const res = await jiraRequest(baseUrl, auth, `/rest/api/3/issue/${encodeURIComponent(jiraId)}/attachments`, {
    method: 'POST',
    body: form,
  });

  if (res.ok) {
    const data = await res.json();
    return { ok: true, attachmentId: data[0] && data[0].id };
  }
  if (res.status === 404) {
    return { ok: false, error: 'JIRA issue not found (404)' };
  }
  return res;
}

/**
 * Add a comment to the JIRA issue via POST /rest/api/3/issue/{key}/comment.
 * The body is sent as ADF (Atlassian Document Format) JSON to avoid wiki-markup
 * parsing issues with special characters.
 */
async function addCommentToJira(jiraId, blocks) {
  const baseUrl = process.env.JIRA_URL.replace(/\/+$/, '');
  const auth = Buffer.from(`${process.env.JIRA_USER_EMAIL}:${process.env.JIRA_API_TOKEN}`).toString('base64');

  const res = await jiraRequest(baseUrl, auth, `/rest/api/3/issue/${encodeURIComponent(jiraId)}/comment`, {
    method: 'POST',
    contentType: 'application/json',
    body: JSON.stringify({ body: adfFromBlocks(blocks) }),
  });

  if (res.ok) {
    const data = await res.json();
    return { ok: true, commentId: data.id };
  }
  if (res.status === 404) {
    return { ok: false, error: 'JIRA issue not found (404)' };
  }
  return res;
}

/**
 * Post test execution results to the JIRA ticket:
 *   1. Copy the test-case Excel to a timestamped name (e.g.
 *      SCRUM-10_TestCases_2026-08-03_19-15-00.xlsx) and attach it, so each run
 *      is distinguishable and the latest is easy to spot.
 *   2. Add a comment with "Executed On" date-time, pass/fail counts, and the
 *      attached filename.
 *   3. If the attachment fails, the comment includes the full per-test-case
 *      details & status table.
 *   4. If JIRA is not configured (or all calls fail), write a mock copy under
 *      artifacts/{jiraId}/jira_test_results.md so the outcome is still visible.
 *
 * Returns a summary object describing what was done.
 */
async function postTestResultsToJira(jiraId, results) {
  const artifactsDir = path.join(__dirname, `../artifacts/${jiraId}`);
  const xlsxPath = path.join(artifactsDir, `${jiraId}_TestCases.xlsx`);

  // Timestamped copy for the attachment so every run leaves a distinct file.
  const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const attachedFilename = `${jiraId}_TestCases_${ts}.xlsx`;
  const timestampedPath = path.join(artifactsDir, attachedFilename);

  if (fs.existsSync(xlsxPath)) {
    fs.copyFileSync(xlsxPath, timestampedPath);
  }

  if (isJiraConfigured()) {
    // 1. Attach the timestamped Excel sheet
    const attachResult = await attachFileToJira(jiraId, timestampedPath);
    if (attachResult.ok) {
      console.log(`[BUG AGENT] Attached ${attachedFilename} to ${jiraId} (attachment ${attachResult.attachmentId})`);
      // 2. Concise comment: executed on, pass/fail, and the attached filename
      const blocks = buildResultsComment(jiraId, results, { attachedFilename });
      const commentResult = await addCommentToJira(jiraId, blocks);
      if (commentResult.ok) {
        console.log(`[BUG AGENT] Added execution comment to ${jiraId} (comment ${commentResult.commentId})`);
        return { jiraId, attached: true, attachmentId: attachResult.attachmentId, commented: true, commentId: commentResult.commentId, attachedFilename };
      }
      console.warn(`[BUG AGENT] Comment failed (${commentResult.error || 'unknown'}); attachment already posted.`);
      return { jiraId, attached: true, attachmentId: attachResult.attachmentId, commentFailed: commentResult.error, attachedFilename };
    }
    console.warn(`[BUG AGENT] Attachment failed (${attachResult.error || 'unknown'}); falling back to detailed comment.`);

    // 3. Fall back to a comment with the full test case details & status
    const blocks = buildResultsComment(jiraId, results);
    const commentResult = await addCommentToJira(jiraId, blocks);
    if (commentResult.ok) {
      console.log(`[BUG AGENT] Added detailed execution comment to ${jiraId} (comment ${commentResult.commentId})`);
      return { jiraId, commented: true, commentId: commentResult.commentId, attachmentFailed: attachResult.error };
    }
    console.warn(`[BUG AGENT] Comment failed (${commentResult.error || 'unknown'}); writing local copy.`);
  }

  // 4. Mock/local fallback: record what would have been posted
  const outPath = path.join(artifactsDir, 'jira_test_results.md');
  const attachNote = fs.existsSync(timestampedPath)
    ? `Attachment (if JIRA were configured): \`${timestampedPath}\``
    : 'Attachment: no test-case Excel sheet found.';
  const blocks = buildResultsComment(jiraId, results, { attachedFilename });
  const content = `${attachNote}\n\n${blocksToText(blocks)}\n`;
  fs.writeFileSync(outPath, content, 'utf8');
  console.log(`[BUG AGENT] JIRA not configured (or unavailable); wrote execution summary to ${outPath}`);
  return { jiraId, mock: true, commentText: blocksToText(blocks), localFile: outPath, attachedFilename };
}

/**
 * Fetch the live summary (heading) of a JIRA issue, e.g. "Explore OrangeHRM
 * open-source platform modules". Returns { ok, summary, status } on success,
 * or { ok: false, error } if JIRA is not configured / unreachable / missing.
 */
async function fetchJiraIssueSummary(jiraId) {
  if (!isJiraConfigured()) {
    return { ok: false, error: 'JIRA not configured' };
  }
  const baseUrl = process.env.JIRA_URL.replace(/\/+$/, '');
  const auth = Buffer.from(`${process.env.JIRA_USER_EMAIL}:${process.env.JIRA_API_TOKEN}`).toString('base64');

  const res = await jiraRequest(baseUrl, auth, `/rest/api/2/issue/${encodeURIComponent(jiraId)}?fields=summary,status`);
  if (!res.ok) return { ok: false, error: res.error || 'JIRA request failed', status: res.status };
  if (res.status === 404) return { ok: false, error: 'JIRA issue not found (404)', status: 404 };

  try {
    const data = await res.json();
    return {
      ok: true,
      summary: (data.fields && data.fields.summary) || null,
      status: (data.fields && data.fields.status && data.fields.status.name) || null,
    };
  } catch (err) {
    return { ok: false, error: `Invalid JIRA response: ${err.message}` };
  }
}

/**
 * Convert a JIRA description into plain text. JIRA descriptions can come back
 * as ADF JSON (objects with type/content) or as a plain wiki-markup string;
 * handle both so the requirement agent gets clean, analyzable text.
 */
function descriptionToText(description) {
  if (typeof description === 'string') return description;

  if (description && typeof description === 'object') {
    const parts = [];
    (function walk(node) {
      if (!node || typeof node !== 'object') return;
      if (node.type === 'text' && typeof node.text === 'string') {
        parts.push(node.text);
        return;
      }
      if (Array.isArray(node.content)) node.content.forEach(walk);
      if (node.type === 'hardBreak') parts.push('\n');
      if (node.type === 'paragraph') parts.push('\n');
    })(description);
    return parts.join('').trim();
  }
  return '';
}

/**
 * Fetch the full JIRA issue (summary, description, acceptance criteria,
 * issuer type, status, priority, labels) for a ticket. This is the source of
 * truth for the Requirement Agent — requirements must be derived from here,
 * never from a hand-edited local file.
 *
 * Returns { ok: true, issue } with the parsed fields, or { ok: false, error }.
 */
async function fetchJiraIssue(jiraId) {
  if (!isJiraConfigured()) {
    return { ok: false, error: 'JIRA not configured' };
  }
  const baseUrl = process.env.JIRA_URL.replace(/\/+$/, '');
  const auth = Buffer.from(`${process.env.JIRA_USER_EMAIL}:${process.env.JIRA_API_TOKEN}`).toString('base64');

  const res = await jiraRequest(baseUrl, auth, `/rest/api/2/issue/${encodeURIComponent(jiraId)}?fields=summary,description,issuetype,status,priority,labels,components`);
  if (!res.ok) return { ok: false, error: res.error || 'JIRA request failed', status: res.status };
  if (res.status === 404) return { ok: false, error: 'JIRA issue not found (404)', status: 404 };

  try {
    const data = await res.json();
    const fields = data.fields || {};
    return {
      ok: true,
      issue: {
        key: data.key || jiraId,
        summary: fields.summary || null,
        description: descriptionToText(fields.description),
        issuetype: (fields.issuetype && fields.issuetype.name) || null,
        status: (fields.status && fields.status.name) || null,
        priority: (fields.priority && fields.priority.name) || null,
        labels: fields.labels || [],
        components: (fields.components || []).map(c => c.name),
      },
    };
  } catch (err) {
    return { ok: false, error: `Invalid JIRA response: ${err.message}` };
  }
}

/**
 * Derive a JIRA-key-style module name from the ticket's summary (used to
 * build the artifact filenames, e.g. SCRUM-10_ProfileManagement_*).
 */
function moduleFromSummary(summary) {
  const words = String(summary || '')
    .replace(/[^a-zA-Z0-9 ]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !/^(the|and|for|with|open|this)$/i.test(w));
  const title = words.slice(0, 3).join(' ').trim();
  return title ? title.replace(/\s+/g, '_') : 'Module';
}

module.exports = { logBug, isJiraConfigured, buildBugPayload, postTestResultsToJira, buildResultsComment, addCommentToJira, adfFromBlocks, blocksToText, fetchJiraIssueSummary, fetchJiraIssue, descriptionToText, moduleFromSummary };
