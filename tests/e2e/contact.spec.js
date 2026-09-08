import { test, expect } from '@playwright/test';
import { siteConfig } from '../../site.config.js';

const ANCHOR_LINK_SELECTOR = 'a[href*="#"]';

const readAnchorIds = (locator) =>
  locator.evaluateAll((links) =>
    links.map((link) => link.getAttribute('href').split('#')[1]).filter(Boolean)
  );

test('the contact button is a mailto link to the company address', async ({ page }) => {
  await page.goto('/');
  const contact = page.locator('#contact');
  const emailButton = contact.getByRole('link', { name: siteConfig.contactEmail });
  await expect(emailButton).toHaveAttribute('href', `mailto:${siteConfig.contactEmail}`);
});

test('the contact section labels the London address as the registered office', async ({ page }) => {
  await page.goto('/');
  const contact = page.locator('#contact');
  await expect(contact).toContainText('Registered office');
  await expect(contact).toContainText(siteConfig.company.registeredOffice.postcode);
  await expect(contact).not.toContainText('our office');
});

test('every header link and hero button targets a section that exists', async ({ page }) => {
  await page.goto('/');
  const headerAnchors = page.locator(`header ${ANCHOR_LINK_SELECTOR}`);
  const heroAnchors = page.locator(`.hero ${ANCHOR_LINK_SELECTOR}`);
  const ids = [...(await readAnchorIds(headerAnchors)), ...(await readAnchorIds(heroAnchors))];

  expect(ids.length).toBeGreaterThanOrEqual(6);
  for (const id of ids) {
    await expect(page.locator(`#${id}`), `#${id} should exist`).toHaveCount(1);
  }
});
