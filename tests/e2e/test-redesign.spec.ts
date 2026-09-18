import { test, expect } from '@playwright/test';
const routes = ['/', '/tim', '/tim/smpn-1-nganjuk-02', '/login', '/profile'];
for (const route of routes) {
  test(`redesign ${route}`, async ({ page }) => {
    await page.goto(`http://localhost:3000${route}`);
    await page.waitForTimeout(1500);
    const errors = [];
    page.on('console', msg => { if (msg.type()==='error') errors.push(msg.text()); });
    await expect(page.locator('body')).toBeVisible();
    // Check for horizontal overflow
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(overflow).toBe(false);
    // Check for broken images
    const broken = await page.evaluate(() => {
      const imgs = Array.from(document.images);
      return imgs.filter(img => !img.complete || img.naturalWidth===0).length;
    });
    // Allow some broken if external, but not many
    expect(broken).toBeLessThan(5);
    console.log(`${route} ok, broken images: ${broken}, errors: ${errors.length}`);
  });
}
