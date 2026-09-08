import { chromium } from '@playwright/test';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

const OUTPUT_DIRECTORY = path.resolve(import.meta.dirname, '../public/static');
const TEMPLATES_DIRECTORY = path.resolve(import.meta.dirname, 'asset-templates');
const FAVICON_TEMPLATE = 'favicon.html';
const SOCIAL_PREVIEW_TEMPLATE = 'social-preview.html';
const FAVICON_SIZES = [180, 192, 256, 512];
const SOCIAL_PREVIEW_SIZE = { width: 1200, height: 630 };

const renderTargets = [
  ...FAVICON_SIZES.map((size) => ({
    template: FAVICON_TEMPLATE,
    output: `favicon-${size}.png`,
    width: size,
    height: size,
    transparent: true,
  })),
  {
    template: SOCIAL_PREVIEW_TEMPLATE,
    output: 'social-preview.png',
    ...SOCIAL_PREVIEW_SIZE,
    transparent: false,
  },
];

const renderTarget = async (page, target) => {
  const templateUrl = pathToFileURL(path.join(TEMPLATES_DIRECTORY, target.template)).href;
  await page.setViewportSize({ width: target.width, height: target.height });
  await page.goto(templateUrl);
  await page.screenshot({
    path: path.join(OUTPUT_DIRECTORY, target.output),
    type: 'png',
    omitBackground: target.transparent,
  });
  console.log(`rendered ${target.output} (${target.width}x${target.height})`);
};

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ deviceScaleFactor: 1 });
  for (const target of renderTargets) {
    await renderTarget(page, target);
  }
} finally {
  await browser.close();
}
