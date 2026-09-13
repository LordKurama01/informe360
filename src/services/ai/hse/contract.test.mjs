import test from 'node:test';
import assert from 'node:assert/strict';
import { HSE_FINDING_SCHEMA, normalizeStructuredDraft } from './contract.mjs';

test('AI schema has no authoritative normative due date field', () => {
  const properties = HSE_FINDING_SCHEMA.properties;
  assert.equal(Object.prototype.hasOwnProperty.call(properties, 'normative_due_at'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(properties, 'due_text'), true);
});

test('normalizer strips unknown fields and keeps user due text only', () => {
  const result = normalizeStructuredDraft({
    title: 'Pérdida en manguera',
    description: 'Pérdida hidráulica visible',
    category: 'equipos',
    severity: 'high',
    responsible_text: 'Mantenimiento',
    due_text: 'mañana',
    confidence: 0.88,
    normative_due_at: '2027-01-01T00:00:00Z',
  });

  assert.deepEqual(result, {
    title: 'Pérdida en manguera',
    description: 'Pérdida hidráulica visible',
    category: 'equipos',
    severity: 'high',
    responsible_text: 'Mantenimiento',
    due_text: 'mañana',
    confidence: 0.88,
  });
  assert.equal('normative_due_at' in result, false);
});
