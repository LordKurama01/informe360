import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const requiredAssets = [
  'public/brand/informe360-hse/logo-light.png',
  'public/brand/informe360-hse/logo-dark.png',
  'public/brand/informe360-hse/mark.png',
  'public/brand/informe360-hse/mark-light.png',
  'public/brand/informe360-hse/app-icon.png',
  'public/brand/informe360-hse/apple-touch-icon.png',
  'public/brand/informe360-hse/favicon-16.png',
  'public/brand/informe360-hse/favicon-32.png',
  'public/brand/informe360-hse/favicon-48.png',
  'public/brand/informe360-hse/favicon-64.png',
  'public/brand/informe360-hse/favicon.ico',
  'public/brand/informe360-hse/og-image.jpg',
];

for (const asset of requiredAssets) {
  assert.equal(existsSync(asset), true, `Missing HSE brand asset: ${asset}`);
}

const hse = readFileSync('src/blocks/hse-control/HseControl.tsx', 'utf8');
assert.match(hse, /\/brand\/informe360-hse\/logo-dark\.png/, 'Dark HSE logo must be used on dark surfaces');
assert.match(hse, /\/brand\/informe360-hse\/logo-light\.png/, 'Light HSE logo must be used on light surfaces');
assert.match(hse, /\/brand\/informe360-hse\/mark\.png/, 'HSE mark must be used in the mobile shell');
assert.match(hse, /\/brand\/informe360-hse\/mark-light\.png/, 'Light HSE mark must be used on dark operational surfaces');

const layout = readFileSync('src/app/layout.tsx', 'utf8');
assert.match(layout, /favicon\.ico/, 'Metadata must expose the favicon');
assert.match(layout, /apple-touch-icon\.png/, 'Metadata must expose Apple touch icon');
assert.match(layout, /og-image\.jpg/, 'Metadata must expose Open Graph image');

console.log('Informe360 HSE branding contract OK');
