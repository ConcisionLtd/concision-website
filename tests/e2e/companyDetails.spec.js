import { test, expect } from '@playwright/test';
import { siteConfig } from '../../site.config.js';

const PAGE_PATHS = ['/', '/privacy/', '/404.html'];

// the legal details must be in the shipped HTML, so these run with JavaScript off
test.use({ javaScriptEnabled: false });

for (const pagePath of PAGE_PATHS) {
  test(`the footer on ${pagePath} shows the legal details without JavaScript`, async ({ page }) => {
    await page.goto(pagePath);
    const footer = page.getByRole('contentinfo');
    const { company } = siteConfig;

    await expect(footer).toContainText(company.legalName);
    await expect(footer).toContainText(`company number ${company.number}`);
    await expect(footer).toContainText(`registered in ${company.registeredIn}`);
    await expect(footer).toContainText('Registered office:');
    await expect(footer).toContainText(company.registeredOffice.line1);
    await expect(footer).toContainText(company.registeredOffice.postcode);
    await expect(footer).toContainText(siteConfig.contactEmail);
  });

  test(`the footer on ${pagePath} shows the current year`, async ({ page }) => {
    await page.goto(pagePath);
    const currentYear = String(new Date().getFullYear());
    await expect(page.getByRole('contentinfo')).toContainText(`© ${currentYear}`);
  });
}
