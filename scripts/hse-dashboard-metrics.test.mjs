import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { formatHseCount, formatClosureCompliance, hseDataStatusLabel } from '../src/shared/hse/dashboard-metrics.ts';

test('real zeros display only after data is loaded', () => {
  assert.equal(formatHseCount(0, 'ready'), '0');
  assert.equal(formatHseCount(0, 'loading'), '—');
  assert.equal(formatHseCount(0, 'error'), '—');
  assert.equal(formatHseCount(-1, 'ready'), '—');
});

test('closure indicator never suggests 0% performance without closed findings', () => {
  assert.equal(formatClosureCompliance({ closed: 0, closureCompliancePct: 0 }, 'ready'), '—');
  assert.equal(formatClosureCompliance({ closed: 3, closureCompliancePct: 67 }, 'ready'), '67%');
  assert.equal(formatClosureCompliance({ closed: 3, closureCompliancePct: 0 }, 'ready'), '0%');
  assert.equal(formatClosureCompliance({ closed: 3, closureCompliancePct: 67 }, 'error'), '—');
  assert.equal(formatClosureCompliance({ closed: 4, closureCompliancePct: Number.NaN }, 'ready'), '—');
});

test('status label never claims live connectivity based only on UI rendering', () => {
  assert.equal(hseDataStatusLabel('ready'), 'Datos actualizados');
  assert.equal(hseDataStatusLabel('loading'), 'Actualizando datos…');
  assert.equal(hseDataStatusLabel('error'), 'Error al actualizar');
});

test('overview and reports reserve empty states for successful query results', async () => {
  const ui = await readFile('src/blocks/hse-control/HseControl.tsx', 'utf8');
  assert.match(ui, /dataStatus === 'ready' && !visibleReports\.length/, 'Reports cannot show zero if read failed');
  assert.match(ui, /dataStatus === 'ready' && !visible\.length/, 'Findings cannot show zero if read failed');
  assert.match(ui, /setDataStatus\('error'\)/, 'Failure state must be explicit');
  assert.match(ui, /loadWorkspace\(\)\.catch\(handleLoadError\)/, 'Manual refresh must catch errors');
  assert.match(ui, /formatClosureCompliance\(summary,dataStatus\)/, 'Closure KPI is guarded by real denominator');
  assert.doesNotMatch(ui, /<i\/>En línea/, 'Stale online badge must not claim active connectivity');
});
