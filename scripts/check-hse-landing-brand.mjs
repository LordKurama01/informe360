import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

for (const path of [
  'src/blocks/landing/desktop/LandingDesktop.tsx',
  'src/blocks/landing/mobile/LandingMobile.tsx',
]) {
  const source = await readFile(path, 'utf8');
  assert.match(source, /next\/image/, `${path} must use next/image for brand assets`);
  assert.match(source, /\/brand\/informe360-hse\/mark-light\.png/, `${path} must use the HSE brand mark`);
  assert.match(source, /HSE Copilot/, `${path} must identify the HSE product`);
  assert.ok(!source.includes('>360</span>'), `${path} must not restore the generic 360 tile`);
}

console.log('Informe360 HSE landing brand contract OK');
