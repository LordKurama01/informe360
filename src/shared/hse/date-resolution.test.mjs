import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveUserDueText } from './date-resolution.mjs';

const base = new Date('2026-09-12T12:00:00-03:00'); // Saturday in Buenos Aires

test('resolves mañana from the user text without consulting AI', () => {
  const result = resolveUserDueText('que mantenimiento lo revise mañana', base);
  assert.equal(result.source, 'user_explicit');
  assert.equal(result.iso, '2026-09-13T15:00:00.000Z');
});

test('resolves mañana with an explicit local time', () => {
  const result = resolveUserDueText('recordame mañana a las 9 revisar la amoladora', base);
  assert.equal(result.source, 'user_explicit');
  assert.equal(result.iso, '2026-09-13T12:00:00.000Z');
});

test('resolves the next named weekday in Buenos Aires', () => {
  const result = resolveUserDueText('que electricidad lo vea el viernes', base);
  assert.equal(result.source, 'user_explicit');
  assert.equal(result.iso, '2026-09-18T15:00:00.000Z');
});

test('resolves a named weekday with an explicit time', () => {
  const result = resolveUserDueText('el viernes a las 9:30 revisar el equipo', base);
  assert.equal(result.source, 'user_explicit');
  assert.equal(result.iso, '2026-09-18T12:30:00.000Z');
});

test('resolves explicit dd/mm/yyyy date from the user text', () => {
  const result = resolveUserDueText('revisar el 20/09/2026', base);
  assert.equal(result.source, 'user_explicit');
  assert.equal(result.iso, '2026-09-20T15:00:00.000Z');
});

test('resolves explicit date with an explicit local time', () => {
  const result = resolveUserDueText('revisar el 20/09/2026 a las 14', base);
  assert.equal(result.source, 'user_explicit');
  assert.equal(result.iso, '2026-09-20T17:00:00.000Z');
});

test('returns null when the user did not state a due date', () => {
  assert.equal(resolveUserDueText('matafuego con tarjeta ilegible', base), null);
});

test('does not turn normative language into a due date', () => {
  assert.equal(resolveUserDueText('según norma se controla anualmente', base), null);
});
