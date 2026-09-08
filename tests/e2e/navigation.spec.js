import { test, expect } from '@playwright/test';
import { siteConfig } from '../../site.config.js';

const MOBILE_BREAKPOINT = 768;
const mainNav = (page) => page.getByRole('navigation', { name: 'Main' });
const menuButton = (page) => page.getByRole('button', { name: 'Menu' });
const isMobileViewport = ({ viewport }) => viewport.width < MOBILE_BREAKPOINT;
const isDesktopViewport = ({ viewport }) => viewport.width >= MOBILE_BREAKPOINT;

test('the brand link is named after the company and goes home', async ({ page }) => {
  await page.goto('/privacy/');
  const brandLink = page.getByRole('banner').getByRole('link', { name: siteConfig.siteName });
  await expect(brandLink).toHaveAttribute('href', '/');
});

test.describe('mobile menu', () => {
  test.skip(isDesktopViewport, 'mobile viewports only');

  test('is collapsed until the menu button opens it', async ({ page }) => {
    await page.goto('/');
    await expect(mainNav(page)).toBeHidden();
    await expect(menuButton(page)).toHaveAttribute('aria-expanded', 'false');

    await menuButton(page).click();

    await expect(mainNav(page)).toBeVisible();
    await expect(menuButton(page)).toHaveAttribute('aria-expanded', 'true');
  });

  test('closes on Escape', async ({ page }) => {
    await page.goto('/');
    await menuButton(page).click();
    await expect(mainNav(page)).toBeVisible();

    await page.keyboard.press('Escape');

    await expect(mainNav(page)).toBeHidden();
    await expect(menuButton(page)).toHaveAttribute('aria-expanded', 'false');
    await expect(menuButton(page)).toBeFocused();
  });

  test('closes when a link is chosen', async ({ page }) => {
    await page.goto('/');
    await menuButton(page).click();

    await mainNav(page).getByRole('link', { name: 'About' }).click();

    await expect(mainNav(page)).toBeHidden();
  });

  test.describe('without JavaScript', () => {
    test.use({ javaScriptEnabled: false });

    test('the links are visible and there is no menu button', async ({ page }) => {
      await page.goto('/');
      await expect(mainNav(page)).toBeVisible();
      await expect(menuButton(page)).toBeHidden();
    });
  });
});

test.describe('desktop navigation', () => {
  test.skip(isMobileViewport, 'desktop viewports only');

  test('shows the links inline and no menu button', async ({ page }) => {
    await page.goto('/');
    await expect(mainNav(page)).toBeVisible();
    await expect(menuButton(page)).toBeHidden();
    await expect(mainNav(page).getByRole('link', { name: 'Get in touch' })).toBeVisible();
  });
});
