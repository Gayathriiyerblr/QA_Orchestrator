import { test, expect, request as pwRequest } from '@playwright/test';

/**
 * SCRUM-10-api.spec.ts — auto-generated API tests from JIRA requirements.
 * Regenerate via scripts/generate_playwright_scripts.js.
 */
const BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000';

test.describe('SCRUM-10: Explore_OrangeHRM_source API tests', () => {
  test('TC_API_01: GET /api/results', async () => {
    const ctx = await pwRequest.newContext({ baseURL: BASE_URL });
    const res = await ctx.get("/api/results");
    expect(res.status()).toBe(200);
    // Response returns HTTP 200 and verifies the module is reachable
    await ctx.dispose();
  });

  test('TC_API_BUG: PUT /api/personal-details', async () => {
    const ctx = await pwRequest.newContext({ baseURL: BASE_URL });
    const res = await ctx.put("/api/personal-details", { data: {"nickname":"XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"} });
    expect(res.status()).toBe(400);
    // Server rejects nicknames longer than 30 characters (known bug: backend accepts them)
    await ctx.dispose();
  });

});
