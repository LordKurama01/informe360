import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveUserDueText } from './date-resolution.mjs';

const base = new Date('2026-09-12T12:00:00-03:00');

test('resolves mañana from the user text without consulting AI', () => {
  const result = resolveUserDueText('que mantenimiento lo revise mañana', base);
  assert.equal(result.source, 'user_explicit');
  assert.equal(result.iso, '2026-09-13T15:00:00.000Z');
});

test('resolves explicit dd/mm/yyyy date from the user text', () => {
  const result = resolveUserDueText('revisar el 20/09/2026', base);
  assert.equal(result.source, 'user_explicit');
  assert.equal(result.iso, '2026-09-20T15:00:00.000Z');
});

test('returns null when the user did not state a due date', () => {
  assert.equal(resolveUserDueText('matafuego con tarjeta ilegible', base), null);
});

test('does not turn normative language into a due date', () => {
  assert.equal(resolveUserDueText('según norma se controla anualmente', base), null);
});
