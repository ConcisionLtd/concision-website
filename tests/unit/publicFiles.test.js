import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { siteConfig } from '../../site.config.js';

const publicDirectory = path.resolve(import.meta.dirname, '../../public');
const readPublicFile = (name) => readFileSync(path.join(publicDirectory, name), 'utf8');

test('every sitemap URL is on the site domain and there is one per page', () => {
  const sitemap = readPublicFile('sitemap.xml');
  const locations = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(([, url]) => url);
  assert.deepEqual(locations, [`${siteConfig.siteUrl}/`, `${siteConfig.siteUrl}/privacy/`]);
});

test('robots.txt allows crawling and points at the sitemap', () => {
  const robots = readPublicFile('robots.txt');
  assert.match(robots, /^User-agent: \*\nAllow: \/$/m);
  assert.match(robots, new RegExp(`^Sitemap: ${siteConfig.siteUrl}/sitemap\\.xml$`, 'm'));
});

test('the manifest lists the 192 and 512 pixel icons', () => {
  const manifest = JSON.parse(readPublicFile('manifest.json'));
  const sizes = manifest.icons.map((icon) => icon.sizes);
  assert.deepEqual(sizes, ['192x192', '512x512']);
  assert.equal(manifest.name, siteConfig.siteName);
});

test('_redirects sends www to the apex domain', () => {
  const wwwUrl = siteConfig.siteUrl.replace('https://', 'https://www.');
  const redirects = readPublicFile('_redirects');
  assert.equal(redirects.trim(), `${wwwUrl}/* ${siteConfig.siteUrl}/:splat 301`);
});
