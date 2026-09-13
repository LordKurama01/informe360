import test from 'node:test';
import assert from 'node:assert/strict';
import { computeHseMetrics, buildFindingSearchDocument } from './pilot-utils.mjs';

test('computes commercial HSE metrics without persisting overdue as a status', () => {
  const now = new Date('2026-09-13T03:00:00Z');
  const items = [
    { status: 'open', severity: 'high', due_at: '2026-09-12T03:00:00Z' },
    { status: 'in_progress', severity: 'medium', due_at: '2026-09-15T03:00:00Z' },
    { status: 'closed', severity: 'low', due_at: '2026-09-10T03:00:00Z', closed_at: '2026-09-09T03:00:00Z' },
    { status: 'closed', severity: 'critical', due_at: '2026-09-10T03:00:00Z', closed_at: '2026-09-11T03:00:00Z' },
  ];
  assert.deepEqual(computeHseMetrics(items, now), {
    open: 2,
    overdue: 1,
    dueNext7Days: 1,
    closed: 2,
    closedOnTime: 1,
    closureCompliancePct: 50,
    criticalOpen: 0,
  });
});

test('builds a searchable document from operational fields only', () => {
  const doc = buildFindingSearchDocument({
    code: 'HSE-2026-00031',
    title: 'Pérdida hidráulica',
    description: 'Se observa pérdida visible',
    location_text: 'Sala de bombas',
    element_text: 'Manguera hidráulica',
    responsible_text: 'Mantenimiento',
    category: 'Equipos',
  });
  assert.match(doc, /HSE-2026-00031/);
  assert.match(doc, /Sala de bombas/);
  assert.match(doc, /Mantenimiento/);
  assert.equal(doc.includes('undefined'), false);
});
