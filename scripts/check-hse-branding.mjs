import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const requiredAssets = [
  'public/brand/informe360-hse/informe360-hse-oscuro.svg',
  'public/brand/informe360-hse/informe360-hse-claro.svg',
  'public/brand/informe360-hse/informe360-hse-color.svg',
  'public/brand/informe360-hse/informe360-hse-sin-fondo.svg',
  'public/brand/informe360-hse/favicon.ico',
];

for (const asset of requiredAssets) {
  assert.equal(existsSync(asset), true, `Missing HSE brand asset: ${asset}`);
}

for (const asset of requiredAssets.filter(asset => asset.endsWith('.svg'))) {
  const svg = readFileSync(asset, 'utf8');
  assert.match(svg, /^<svg\b/, `Invalid SVG brand asset: ${asset}`);
  assert.match(svg, /Informe360 HSE/, `Unexpected HSE SVG content: ${asset}`);
}

const hse = readFileSync('src/blocks/hse-control/HseControl.tsx', 'utf8');
assert.match(hse, /informe360-hse-oscuro\.svg/, 'Dark HSE vector logo must be used on dark surfaces');
assert.match(hse, /informe360-hse-claro\.svg/, 'Light HSE vector logo must be used on light surfaces');
assert.ok(!hse.includes('/brand/informe360-hse/logo-dark.png'), 'Invalid legacy dark PNG must not be rendered');
assert.ok(!hse.includes('/brand/informe360-hse/logo-light.png'), 'Invalid legacy light PNG must not be rendered');

const layout = readFileSync('src/app/layout.tsx', 'utf8');
assert.match(layout, /favicon\.ico/, 'Metadata must expose the favicon');

console.log('Informe360 HSE branding contract OK');
