# 🚀 OrchestrAI — Enterprise AI QA Orchestration

**Authored By — Gayathri**

Welcome to **OrchestrAI**! This is a fully autonomous, AI-powered Quality Assurance automation system. It orchestrates the entire STLC (Software Testing Life Cycle) using Large Language Models (LLMs), Playwright for UI automation, and a suite of specialized agentic tools.

## ✨ Features

- **Automated Requirement Analysis:** Connects to Jira to fetch tickets and analyze requirements.
- **AI Test Generation:** Creates comprehensive UI and API test cases automatically.
- **Playwright Automation Code Generation:** Transforms English test cases into robust Page Object Model (POM) Playwright scripts.
- **Self-Healing Execution:** Detects flaky locators or timeouts and automatically patches the automation script in real-time.
- **Bug Reporting:** Automatically logs Jira issues with detailed root-cause analysis and screenshots upon confirmed test failures.
- **Real-Time Dashboards:** A Node.js backend and React-based web dashboard driven by WebSockets to monitor orchestration live.
- **Artifacts & Insights:** Generates comprehensive HTML reports, JSON execution results, and automated AI insights for every test run.

## 📁 POM Framework Structure

The project follows an **enterprise Page Object Model (POM)** architecture built on Playwright. The design separates **reusable, website-agnostic libraries** (`framework/`) from **website-specific layers** (`websites/<Site>/`), so every new JIRA ticket — for the same or a completely different website — only adds a small amount of website-specific code and reuses everything else.

