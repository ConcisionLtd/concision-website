import { test, expect } from '@playwright/test';
import { siteConfig } from '../../site.config.js';

const productCard = (page, productName) =>
  page.locator('#products .product-card', { hasText: productName });

test('the Nudge card links to the product site in the same tab', async ({ page }) => {
  await page.goto('/');
  const nudgeLink = page.getByRole('link', { name: 'Visit nudgesupport.com' });
  await expect(nudgeLink).toHaveAttribute('href', siteConfig.products.nudge.url);
  await expect(nudgeLink).not.toHaveAttribute('target');
});

test('the Nudge logo names the product and has explicit dimensions', async ({ page }) => {
  await page.goto('/');
  const logo = page.locator('#products').getByRole('img', { name: siteConfig.products.nudge.name });
  await expect(logo).toHaveAttribute('width', '194');
  await expect(logo).toHaveAttribute('height', '32');
});

test('the Spends card is marked as coming soon and has no link', async ({ page }) => {
  await page.goto('/');
  const spendsCard = productCard(page, siteConfig.products.spends.name);
  await expect(spendsCard).toContainText('Coming soon to iOS');
  await expect(spendsCard.getByRole('link')).toHaveCount(0);
});
