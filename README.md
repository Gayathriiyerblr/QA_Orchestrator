# 🚀 Enterprise AI QA Orchestration (Antigravity + MCP)

Welcome to the **Enterprise AI QA Orchestration** project! This is a fully autonomous, AI-powered Quality Assurance automation system. It orchestrates the entire STLC (Software Testing Life Cycle) using Large Language Models (LLMs), Playwright for UI automation, and a suite of specialized agentic tools.

## ✨ Features

- **Automated Requirement Analysis:** Connects to Jira to fetch tickets and analyze requirements.
- **AI Test Generation:** Creates comprehensive UI and API test cases automatically.
- **Playwright Automation Code Generation:** Transforms English test cases into robust Page Object Model (POM) Playwright scripts.
- **Self-Healing Execution:** Detects flaky locators or timeouts and automatically patches the automation script in real-time.
- **Bug Reporting:** Automatically logs Jira issues with detailed root-cause analysis and screenshots upon confirmed test failures.
- **Real-Time Dashboards:** A Node.js backend and React-based web dashboard driven by WebSockets to monitor orchestration live.
- **Artifacts & Insights:** Generates comprehensive HTML reports, JSON execution results, and automated AI insights for every test run.

## 📁 Project Structure

- `dashboard/`: Contains the React dashboard application and WebSocket server.
- `tests/` & `scripts/`: Playwright automation scripts and orchestration command entry points.
- `artifacts/`: Generated outputs including execution logs, HTML reports, JSON test sets, and bug screenshots.
- `orangehrm-e2e-orchestration/`: E2E test module targeted specifically for OrangeHRM functionality.
- `release_notes/`: Houses auto-generated release notes for execution runs.
- `UserGuide.md`: Detailed step-by-step documentation on how to run, monitor, and troubleshoot the system.
- `Paln.md`: The core architecture, flow, and agent mapping plan.

## 🚀 Getting Started

To get started with running the orchestration workflow, please refer to the comprehensive [Execution User Guide](./UserGuide.md).

### Quick Setup

1. **Install Root Dependencies:**
   ```bash
   npm install
   ```
2. **Install Playwright Browsers:**
   ```bash
   npx playwright install chromium
   ```
3. **Install Dashboard Dependencies:**
   ```bash
   cd dashboard/dashboard-app
   npm install
   ```

### Running the Standard End-to-End Test

To quickly run the standalone execution script which tests user creation data on OrangeHRM:
```bash
node automated_execution.js
```

To run the full dashboard and orchestrated workflow, please refer to the [UserGuide.md](./UserGuide.md).

## 🛠 Technology Stack

- **Node.js** & **Express**
- **Playwright** (E2E Testing & Automation)
- **React.js** & **Vite** (Real-time Dashboard)
- **Socket.io** (WebSocket communication)
- **ExcelJS** & **Faker** (Test Data Generation)

## 📝 License
ISC
