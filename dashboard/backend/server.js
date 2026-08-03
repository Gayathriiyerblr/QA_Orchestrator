const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { fetchJiraIssueSummary } = require('../../scripts/jiraClient');
const { parseCSV } = require('../../scripts/testCaseUtils');

const app = express();
app.use(cors());
app.use(express.json());

// Root route for health check
app.get('/', (req, res) => {
  res.send('🚀 OrchestrAI Backend is running! Use port 5173 for the Dashboard.');
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 5000;

// Serve artifacts (screenshots, reports)
app.use('/artifacts', express.static(path.join(__dirname, '../../artifacts')));

// API to get results
app.get('/api/results/:jiraId', (req, res) => {
  const { jiraId } = req.params;
  const filePath = path.join(__dirname, `../../artifacts/${jiraId}/results.json`);
  if (fs.existsSync(filePath)) {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    res.json(data);
  } else {
    res.status(404).json({ error: 'Not found' });
  }
});

// Build a per-test-case one-line summary from the generated test-case manifest
// (testcases.json), so the dashboard shows what each test case verifies
// (UI scenario / API endpoint) regardless of which module the JIRA ticket maps to.
function buildTestSummaries(ticketDir) {
  const summaries = {};
  const testcasesPath = path.join(ticketDir, 'testcases.json');
  if (fs.existsSync(testcasesPath)) {
    try {
      const testcases = JSON.parse(fs.readFileSync(testcasesPath, 'utf8'));
      for (const tc of testcases.ui || []) {
        if (tc.tcid && tc.scenario) summaries[tc.tcid] = tc.scenario;
      }
      for (const tc of testcases.api || []) {
        if (tc.tcid) {
          const method = (tc.method || 'GET').toUpperCase();
          summaries[tc.tcid] = `${method} ${tc.endpoint} — ${tc.validation || 'verify API response'}`;
        }
      }
    } catch { /* ignore malformed manifest */ }
  }
  return summaries;
}

// API to list all tickets with their latest execution summary + details
app.get('/api/results', async (req, res) => {
  const artifactsDir = path.join(__dirname, '../../artifacts');
  const entries = [];
  if (!fs.existsSync(artifactsDir)) return res.json({ tickets: [] });

  const dirs = fs.readdirSync(artifactsDir).filter(name => {
    const ticketDir = path.join(artifactsDir, name);
    return fs.statSync(ticketDir).isDirectory() && fs.existsSync(path.join(ticketDir, 'results.json'));
  });

  for (const jiraId of dirs) {
    const ticketDir = path.join(artifactsDir, jiraId);
    const resultsPath = path.join(ticketDir, 'results.json');
    const reqPath = path.join(ticketDir, 'requirements.json');
    const insightsPath = path.join(ticketDir, 'insights.json');

    const results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
    const requirements = fs.existsSync(reqPath) ? JSON.parse(fs.readFileSync(reqPath, 'utf8')) : null;
    const insights = fs.existsSync(insightsPath) ? JSON.parse(fs.readFileSync(insightsPath, 'utf8')) : null;

    // Requirement provenance: "JIRA" when derived from the live ticket,
    // else the fallback source (local prompt / placeholder).
    const reqSource = (requirements && requirements.source) || null;

    // Prefer the live JIRA heading, falling back to the locally stored title
    let title = (requirements && requirements.title) || results.jiraId || jiraId;
    let jiraStatus = null;
    try {
      const jira = await fetchJiraIssueSummary(jiraId);
      if (jira.ok && jira.summary) {
        title = jira.summary;
        jiraStatus = jira.status;
      }
    } catch { /* JIRA unreachable — keep local title */ }

    const testCases = (results && results.results) || [];
    const summaries = buildTestSummaries(ticketDir);
    const testCasesWithSummary = testCases.map(tc => ({
      ...tc,
      summary: tc.summary || summaries[tc.tcid] || null,
    }));
    // Self-healed count from the persisted heal log (survives reloads).
    // Count DISTINCT healed test cases — the log accumulates across runs.
    let healed = 0;
    const healLogPath = path.join(ticketDir, 'self_heal_log.json');
    if (fs.existsSync(healLogPath)) {
      try {
        const healLog = JSON.parse(fs.readFileSync(healLogPath, 'utf8'));
        if (Array.isArray(healLog)) {
          healed = new Set(
            healLog.map(h => ((h.tcid || h.target || '').split(':')[0] || '').trim()).filter(Boolean)
          ).size;
        }
      } catch { /* ignore malformed log */ }
    }
    entries.push({
      jiraId,
      title,
      jiraStatus,
      requirementSource: reqSource,
      healed,
      total: (results && results.total) || testCases.length || 0,
      passed: (results && results.passed) || 0,
      failed: (results && results.failed) || 0,
      timestamp: (results && results.timestamp) || null,
      status: testCases.length ? (testCases.some(t => t.status === 'FAIL') ? 'FAIL' : 'PASS') : null,
      results: testCasesWithSummary,
      bugs: (requirements && requirements.bugs) || [],
      insights,
    });
  }
  res.json({ tickets: entries });
});

// ─────────────────────────────────────────────────────────────
// Mock Personal Details API (used by API test cases TC_API_*)
// State is in-memory for the lifetime of the backend process.
// ─────────────────────────────────────────────────────────────
const personalDetailsState = { nickname: '' };

app.get('/api/personal-details', (req, res) => {
  res.json({ status: 'success', nickname: personalDetailsState.nickname });
});

app.put('/api/personal-details', (req, res) => {
  const { nickname } = req.body || {};
  if (nickname === null || nickname === undefined) {
    return res.status(400).json({ status: 'error', message: 'Field cannot be null' });
  }
  if (typeof nickname !== 'string') {
    return res.status(400).json({ status: 'error', message: 'Nickname must be a string' });
  }
  // BUG (intentional): no max-length validation on nickname, so over-length
  // values are accepted with 200 instead of being rejected with 400.
  personalDetailsState.nickname = nickname;
  res.json({ status: 'success', nickname });
});

// WebSocket for real-time updates
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('update_status', (data) => {
    // Broadcast to all clients
    io.emit('status_changed', data);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

server.listen(PORT, () => {
  console.log(`Dashboard Backend running on http://localhost:${PORT}`);
});
