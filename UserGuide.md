# 📖 OrchestrAI: Execution User Guide

Welcome to **OrchestrAI**, the Enterprise AI QA Orchestration system. This guide provides step-by-step instructions on how to execute the automated testing workflow, monitor real-time progress via the AI Dashboard, and analyze execution artifacts.

---

## 🛠️ Prerequisites

Before running the workflow, ensure you have the following installed on your system:
- **Node.js** (v18 or higher)
- **npm** (comes with Node.js)
- **Google Chrome** (for headed browser execution)
- **Git** (optional, for version control)

---

## 🚀 Setup Instructions

1. **Install Root Dependencies**:
   Open your terminal in the project root and run:
   ```bash
   npm install
   ```

2. **Install Playwright Browsers**:
   Ensure the browser binaries are available:
   ```bash
   npx playwright install chromium
   ```

3. **Dashboard Setup**:
   Navigate to the dashboard application and install its specific dependencies:
   ```bash
   cd dashboard/dashboard-app
   npm install
   ```

---

## 🔄 Running the Orchestration Workflow

The system is designed to be orchestrated via a real-time dashboard. Follow these steps in order:

### Step 1: Start the Dashboard Backend
The backend handles WebSocket communication between the orchestrator and the frontend.
```bash
# From the root directory
node dashboard/backend/server.js
```
*The server will start on `http://localhost:5000`.*

### Step 2: Start the Dashboard Frontend
Open a new terminal and launch the React dashboard:
```bash
cd dashboard/dashboard-app
npm run dev
```
*Open your browser to the URL provided (usually `http://localhost:5173`).*

### Step 3: Trigger the Orchestrator
Open a third terminal, **ensure you are in the project root directory**, and run the orchestrator for a specific Jira ticket (e.g., `SCRUM-10`):
```bash
# From the project root directory
node scripts/orchestrate.js SCRUM-10
```

**What happens during orchestration?** (fully automated, JIRA → tests → execution)
1. **Requirement Analysis**: Fetches the live JIRA ticket (`SCRUM-10`) via the JIRA REST API and writes `artifacts/{JIRA_ID}/requirements.json` from the ticket's summary + description (source of truth). If JIRA is unreachable, it falls back to a saved local prompt; a stale hand-written `requirements.json` is backed up to `requirements.previous.json` and never silently reused.
2. **AI Test Generation**: Derives UI + API test cases from the requirements and writes `testcases.json` plus the `{JIRA_ID}_{Module}_UI.csv` / `{JIRA_ID}_{Module}_API.csv` sources.
3. **JIRA Test Case Sheet**: Generates a `{JIRA_ID}_TestCases.xlsx` Excel file with all generated test cases in JIRA format (pre-execution with `Not Run` status).
4. **Playwright Automation Code Generation**: Transforms the test cases into POM-based Playwright scripts — `tests/{jira_id}.spec.ts` (UI) and `tests/{jira_id}-api.spec.ts` (API) — plus a reusable Page Object at `artifacts/{JIRA_ID}/scripts/{Module}Page.ts`.
5. **Execution**: Launches a headed Chromium browser via Playwright for the UI spec and runs the API spec against the dashboard backend.
6. **Real-time Updates**: Sends logs and pass/fail metrics to the Dashboard via WebSockets.
7. **Self-Healing**: If a locator fails, the AI attempts to "heal" the script.
8. **Bug Logging**: Failed tests are logged as bugs under the JIRA user story (live JIRA when configured, mock otherwise).
9. **Excel Update**: Post-execution, the test case sheet is updated with Actual Results, Execution Status (`Pass`/`Fail`), and Defect IDs.
10. **Reporting**: Generates a detailed HTML report and AI insights.

---

## 🔌 Jira Connection & Authentication

### 1. Local Simulation (Default Sandbox Setup)
To facilitate testing without external dependencies, the system can run with a mock Jira integration. In this mode the Requirement Agent falls back to a saved local prompt (`artifacts/{JIRA_ID}/prompt.txt` or `requriement prompt.txt`) to produce `artifacts/{JIRA_ID}/requirements.json`, and bugs are recorded locally under `artifacts/{JIRA_ID}/requirements.json` in the `bugs[]` array.

> [!NOTE]
> The Requirement Agent **always tries JIRA first**. A locally-stored `requirements.json` is treated as stale and is backed up to `requirements.previous.json` before being regenerated, so hand-written requirements never silently override the live ticket.

### 2. Live Jira Production Integration
In a production environment, the system connects directly to a live Jira cloud instance using the Jira REST API. 
When the environment is configured, failed test cases are created as Bug issues **under the parent Jira story** (the ticket being orchestrated) automatically.