```text
.
├── config/                          # Playwright config + environment settings
│   ├── playwright.config.ts         #   Enterprise config: testDir = websites/, per-site projects, reporters
│   ├── environments.ts              #   dev/qa environment registry (per-site base URLs, API base URL)
│   ├── env.dev.ts                   #   dev environment export
│   └── env.qa.ts                    #   qa environment export
│
├── framework/                       # ⭐ SHARED, REUSABLE — website-agnostic (never changes per site)
│   ├── base/                        #   Base classes every page/test/API extends
│   │   ├── BasePage.ts              #     Base for ALL page objects (element/wait/assertions/helpers)
│   │   ├── BaseTest.ts              #     Test hooks (logger init, failure screenshots)
│   │   ├── BaseAPI.ts               #     Base for API test helpers
│   │   └── BaseAssertions.ts        #     Centralized assertions (verifyVisible/Text/URL/Title/Count)
│   │
│   ├── wrappers/                    #   Reusable interaction wrappers
│   │   ├── ElementActions.ts        #     click/fill/press/getText — adds wait+scroll+retry+log+screenshot
│   │   ├── WaitHelper.ts            #     waitForLoader/Toast/Spinner/Network/PageLoad/UntilVisible
│   │   ├── TableHelper.ts           #     clickRow/getCellValue/searchRow/deleteRow/editRow/rowExists
│   │   ├── DropdownHelper.ts        #     selectByLabel/Value/Index + custom dropdowns
│   │   ├── CalendarHelper.ts        #     openCalendar/selectDate/navigateMonth/selectRange
│   │   ├── FileUploadHelper.ts      #     uploadFile/verifyUploadedFile/downloadFile
│   │   ├── FrameHelper.ts           #     iframe interactions
│   │   └── WindowHelper.ts          #     multi-tab/window interactions
│   │
│   ├── utils/                       #   Shared utilities
│   │   ├── Logger.ts                #     INFO/PASS/FAIL/WARN/DEBUG → console + artifacts/{jiraId}/logs
│   │   ├── ExcelUtil.ts             #     read/write/update Excel via exceljs
│   │   ├── JsonUtil.ts              #     read/write/clone JSON
│   │   ├── RandomData.ts            #     faker-backed random test data (names, ids, emails)
│   │   ├── DateUtil.ts              #     date helpers for calendars/date pickers
│   │   ├── ScreenshotUtil.ts        #     take/takeFailure/takeFullPage/takeElement
│   │   └── RetryUtil.ts             #     retry/retryClick/retryFill/retryAssertion (exponential backoff)
│   │
│   ├── api/                         #   Shared API layer
│   │   ├── APIClient.ts             #     get/post/put/patch/delete with auth-header injection + logging
│   │   └── TokenManager.ts          #     auth token cache per environment
│   │
│   ├── constants/                   #   Centralized constants
│   │   ├── Messages.ts              #     user-facing/log messages
│   │   ├── URLs.ts                  #     per-site base URLs registry (dev/qa) + API base URL
│   │   └── TestConstants.ts         #     timeouts, retry budgets, default credentials
│   │
│   └── reports/                     #   Reporter wiring
│       └── index.ts                 #     HTML reporter + custom results reporter
│
├── fixtures/                        # Typed Playwright fixtures shared by every spec
│   └── CustomFixtures.ts            #   test with env/logger/apiClient/jiraId attached
│
├── websites/                        # ⭐ WEBSITE-SPECIFIC — the only layer that changes per site
│   ├── OrangeHRM/                   #   Site 1: OrangeHRM demo
│   │   ├── pages/                   #     POM page objects (extend BasePage)
│   │   │   ├── LoginPage.ts         #       login(username?, password?), expectLoaded()
│   │   │   ├── DashboardPage.ts     #       expectLoaded()
│   │   │   ├── PIMPage.ts           #       createEmployee(firstName, lastName, employeeId?)
│   │   │   ├── LeavePage.ts         #       applyLeave()
│   │   │   ├── RecruitmentPage.ts   #       viewRecruitment()
│   │   │   └── TimePage.ts          #       viewTimesheet()
│   │   ├── locators/                #     Plain-string locator constants (self-heal patches these)
│   │   │   ├── LoginPage.locators.ts
│   │   │   ├── PIMPage.locators.ts
│   │   │   ├── LeavePage.locators.ts
│   │   │   ├── RecruitmentPage.locators.ts
│   │   │   ├── TimePage.locators.ts
│   │   │   ├── DashboardPage.locators.ts
│   │   │   └── DemoLocators.locators.ts   #  stale/negative locators used by self-heal + bug demos
│   │   ├── testdata/                #     Test data JSON
│   │   │   ├── credentials.json     #       { username, password }
│   │   │   └── employee.json        #       { firstName, lastName, employeeId }
│   │   └── tests/                   #     Per-JIRA-ticket test specs
│   │       └── SCRUM-10/            #       1:1 mapping: one folder per JIRA ticket
│   │           ├── scrum-10.spec.ts         #  UI tests
│   │           └── scrum-10-api.spec.ts     #  API tests
│   │
│   └── BrowserStackDemo/            #   Site 2: BrowserStack demo (e-commerce)
│       ├── pages/
│       │   ├── LoginPage.ts         #     login(), openSignInPage()
│       │   ├── ProductPage.ts       #     searchProduct(), filterByBrand(), openFirstProduct()
│       │   ├── CartPage.ts          #     addToCart(), openCart(), cartItemCount()
│       │   └── CheckoutPage.ts      #     checkout(), expectOrderConfirmation()
│       ├── locators/
│       │   ├── LoginPage.locators.ts
│       │   ├── ProductPage.locators.ts
│       │   ├── CartPage.locators.ts
│       │   ├── CheckoutPage.locators.ts
│       │   └── DemoLocators.locators.ts
│       ├── testdata/
│       │   ├── credentials.json
│       │   └── checkout.json
│       └── tests/
│           └── SCRUM-32/
│               ├── scrum-32.spec.ts
│               └── scrum-32-api.spec.ts     #  empty — BrowserStack exposes no local API
│
├── playwright.config.ts            # Root config — delegates to config/playwright.config.ts
├── scripts/                        # Orchestration, generation, reporting agents (pipeline)
│   ├── orchestrate.js               #   Full JIRA → tests → execute → report workflow
│   ├── generate_playwright_scripts.js  #   Generates POM pages + specs into websites/<Site>/
│   ├── playwright-results-reporter.js  #   Writes artifacts/{jiraId}/results.json
│   ├── SelfHealer.js                #   Patches websites/<Site>/locators/*.locators.ts
│   └── ...                          #   Other pipeline agents
├── artifacts/                      # Generated outputs (results.json, reports, Excel, logs, screenshots)
├── dashboard/                      # React dashboard + WebSocket backend (unchanged)
└── release_notes/                  # Auto-generated release notes
```

### How the POM layers work together

**Dependency flow (top → bottom):**

