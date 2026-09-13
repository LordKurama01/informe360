import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateRequiredFields, validateFormSchema } from './validation.mjs';

const validSchema = {
  version: 1,
  title: 'Trabajo en altura',
  sections: [
    {
      id: 'arnes',
      title: 'Arnés',
      fields: [
        { id: 'costuras', type: 'compliance', label: 'Costuras íntegras', required: true, createFindingOnFail: true },
        { id: 'foto', type: 'photo', label: 'Evidencia fotográfica' },
      ],
    },
  ],
};

test('accepts a supported HSE form schema', () => {
  assert.deepEqual(validateFormSchema(validSchema), { ok: true, errors: [] });
});

test('rejects duplicate field ids', () => {
  const schema = structuredClone(validSchema);
  schema.sections[0].fields.push({ id: 'costuras', type: 'text', label: 'Duplicado' });
  const result = validateFormSchema(schema);
  assert.equal(result.ok, false);
  assert.match(result.errors.join(' '), /duplicate field id/i);
});

test('rejects unsupported field types and empty selects', () => {
  const schema = structuredClone(validSchema);
  schema.sections[0].fields = [
    { id: 'bad', type: 'magic', label: 'Campo raro' },
    { id: 'sel', type: 'select', label: 'Selección', options: [] },
  ];
  const result = validateFormSchema(schema);
  assert.equal(result.ok, false);
  assert.match(result.errors.join(' '), /unsupported field type/i);
  assert.match(result.errors.join(' '), /at least one option/i);
});

test('reports required fields that are missing', () => {
  const missing = evaluateRequiredFields(validSchema, { costuras: null });
  assert.deepEqual(missing, ['costuras']);
});

test('accepts compliance values only from the fixed enum', () => {
  const schema = structuredClone(validSchema);
  assert.deepEqual(evaluateRequiredFields(schema, { costuras: 'complies' }), []);
  assert.deepEqual(evaluateRequiredFields(schema, { costuras: 'non_compliant' }), []);
  assert.deepEqual(evaluateRequiredFields(schema, { costuras: 'na' }), []);
  assert.deepEqual(evaluateRequiredFields(schema, { costuras: 'maybe' }), ['costuras']);
});
