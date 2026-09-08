import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { contrastRatio, readColorTokens } from './helpers/contrast.js';

const MINIMUM_CONTRAST = 4.5;
const tokensPath = path.resolve(import.meta.dirname, '../../styles/variables.css');

// [foreground, background] pairs the design uses for text or for text on filled controls
const textPairs = [
  ['color-text-heading', 'color-surface'],
  ['color-text-heading', 'color-surface-muted'],
  ['color-text-heading', 'color-primary-tint'],
  ['color-text-default', 'color-surface'],
  ['color-text-default', 'color-surface-muted'],
  ['color-text-default', 'color-primary-tint'],
  ['color-text-default', 'color-primary-tint-strong'],
  ['color-text-subtle', 'color-surface'],
  ['color-text-subtle', 'color-surface-muted'],
  ['color-primary-contrast', 'color-surface'],
  ['color-text-on-primary', 'color-primary-contrast'],
  ['color-text-on-primary', 'color-primary-strong'],
  ['color-primary-strong', 'color-primary-tint-strong'],
];

test('black on white is the maximum ratio', () => {
  assert.equal(contrastRatio('#000000', '#ffffff'), 21);
});

for (const [foreground, background] of textPairs) {
  test(`${foreground} on ${background} reaches ${MINIMUM_CONTRAST}:1`, () => {
    const tokens = readColorTokens(tokensPath);
    assert.ok(tokens[foreground], `token --${foreground} is missing or not a six digit hex`);
    assert.ok(tokens[background], `token --${background} is missing or not a six digit hex`);
    const ratio = contrastRatio(tokens[foreground], tokens[background]);
    assert.ok(
      ratio >= MINIMUM_CONTRAST,
      `--${foreground} on --${background} is ${ratio.toFixed(2)}:1`
    );
  });
}