To configure a live connection:
1. Define the following environment variables (usually in a `.env` file in the project root):
   - `JIRA_URL`: The base URL of your Jira instance (e.g., `https://your-domain.atlassian.net`)
   - `JIRA_USER_EMAIL`: The email address associated with your Atlassian/Jira account.
   - `JIRA_API_TOKEN`: A secure Atlassian API Token (generated via Atlassian account security settings).
2. The orchestrator calls the Jira REST API to fetch issues dynamically:
   ```bash
   GET /rest/api/2/issue/{issueIdOrKey}
   ```
3. After execution, the orchestrator updates the issue with logs, comments, and automatically creates bug tickets for test failures using the JIRA issue creation API:
   ```bash
   POST /rest/api/3/issue
   ```
   Each bug is created with the parent story key (e.g., `SCRUM-10`) and a summary like `[BUG] TC_UI_03 failed`.

> [!NOTE]
> If `JIRA_URL`, `JIRA_USER_EMAIL` or `JIRA_API_TOKEN` are **not** set, the system falls back to the local mock: bugs are recorded under `artifacts/{JIRA_ID}/requirements.json` in the `bugs[]` array (see below). This keeps the workflow fully functional offline.

---

## 📊 Understanding Execution Artifacts

After a workflow finishes, you can find the results in the following locations:

| Artifact | Location | Description |
| :--- | :--- | :--- |
| **JIRA Test Cases (Pre-run)** | `artifacts/{JIRA_ID}/{JIRA_ID}_TestCases.xlsx` | Test cases in JIRA format, generated before execution with `Not Run` status. |
| **JIRA Test Cases (Post-run)** | `artifacts/{JIRA_ID}/{JIRA_ID}_TestCases.xlsx` | Same file, updated after execution with Actual Result, Execution Status, and Defect ID columns populated. |
| **Generated Test Cases** | `artifacts/{JIRA_ID}/testcases.json` | Structured UI + API test-case manifest derived from the JIRA ticket. |
| **Page Object Model** | `artifacts/{JIRA_ID}/scripts/{Module}Page.ts` | Auto-generated POM consumed by the Playwright spec. |
| **HTML Report** | `artifacts/{JIRA_ID}/report.html` | Visual summary of test results. |
| **Test Results** | `artifacts/{JIRA_ID}/results.json` | Raw JSON data of every test step. |
| **AI Insights** | `artifacts/{JIRA_ID}/insights.json` | Root cause analysis and flaky detection. |
| **Bug Log** | `artifacts/{JIRA_ID}/requirements.json` | `bugs[]` array listing all logged bug tickets under the JIRA story. |
| **Bug Evidence** | `artifacts/{JIRA_ID}` | Failure details and screenshots captured during execution. |

---

## 📋 JIRA-Format Test Case Sheet

When the orchestrator runs, it automatically generates a structured Excel file (`{JIRA_ID}_TestCases.xlsx`) before executing any tests. The sheet uses the following JIRA-aligned columns:

| Column | Description |
| :--- | :--- |
| **Test Case ID** | Unique test case identifier (e.g., `TC_UI_01`) |
| **Requirement ID (JIRA ID)** | Linked Jira Story (e.g., `SCRUM-10`) |
| **Test Summary** | Brief description of the test scenario |
| **Test Steps** | Steps to execute the test |
| **Expected Result** | Expected outcome after executing the steps |
| **Actual Result** | Populated post-execution (pass msg or failure details) |
| **Priority** | `High` / `Medium` / `Low` |
| **Test Type** | `UI` / `API` / `Functional` / `Regression` |
| **Automation Status** | Set to `Automated` after execution |
| **Execution Status** | `Not Run` → updated to `Pass` or `Fail` post-execution |
| **Defect ID** | Populated with the bug ticket ID (e.g., `BUG-SCRUM-10-TC_UI_03`) if the test failed |

> [!TIP]
> The test case sheet is designed to be uploaded directly to JIRA or shared with the QA team before and after each sprint execution run.

---

## 🛠️ Troubleshooting

- **Connection Error**: Ensure the backend `server.js` is running before starting the orchestrator.
- **Playwright Timeouts**: If the application is slow, increase the `timeout` in `playwright.config.ts`.
- **Headed Mode**: To run tests silently, modify `scripts/orchestrate.js` to change `--headed` to `--headless` in the `execSync` command.
- **Excel not generated**: Ensure the Requirement Agent ran and `testcases.json` exists in `artifacts/{JIRA_ID}/` — the Excel sheet is built from that generated manifest, not from hand-written CSVs.
- **Stale dashboard title/source**: If the dashboard still shows the old story title or source, restart the backend (`node dashboard/backend/server.js`) — a long-running process may be running pre-change code. The backend fetches live JIRA data on each request, so a fresh process reflects the current ticket.

---

*Generated by OrchestrAI.*
