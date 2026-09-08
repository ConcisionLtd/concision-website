import { test, expect } from '@playwright/test';
import { siteConfig } from '../../site.config.js';

const SERVICE_NAMES = ['Web applications', 'Integrations and automation', 'Consultancy'];

test('the services section lists the three services in order', async ({ page }) => {
  await page.goto('/');
  const services = page.locator('#services');
  await expect(services.getByRole('heading', { level: 2 })).toHaveText('Services');
  await expect(services.getByRole('heading', { level: 3 })).toHaveText(SERVICE_NAMES);
});

test('the about section says when the company was founded and where it works from', async ({
  page,
}) => {
  await page.goto('/');
  const about = page.locator('#about');
  await expect(about.getByRole('heading', { level: 2 })).toHaveText('About');
  await expect(about).toContainText(`founded in ${siteConfig.company.foundingYear}`);
  await expect(about).toContainText(`works from ${siteConfig.company.baseCity}`);
});
