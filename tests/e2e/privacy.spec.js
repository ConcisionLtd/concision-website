import { test, expect } from '@playwright/test';
import { siteConfig } from '../../site.config.js';

const SECTION_HEADINGS = [
  'Who we are',
  'What this notice covers',
  'What we collect and why',
  'Cookies',
  'Who we share it with',
  'Your rights',
  'Complaints',
  'Changes to this notice',
];

test('the privacy notice covers the required sections in order', async ({ page }) => {
  await page.goto('/privacy/');
  await expect(page.getByRole('heading', { level: 2 })).toHaveText(SECTION_HEADINGS);
});

test('the privacy notice identifies the company and how to reach it', async ({ page }) => {
  await page.goto('/privacy/');
  const article = page.getByRole('article');
  await expect(article).toContainText(siteConfig.company.legalName);
  await expect(article).toContainText(siteConfig.company.number);
  await expect(
    article.getByRole('link', { name: siteConfig.contactEmail }).first()
  ).toHaveAttribute('href', `mailto:${siteConfig.contactEmail}`);
  await expect(article.getByRole('link', { name: /ico\.org\.uk/ })).toHaveAttribute(
    'href',
    'https://ico.org.uk'
  );
});

test('the privacy notice states when it was last updated', async ({ page }) => {
  await page.goto('/privacy/');
  await expect(page.getByRole('article')).toContainText(/Last updated \d{1,2} \w+ \d{4}/);
});
