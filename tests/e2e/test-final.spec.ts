import { test, expect } from '@playwright/test';
const viewports = [
  { w: 390, h: 844, name: '390' },
  { w: 768, h: 1024, name: '768' },
  { w: 1280, h: 720, name: '1280' },
  { w: 1366, h: 768, name: '1366' },
  { w: 1920, h: 1080, name: '1920' },
];
for (const vp of viewports) {
  test(`responsive ${vp.name}`, async ({ page }) => {
    await page.setViewportSize({ width: vp.w, height: vp.h });
    await page.goto('http://localhost:3000/');
    await page.waitForTimeout(1500);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(overflow).toBe(false);
    await expect(page.locator('body')).toBeVisible();
    // Check hero headline visible
    await expect(page.locator('text=THE CROWD')).toBeVisible();
  });
}
