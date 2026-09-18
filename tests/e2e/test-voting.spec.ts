import { test } from '@playwright/test';
test('voting', async ({ page }) => {
  await page.goto('http://localhost:3000/dukungan?peleton=smpn-1-nganjuk-02');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: '/tmp/voting.png', fullPage: true });
});
