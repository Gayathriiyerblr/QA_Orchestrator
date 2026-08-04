/**
 * scripts/dev.js — one-command dev launcher.
 * Starts the dashboard backend (port 5000) and the Vite dashboard (port 5173)
 * together, so `npm run dev` from the repo root brings up the whole UI.
 */
const { spawn } = require('child_process');
const path = require('path');

const root = path.join(__dirname, '..');
const dashboardApp = path.join(root, 'dashboard', 'dashboard-app');

const children = [];

function start(name, cmd, args, cwd) {
  const child = spawn(cmd, args, { cwd, stdio: 'inherit', shell: true });
  children.push(child);
  child.on('exit', (code) => {
    console.log(`[dev] ${name} exited with code ${code}`);
  });
  return child;
}

// Backend first, then the Vite frontend (which serves the dashboard on 5173).
start('backend', 'node', ['dashboard/backend/server.js'], root);
start('dashboard', 'npm', ['run', 'dev'], dashboardApp);

function shutdown() {
  console.log('\n[dev] Shutting down...');
  for (const child of children) child.kill('SIGTERM');
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
