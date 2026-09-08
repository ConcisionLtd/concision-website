import { test, expect } from '@playwright/test';

const REVEAL_SELECTOR = '[data-reveal]';
const VISIBLE_CLASS = /is-visible/;
const NOT_YET_VISIBLE_SELECTOR = `${REVEAL_SELECTOR}:not(.is-visible)`;

test('the contact section is marked for reveal and reveals when scrolled into view', async ({
  page,
}) => {
  await page.goto('/');
  const contact = page.locator('#contact');
  await expect(contact).toHaveAttribute('data-reveal', '');
  await expect(contact).not.toHaveClass(VISIBLE_CLASS);

  await contact.scrollIntoViewIfNeeded();

  await expect(contact).toHaveClass(VISIBLE_CLASS);
});

test('everything is revealed at once when reduced motion is preferred', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator(REVEAL_SELECTOR)).not.toHaveCount(0);
  await expect(page.locator(NOT_YET_VISIBLE_SELECTOR)).toHaveCount(0);
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('sections marked for reveal are fully opaque', async ({ page }) => {
    await page.goto('/');
    const opacity = await page
      .locator('#contact')
      .evaluate((element) => getComputedStyle(element).opacity);
    expect(opacity).toBe('1');
  });
});
