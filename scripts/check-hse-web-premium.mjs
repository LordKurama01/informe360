import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const ui = await readFile('src/blocks/hse-control/HseControl.tsx', 'utf8');
const css = await readFile('src/blocks/hse-control/HseControl.module.css', 'utf8');
const layout = await readFile('src/app/layout.tsx', 'utf8');

for (const token of ['authVisual', 'appShell', 'sideNav', 'mobileDock', 'quickCapture']) {
  assert.match(ui, new RegExp(`styles\\.${token}`), `HSE web UI must render ${token}`);
  assert.match(css, new RegExp(`\\.${token}\\b`), `HSE web styles must define ${token}`);
}

assert.doesNotMatch(ui, /El escritorio de la operación/i, 'Legacy HSE login copy must be removed');
assert.match(ui, /HSE Copilot/i, 'HSE Copilot must be the primary product name in the web experience');
assert.match(css, /@media\s*\(max-width:\s*760px\)/i, 'HSE web must include a mobile-first compact navigation breakpoint');
assert.match(css, /min-height:\s*(48|5[0-9])px/i, 'Primary interactive controls must provide field-friendly touch targets');
assert.match(layout, /Informe360\s*HSE\s*Copilot/i, 'Root metadata must use the HSE Copilot product identity');

console.log('HSE premium web contract OK');
