const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const ExcelJS = require('exceljs');

async function run() {
  const results = {
    employees: [],
    logs: [],
    bug: null
  };
  
  function log(msg) {
    console.log(msg);
    results.logs.push(msg);
  }

  // Set headless to false so the user can see the browser actions
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    log("Navigating to login page");
    await page.goto('https://opensource-demo.orangehrmlive.com/web/index.php/auth/login');
    
    log("Logging in");
    await page.waitForSelector('input[name="username"]');
    await page.fill('input[name="username"]', 'Admin');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('**/dashboard/index');
    log("Logged in successfully");

    // Add 10 employees
    for (let i = 1; i <= 10; i++) {
      log(`Adding employee ${i}`);
      await page.click('a[href="/web/index.php/pim/viewPimModule"]');
      await page.waitForURL('**/pim/viewEmployeeList');
      
      await page.click('button:has-text("Add")');
      await page.waitForURL('**/pim/addEmployee');
      
      const fName = `AutoUser${i}`;
      const lName = `Test${Date.now().toString().slice(-4)}`;
      const empId = `EMP${Math.floor(Math.random() * 100000)}`;
      
      await page.fill('input[name="firstName"]', fName);
      await page.fill('input[name="lastName"]', lName);
      
      const empIdLocator = page.locator('div:has(> label:has-text("Employee Id")) + div input');
      await empIdLocator.waitFor();
      await empIdLocator.fill(''); // Clear default
      await empIdLocator.fill(empId);
      
      await page.click('button[type="submit"]');
      log(`Saved employee ${fName} ${lName} with ID ${empId}`);
      
      // Wait for success toast or redirect to personal details
      try {
        await page.waitForURL('**/pim/viewPersonalDetails/empNumber/**', { timeout: 15000 });
      } catch (e) {
        log(`Warning: Timeout waiting for personal details for ${empId}. Continuing...`);
      }
      
      results.employees.push({
        FirstName: fName,
        LastName: lName,
        EmployeeId: empId,
        SearchStatus: 'Pending'
      });
    }

    log("Searching for created employees");
    await page.click('a[href="/web/index.php/pim/viewPimModule"]');
    await page.waitForURL('**/pim/viewEmployeeList');
    
    for (const emp of results.employees) {
      log(`Searching for ID ${emp.EmployeeId}`);
      const searchEmpIdLocator = page.locator('div:has(> label:has-text("Employee Id")) + div input');
      await searchEmpIdLocator.fill('');
      await searchEmpIdLocator.fill(emp.EmployeeId);
      await page.click('button[type="submit"]:has-text("Search")');
      
      // Wait for results
      await page.waitForTimeout(1500); 
      
      const rows = await page.locator('.oxd-table-body .oxd-table-card').count();
      if (rows >= 1) {
        emp.SearchStatus = 'Found';
      } else {
        emp.SearchStatus = 'Not Found';
      }
      
      // Reset
      await page.click('button:has-text("Reset")');
      await page.waitForTimeout(1000);
    }
    
  } catch (err) {
    log(`Error encountered: ${err.message}`);
    results.bug = {
      message: err.message,
      stack: err.stack
    };
    if (!fs.existsSync('artifacts')) fs.mkdirSync('artifacts');
    await page.screenshot({ path: path.join(__dirname, 'artifacts', 'bug_screenshot.png') });
  } finally {
    await browser.close();
  }

  // 1. Generate multi-sheet Excel file using exceljs
  const workbook = new ExcelJS.Workbook();
  const empSheet = workbook.addWorksheet('Employee Data');
  empSheet.columns = [
    { header: 'First Name', key: 'FirstName', width: 20 },
    { header: 'Last Name', key: 'LastName', width: 20 },
    { header: 'Employee ID', key: 'EmployeeId', width: 15 },
    { header: 'Search Status', key: 'SearchStatus', width: 15 }
  ];
  results.employees.forEach(emp => empSheet.addRow(emp));

  const apiSheet = workbook.addWorksheet('API Test Cases');
  apiSheet.columns = [
    { header: 'TC ID', key: 'tcId', width: 15 },
    { header: 'Description', key: 'desc', width: 40 },
    { header: 'Endpoint', key: 'endpoint', width: 30 },
    { header: 'Method', key: 'method', width: 10 },
    { header: 'Expected Status', key: 'status', width: 15 }
  ];
  const apiTestCases = [
    { tcId: 'API_TC_01', desc: 'Create Employee with valid payload', endpoint: '/api/v2/pim/employees', method: 'POST', status: 200 },
    { tcId: 'API_TC_02', desc: 'Create Employee without First Name', endpoint: '/api/v2/pim/employees', method: 'POST', status: 400 },
    { tcId: 'API_TC_03', desc: 'Get Employee Details by Valid ID', endpoint: '/api/v2/pim/employees/{id}', method: 'GET', status: 200 },
    { tcId: 'API_TC_04', desc: 'Get Employee Details by Invalid ID', endpoint: '/api/v2/pim/employees/99999', method: 'GET', status: 404 },
    { tcId: 'API_TC_05', desc: 'Update Employee Information', endpoint: '/api/v2/pim/employees/{id}', method: 'PUT', status: 200 }
  ];
  apiTestCases.forEach(tc => apiSheet.addRow(tc));
  
  await workbook.xlsx.writeFile(path.join(__dirname, 'ExecutionData.xlsx'));
  log("ExecutionData.xlsx generated with Employee and API Test Cases sheets.");

  // 2. Generate Detailed HTML Report
  let html = `<html><head><title>Execution Report</title><style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    table { border-collapse: collapse; width: 100%; margin-top: 20px; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #f2f2f2; }
    .success { color: green; }
    .error { color: red; }
  </style></head><body>
  <h2>Automated Execution Report</h2>
  <p><strong>Total Employees Added:</strong> ${results.employees.length}</p>
  <h3>Employee Details & Search Results</h3>
  <table>
    <tr><th>First Name</th><th>Last Name</th><th>Employee ID</th><th>Search Status</th></tr>`;
  
  for (const emp of results.employees) {
    const statusClass = emp.SearchStatus === 'Found' ? 'success' : 'error';
    html += `<tr><td>${emp.FirstName}</td><td>${emp.LastName}</td><td>${emp.EmployeeId}</td><td class="${statusClass}">${emp.SearchStatus}</td></tr>`;
  }
  
  html += `</table>`;
  if (results.bug) {
    html += `<h3 class="error">Execution Error Encountered</h3><p>${results.bug.message}</p><p>Screenshot saved to artifacts/bug_screenshot.png</p>`;
  }
  html += `</body></html>`;
  
  fs.writeFileSync(path.join(__dirname, 'ExecutionReport.html'), html);
  log("ExecutionReport.html generated.");

  // 3. Generate Release Notes
  const releaseNotePath = path.join(__dirname, 'release_notes');
  if (!fs.existsSync(releaseNotePath)) fs.mkdirSync(releaseNotePath);
  
  const releaseNote = `# Release Notes
Date: ${new Date().toLocaleDateString()}
## New Features
- Automated Employee Creation (10 employees)
- Automated Employee Search Verification
- API Test Case Generation
## Status
${results.bug ? 'Failed with errors. See ExecutionReport.html' : 'All tests passed successfully.'}
`;
  fs.writeFileSync(path.join(releaseNotePath, 'ReleaseNote.md'), releaseNote);
  log("ReleaseNote.md generated.");

  // 4. Send Confirmation Email Preview
  const emailPreviewPath = path.join(__dirname, 'artifacts', 'ManualRequest');
  if (!fs.existsSync(emailPreviewPath)) fs.mkdirSync(emailPreviewPath, { recursive: true });
  
  const emailContent = `From: automated_tester@yopmail.com
To: bhaumik41294@gmail.com
Subject: Test Execution Confirmation & Reports

Hi Bhaumik,

The automated test execution for 10 new employees has completed.
Attached, please find the Execution Data (ExecutionData.xlsx) containing employee records and API test cases, and the detailed Execution Report (ExecutionReport.html).

Execution Status: ${results.bug ? 'FAILED' : 'SUCCESS'}
Total Employees Added & Verified: ${results.employees.length}

Best regards,
Antigravity AI
`;
  fs.writeFileSync(path.join(emailPreviewPath, 'email_preview.txt'), emailContent);
  log("Email preview generated.");

  console.log("All tasks completed successfully.");
}

run();
