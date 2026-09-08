import { test, expect } from '@playwright/test';
import { siteConfig } from '../../site.config.js';

const SOCIAL_PREVIEW_URL = `${siteConfig.siteUrl}/assets/social-preview.png`;
const IGNORED_REQUEST_PATHS = ['/favicon.ico'];
const PUBLIC_FILES = [
  { path: '/assets/favicon.svg', contentType: /image\/svg\+xml/ },
  { path: '/assets/favicon-180.png', contentType: /image\/png/ },
  { path: '/assets/favicon-256.png', contentType: /image\/png/ },
  { path: '/assets/social-preview.png', contentType: /image\/png/ },
  { path: '/manifest.json', contentType: /json/ },
  { path: '/sitemap.xml', contentType: /xml/ },
  { path: '/robots.txt', contentType: /text\/plain/ },
];
const PAGES = [
  { path: '/', canonical: `${siteConfig.siteUrl}/` },
  { path: '/privacy/', canonical: `${siteConfig.siteUrl}/privacy/` },
];

const isIgnoredRequest = (url) => IGNORED_REQUEST_PATHS.some((ignored) => url.endsWith(ignored));

for (const { path, canonical } of PAGES) {
  test(`${path} has a title, description, canonical and social image`, async ({ page }) => {
    await page.goto(path);
    await expect(page).toHaveTitle(new RegExp(siteConfig.siteName));
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /.{40,}/);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', canonical);
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
      'content',
      SOCIAL_PREVIEW_URL
    );
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
      'content',
      'summary_large_image'
    );
  });

  test(`${path} loads without console errors or failed requests`, async ({ page }) => {
    const problems = [];
    page.on('console', (message) => {
      const isError = message.type() === 'error';
      if (isError) {
        problems.push(`console: ${message.text()}`);
      }
    });
    page.on('pageerror', (error) => problems.push(`pageerror: ${error.message}`));
    page.on('response', (response) => {
      const isFailure = response.status() >= 400 && !isIgnoredRequest(response.url());
      if (isFailure) {
        problems.push(`${response.status()} ${response.url()}`);
      }
    });

    await page.goto(path);
    await page.waitForLoadState('networkidle');

    expect(problems).toEqual([]);
  });
}

test('the home page JSON-LD describes the organisation', async ({ page }) => {
  await page.goto('/');
  const jsonLd = await page.locator('script[type="application/ld+json"]').textContent();
  const organisation = JSON.parse(jsonLd);

  expect(organisation['@type']).toBe('Organization');
  expect(organisation.name).toBe(siteConfig.company.tradingName);
  expect(organisation.legalName).toBe(siteConfig.company.legalName);
  expect(organisation.url).toBe(siteConfig.siteUrl);
  expect(organisation.email).toBe(siteConfig.contactEmail);
  expect(organisation.foundingDate).toBe(siteConfig.company.foundingDate);
  expect(organisation.identifier.value).toBe(siteConfig.company.number);
  expect(organisation.address.postalCode).toBe(siteConfig.company.registeredOffice.postcode);
  expect(organisation.address.addressCountry).toBe('GB');
});

test('the icons, manifest, sitemap and robots files are served with the right type', async ({
  request,
}) => {
  for (const { path, contentType } of PUBLIC_FILES) {
    const response = await request.get(path);
    expect(response.status(), path).toBe(200);
    expect(response.headers()['content-type'], path).toMatch(contentType);
  }
});
