/**
 * generate_requirements.js — Requirement Agent (Phase 1)
 *
 * Sources the story's requirements from the JIRA ticket (the authoritative
 * source) and writes artifacts/{jiraId}/requirements.json in the shape the
 * orchestrator, test-case generators, and dashboard consume.
 *
 * Priority:
 *   1. JIRA ticket (summary + description) — always the source of truth.
 *   2. If JIRA is not configured/unreachable, fall back to a manually-saved
 *      prompt (artifacts/{jiraId}/prompt.txt or ./requriement prompt.txt) so
 *      offline runs still produce a requirements file.
 *   3. Never silently reuse a stale hand-written requirements.json — if one
 *      exists, it is backed up to requirements.previous.json so the pipeline
 *      always regenerates from the live ticket.
 */
const fs = require('fs');
const path = require('path');
const { fetchJiraIssue } = require('./jiraClient');

/** Basic heuristic: extract bullet/numbered items from the description text. */
function extractAcceptanceCriteria(description) {
  const lines = String(description || '')
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(Boolean);
  const criteria = lines.filter(l => /^[\s]*([-*•]|\d+[.)]|#)\s+/.test(l) || l.toLowerCase().startsWith('acceptance'));
  return criteria.length ? criteria : [];
}

/** Guess a module label from the ticket summary (falls back to 'Module'). */
function guessModule(summary) {
  const words = String(summary || '')
    .replace(/[^a-zA-Z0-9 ]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !/^(the|and|for|with|open|this)$/i.test(w));
  return words.slice(0, 3).join(' ') || 'Module';
}

function sanitizePathComponent(name) {
  return String(name || 'Module').replace(/[^a-zA-Z0-9_ -]/g, '').trim() || 'Module';
}

/**
 * Write artifacts/{jiraId}/requirements.json from the JIRA ticket.
 * Returns { written, source } describing where requirements came from.
 */
async function generateRequirements(jiraId) {
  const artifactsDir = path.join(__dirname, `../artifacts/${jiraId}`);
  const outPath = path.join(artifactsDir, 'requirements.json');
  fs.mkdirSync(artifactsDir, { recursive: true });

  // If a hand-written requirements.json exists, back it up before regenerating
  // so no local work is silently lost.
  if (fs.existsSync(outPath)) {
    fs.copyFileSync(outPath, path.join(artifactsDir, 'requirements.previous.json'));
  }

  // Preserve previously logged bugs so re-runs don't create duplicate JIRA
  // tickets — the Requirement Agent must not wipe bug history.
  let existingBugs = [];
  if (fs.existsSync(outPath)) {
    try {
      const prev = JSON.parse(fs.readFileSync(outPath, 'utf8'));
      existingBugs = Array.isArray(prev.bugs) ? prev.bugs : [];
    } catch { /* ignore malformed previous file */ }
  }

  // 1. Authoritative source: JIRA
  const jira = await fetchJiraIssue(jiraId);
  if (jira.ok && jira.issue) {
    const issue = jira.issue;
    const criteria = extractAcceptanceCriteria(issue.description);
    const requirements = {
      jiraId,
      title: issue.summary || jiraId,
      description: issue.description || '',
      acceptanceCriteria: criteria,
      source: 'JIRA',
      jira: {
        issuetype: issue.issuetype,
        status: issue.status,
        priority: issue.priority,
        labels: issue.labels,
        components: issue.components,
        url: `${(process.env.JIRA_URL || '').replace(/\/+$/, '')}/browse/${jiraId}`,
      },
      analysis: {
        module: guessModule(issue.summary),
        complexity: 'Medium',
        dependencies: [],
      },
      bugs: existingBugs,
      generatedAt: new Date().toISOString(),
    };
    fs.writeFileSync(outPath, JSON.stringify(requirements, null, 2), 'utf8');
    console.log(`[REQUIREMENT AGENT] requirements.json regenerated from JIRA ticket ${jiraId}: "${issue.summary}"`);
    return { written: true, source: 'JIRA', requirements };
  }

  console.warn(`[REQUIREMENT AGENT] JIRA unavailable (${jira.error || 'unknown'}); falling back to local prompt.`);

  // 2. Fallback: locally-saved manual prompt
  const promptCandidates = [
    path.join(artifactsDir, 'prompt.txt'),
    path.join(__dirname, '../requriement prompt.txt'),
  ];
  const promptPath = promptCandidates.find(p => fs.existsSync(p));
  if (promptPath) {
    const promptText = fs.readFileSync(promptPath, 'utf8');
    const requirements = {
      jiraId,
      title: `${jiraId} (from local prompt)`,
      description: promptText,
      acceptanceCriteria: [],
      source: 'LOCAL_PROMPT_FALLBACK',
      jira: null,
      analysis: { module: 'Module', complexity: 'Medium', dependencies: [] },
      bugs: existingBugs,
      generatedAt: new Date().toISOString(),
    };
    fs.writeFileSync(outPath, JSON.stringify(requirements, null, 2), 'utf8');
    console.log(`[REQUIREMENT AGENT] JIRA unavailable; wrote requirements from local prompt: ${promptPath}`);
    return { written: true, source: 'LOCAL_PROMPT_FALLBACK', requirements };
  }

  // 3. Last resort: empty placeholder
  const requirements = {
    jiraId,
    title: jiraId,
    description: '',
    acceptanceCriteria: [],
    source: 'PLACEHOLDER',
    jira: null,
    analysis: { module: 'Module', complexity: 'Medium', dependencies: [] },
    bugs: existingBugs,
    generatedAt: new Date().toISOString(),
  };
  fs.writeFileSync(outPath, JSON.stringify(requirements, null, 2), 'utf8');
  console.warn(`[REQUIREMENT AGENT] No JIRA or local prompt; wrote placeholder requirements for ${jiraId}.`);
  return { written: true, source: 'PLACEHOLDER', requirements };
}

module.exports = { generateRequirements, extractAcceptanceCriteria, guessModule };
