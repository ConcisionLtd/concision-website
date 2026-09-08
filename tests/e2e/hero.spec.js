import { test, expect } from '@playwright/test';
import { siteConfig } from '../../site.config.js';

const HERO_SELECTOR = '.hero';

test('the hero carries the single h1 and both calls to action', async ({ page }) => {
  await page.goto('/');
  const headings = page.getByRole('heading', { level: 1 });
  await expect(headings).toHaveCount(1);
  await expect(headings).toContainText('cuts the nonsense');
  await expect(page.getByRole('link', { name: 'See our products' })).toHaveAttribute(
    'href',
    '#products'
  );
  await expect(page.getByRole('link', { name: 'Work with us' })).toHaveAttribute(
    'href',
    '#contact'
  );
});

test('the hero says where the company works from', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator(HERO_SELECTOR)).toContainText(siteConfig.company.baseCity);
});
