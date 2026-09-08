// derives the wordmark-only logo (no tagline line) used in the site header from the supplied logo
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const SOURCE_PATH = path.resolve(import.meta.dirname, '../branding/concision-logo.svg');
const OUTPUT_PATH = path.resolve(import.meta.dirname, '../public/static/concision-wordmark.svg');
const TAGLINE_FILL = '#9CA3AF';
const TAGLINE_PATH_PATTERN = new RegExp(`<path[^>]*fill="${TAGLINE_FILL}"[^>]*/>\\s*`);
const SVG_OPEN_TAG_PATTERN = /<svg[^>]*>/;
// the wordmark's bounding box in the logo's coordinate space, with a little breathing room
const WORDMARK_SIZE = { width: 436, height: 68 };

const wordmarkOpenTag = `<svg width="${WORDMARK_SIZE.width}" height="${WORDMARK_SIZE.height}" viewBox="0 0 ${WORDMARK_SIZE.width} ${WORDMARK_SIZE.height}" fill="none" xmlns="http://www.w3.org/2000/svg">`;

const logo = readFileSync(SOURCE_PATH, 'utf8');
const hasTagline = TAGLINE_PATH_PATTERN.test(logo);
if (!hasTagline) {
  throw new Error(`Expected a tagline path filled ${TAGLINE_FILL} in ${SOURCE_PATH}`);
}

const wordmark = logo
  .replace(TAGLINE_PATH_PATTERN, '')
  .replace(SVG_OPEN_TAG_PATTERN, wordmarkOpenTag);
writeFileSync(OUTPUT_PATH, wordmark);
console.log(`wrote ${OUTPUT_PATH}`);