```text
Tests (websites/<Site>/tests/<JIRA_ID>/*.spec.ts)
        │
        ▼
Website Page Objects (websites/<Site>/pages/*.ts)
        │
        ▼
BasePage (framework/base/BasePage.ts)
        │
   ┌────┼──────────┬──────────────┐
   ▼    ▼          ▼              ▼
ElementActions  WaitHelper  BaseAssertions   Helpers (Table/Calendar/Dropdown/...)
   └────┼──────────┴──────────────┘
        ▼
Logger / Utils / API (framework/utils, framework/api)
        │
        ▼
Playwright APIs
```

1. **Tests** never touch Playwright directly. They instantiate page objects from the site's `pages/` folder.
2. **Page objects** extend `framework/base/BasePage` and declare only the locators + business flows unique to that website. They interact through `this.element.*`, `this.wait.*`, `this.assertions.*` — so **every website automatically gets logging, retries, waits, and screenshots for free**.
3. **BasePage** wires up the reusable `ElementActions` (wait → scroll → retry → log → screenshot on every click/fill), `WaitHelper` (loaders, toasts, network), `BaseAssertions` (centralized `expect` with logging + failure screenshots), and the generic helpers (`table`, `dropdown`, `calendar`, `upload`, `frame`, `window`).
4. **Locators live in `locators/*.locators.ts`** as plain string constants. This is deliberate: the **Self-Healing agent patches these files** when a locator goes stale, so heals survive spec regeneration.
5. **Test data lives in `testdata/*.json`** per site — credentials, employees, checkout info.
6. **Each JIRA ticket maps to one folder** under `websites/<Site>/tests/<JIRA_ID>/` containing the UI spec and API spec. A ticket never duplicates page objects — it reuses the site's pages/locators/testdata.

### Example reuse — two websites, one framework

```text
OrangeHRM Login                 BrowserStack Login
LoginPage.login()               LoginPage.login()
        │                               │
        ▼                               ▼
BasePage.fill() / BasePage.click()  ←── identical framework code
        │                               │
        ▼                               ▼
ElementActions.fill() / .click()  ←── adds wait + scroll + retry + log + screenshot
        │                               │
        ▼                               ▼
Logger → Retry → Screenshot → Playwright.fill()/click()
```

Only the locators and page flows differ — **no framework code changes**.

### Adding a new JIRA ticket (same or new website)

- **Same website (e.g. a new OrangeHRM ticket SCRUM-99):** run the orchestrator (`node scripts/orchestrate.js SCRUM-99`). The automation agent generates the spec into `websites/OrangeHRM/tests/SCRUM-99/` reusing the existing `LoginPage`, `PIMPage`, etc. If the ticket needs a new screen, add one `pages/XPage.ts` + one `locators/XPage.locators.ts` and reuse the framework as-is.
- **Brand-new website (e.g. a SaaS app):** create `websites/MyApp/` with `pages/`, `locators/`, `testdata/`, and `tests/<JIRA_ID>/`. The generator resolves the site automatically (from `testcases.app` or by scanning `websites/`), and the entire `framework/` is reused unchanged.
- **No framework changes are ever required** — `BasePage`, `ElementActions`, `WaitHelper`, `Assertions`, `Logger`, and all utilities are shared across every website.

### Running the tests

```bash
npm test                 # all websites (headless)
npm run test:headed      # all websites (headed)
npm run test:orangehrm   # only OrangeHRM
npm run test:bstack      # only BrowserStackDemo
npm run typecheck        # tsc --noEmit across config/framework/fixtures/websites
```

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

### Running the Orchestrated Workflow

The system is fully automated: JIRA ticket → requirement analysis → AI test generation → POM Playwright scripts → execution → reporting.

**One-command launcher** (recommended):
```bash
npm run dev                  # Starts both backend (5000) + frontend (5173) together
npm run dev -- SCRUM-45      # Same but opens dashboard pre-focused on SCRUM-45
```

Or run components separately (see [UserGuide.md](./UserGuide.md)):

## 🛠 Technology Stack

- **Node.js** & **Express**
- **Playwright** (E2E Testing & Automation)
- **React.js** & **Vite** (Real-time Dashboard)
- **Socket.io** (WebSocket communication)
- **ExcelJS** & **Faker** (Test Data Generation)

## 📝 License
ISC
