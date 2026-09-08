import { readFileSync } from 'node:fs';

const HEX_TOKEN_PATTERN = /--([\w-]+):\s*(#[0-9a-f]{6})\s*;/gi;
const SRGB_THRESHOLD = 0.04045;

const hexToRgb = (hex) => {
  const value = hex.replace('#', '');
  return [0, 2, 4].map((offset) => parseInt(value.slice(offset, offset + 2), 16));
};

const channelToLinear = (channel) => {
  const scaled = channel / 255;
  return scaled <= SRGB_THRESHOLD ? scaled / 12.92 : ((scaled + 0.055) / 1.055) ** 2.4;
};

export const relativeLuminance = (hex) => {
  const [red, green, blue] = hexToRgb(hex).map(channelToLinear);
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
};

export const contrastRatio = (hexA, hexB) => {
  const luminanceA = relativeLuminance(hexA);
  const luminanceB = relativeLuminance(hexB);
  const lighter = Math.max(luminanceA, luminanceB);
  const darker = Math.min(luminanceA, luminanceB);
  return (lighter + 0.05) / (darker + 0.05);
};

// returns { tokenName: '#rrggbb' } for every six digit hex custom property in a CSS file
export const readColorTokens = (filePath) => {
  const css = readFileSync(filePath, 'utf8');
  const entries = [...css.matchAll(HEX_TOKEN_PATTERN)].map(([, name, hex]) => [
    name,
    hex.toLowerCase(),
  ]);
  return Object.fromEntries(entries);
};
