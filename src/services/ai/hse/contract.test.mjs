import test from 'node:test';
import assert from 'node:assert/strict';
import { HSE_FINDING_SCHEMA, normalizeStructuredDraft } from './contract.mjs';

test('AI schema contains operational fields but no authoritative normative due date', () => {
  const properties = HSE_FINDING_SCHEMA.properties;
  assert.equal(Object.prototype.hasOwnProperty.call(properties, 'normative_due_at'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(properties, 'due_text'), true);
  assert.equal(Object.prototype.hasOwnProperty.call(properties, 'action'), true);
  assert.equal(Object.prototype.hasOwnProperty.call(properties, 'location_text'), true);
  assert.equal(Object.prototype.hasOwnProperty.call(properties, 'element_text'), true);
});

test('normalizer strips unknown fields and keeps operational fields', () => {
  const result = normalizeStructuredDraft({
    title: 'Pérdida en manguera',
    description: 'Pérdida hidráulica visible',
    category: 'equipos',
    severity: 'high',
    location_text: 'Sala de bombas',
    element_text: 'Manguera hidráulica',
    action: 'Revisar y reparar la pérdida',
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
    location_text: 'Sala de bombas',
    element_text: 'Manguera hidráulica',
    action: 'Revisar y reparar la pérdida',
    responsible_text: 'Mantenimiento',
    due_text: 'mañana',
    confidence: 0.88,
  });
  assert.equal('normative_due_at' in result, false);
});
