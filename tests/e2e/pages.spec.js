import { test, expect } from '@playwright/test';

test('the privacy notice is reachable from the footer', async ({ page }) => {
  await page.goto('/');
  const privacyLink = page.getByRole('contentinfo').getByRole('link', { name: 'Privacy' });
  await privacyLink.click();
  await expect(page).toHaveURL(/\/privacy\/$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Privacy notice');
});

test('the privacy notice responds with 200 directly', async ({ request }) => {
  const response = await request.get('/privacy/');
  expect(response.status()).toBe(200);
});

test('the 404 page is built, hidden from search engines and links home', async ({ page }) => {
  await page.goto('/404.html');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Page not found.');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
  await expect(page.getByRole('link', { name: 'Go to the home page' })).toHaveAttribute(
    'href',
    '/'
  );
});
