/**
 * scripts/dev.js — one-command dev launcher.
 * Starts the dashboard backend (port 5000) and the Vite dashboard (port 5173)
 * together, so `npm run dev` from the repo root brings up the whole UI.
 *
 * - If a backend is already listening on 5000 (e.g. you ran
 *   `node dashboard/backend/server.js` in another terminal), it is reused and
 *   not started a second time (avoids EADDRINUSE).
 * - The default browser is opened at http://localhost:5173 once Vite is ready.
 */
const { spawn } = require('child_process');
const http = require('http');
const path = require('path');

const root = path.join(__dirname, '..');
const dashboardApp = path.join(root, 'dashboard', 'dashboard-app');
const BACKEND_PORT = 5000;
const DASHBOARD_PORT = 5173;

const children = [];

function isPortOpen(port) {
  // Try both localhost names (Vite binds IPv6 [::1] on Windows; the backend
  // binds IPv4 127.0.0.1). Resolve as soon as either family answers.
  return new Promise((resolve) => {
    let checked = 0;
    let answered = false;
    const done = (result) => {
      if (answered) return;
      answered = true;
      resolve(result);
    };
    for (const host of ['127.0.0.1', '::1']) {
      const req = http.get({ host, port, timeout: 800 }, (res) => {
        res.resume();
        done(true);
      });
      req.on('error', () => {
        if (++checked === 2) done(false);
      });
      req.on('timeout', () => {
        req.destroy();
        if (++checked === 2) done(false);
      });
    }
  });
}

function start(name, cmd, args, cwd) {
  const child = spawn(cmd, args, { cwd, stdio: 'inherit', shell: true });
  children.push(child);
  child.on('exit', (code) => {
    console.log(`[dev] ${name} exited with code ${code}`);
  });
  return child;
}

function openBrowser(url) {
  // Cross-platform best-effort open in the default browser.
  const opener =
    process.platform === 'win32'
      ? 'cmd'
      : process.platform === 'darwin'
        ? 'open'
        : 'xdg-open';
  const args = process.platform === 'win32' ? ['/c', 'start', '', url] : [url];
  try {
    spawn(opener, args, { stdio: 'ignore', detached: true }).unref();
    console.log(`[dev] Opened ${url} in your default browser.`);
  } catch {
    console.log(`[dev] Open ${url} manually.`);
  }
}

async function waitForPort(port, name, timeoutMs = 20000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await isPortOpen(port)) {
      console.log(`[dev] ${name} is up on http://localhost:${port}`);
      return true;
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  console.warn(`[dev] Timed out waiting for ${name} on port ${port}.`);
  return false;
}

async function main() {
  // Backend: reuse an existing instance on 5000, else start one.
  const backendUp = await isPortOpen(BACKEND_PORT);
  if (backendUp) {
    console.log(`[dev] Backend already running on http://localhost:${BACKEND_PORT} — reusing it.`);
  } else {
    start('backend', 'node', ['dashboard/backend/server.js'], root);
    await waitForPort(BACKEND_PORT, 'backend');
  }

  // Dashboard: start Vite (it may already be running; Vite handles its own port).
  const dashboardUp = await isPortOpen(DASHBOARD_PORT);
  if (dashboardUp) {
    console.log(`[dev] Dashboard already running on http://localhost:${DASHBOARD_PORT} — reusing it.`);
    openBrowser(`http://localhost:${DASHBOARD_PORT}`);
    return;
  }
  start('dashboard', 'npm', ['run', 'dev'], dashboardApp);
  const up = await waitForPort(DASHBOARD_PORT, 'dashboard');
  if (up) openBrowser(`http://localhost:${DASHBOARD_PORT}`);
}

function shutdown() {
  console.log('\n[dev] Shutting down...');
  for (const child of children) child.kill('SIGTERM');
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

main();
