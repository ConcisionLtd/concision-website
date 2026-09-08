import { test, expect } from '@playwright/test';

const PAGE_PATHS = ['/', '/privacy/'];
const VIEWPORTS = [
  { width: 375, height: 812 },
  { width: 768, height: 1024 },
  { width: 1280, height: 800 },
];

const readDocumentWidths = (page) =>
  page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));

for (const pagePath of PAGE_PATHS) {
  for (const viewport of VIEWPORTS) {
    test(`${pagePath} has no horizontal overflow at ${viewport.width}px`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto(pagePath);
      const { scrollWidth, clientWidth } = await readDocumentWidths(page);
      expect(scrollWidth).toBe(clientWidth);
    });
  }
}
