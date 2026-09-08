import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const wordmarkPath = path.resolve(
  import.meta.dirname,
  '../../public/static/concision-wordmark.svg'
);
const TAGLINE_FILL = '#9CA3AF';
const WORDMARK_FILLS = ['#757A83', '#16B3B9'];

test('the header wordmark is the logo without its tagline line', () => {
  const wordmark = readFileSync(wordmarkPath, 'utf8');
  assert.doesNotMatch(wordmark, new RegExp(TAGLINE_FILL));
  for (const fill of WORDMARK_FILLS) {
    assert.match(wordmark, new RegExp(`fill="${fill}"`), `missing wordmark path ${fill}`);
  }
  assert.match(wordmark, /viewBox="0 0 436 68"/);
});
