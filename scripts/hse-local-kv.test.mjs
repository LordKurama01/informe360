import test from 'node:test';
import assert from 'node:assert/strict';
import { readLocalArray, updateLocalArray } from '../mobile/src/services/local-kv.ts';

function store(initial = null) {
  let raw = initial;
  let fail = false;
  return {
    async getItem() { await Promise.resolve(); return raw; },
    async setItem(_key, value) { await Promise.resolve(); if (fail) { fail = false; throw new Error('disk full'); } raw = value; },
    failOnce() { fail = true; },
    raw() { return raw; },
  };
}

test('concurrent writes preserve all captures', async () => {
  const kv = store();
  await Promise.all(['A','B','C'].map(id => updateLocalArray(kv, 'queue', rows => ({ items: [...rows, id], result: id }))));
  assert.deepEqual(await readLocalArray(kv, 'queue'), ['A', 'B', 'C']);
});

test('corrupted state is not overwritten', async () => {
  const kv = store('{invalid');
  await assert.rejects(updateLocalArray(kv, 'queue', rows => ({ items: [], result: rows.length })));
  assert.equal(kv.raw(), '{invalid');
});

test('full queue does not discard existing data', async () => {
  const kv = store(JSON.stringify(['existing']));
  await assert.rejects(updateLocalArray(kv, 'queue', rows => {
    if (rows.length >= 1) throw new Error('full');
    return { items: [...rows, 'new'], result: true };
  }), /full/);
  assert.deepEqual(await readLocalArray(kv, 'queue'), ['existing']);
});

test('failed disk write preserves data and does not block subsequent mutations', async () => {
  const kv = store(JSON.stringify(['old']));
  kv.failOnce();
  await assert.rejects(updateLocalArray(kv, 'queue', rows => ({ items: [...rows, 'lost'], result: 1 })), /disk full/);
  await updateLocalArray(kv, 'queue', rows => ({ items: [...rows, 'new'], result: 1 }));
  assert.deepEqual(await readLocalArray(kv, 'queue'), ['old', 'new']);
});

test('remove + enqueue never drops new data', async () => {
  const kv = store(JSON.stringify([{ id: 'old' }]));
  await Promise.all([
    updateLocalArray(kv, 'queue', rows => ({ items: rows.filter(row => row.id !== 'old'), result: null })),
    updateLocalArray(kv, 'queue', rows => ({ items: [...rows, { id: 'new' }], result: null })),
  ]);
  assert.deepEqual(await readLocalArray(kv, 'queue'), [{ id: 'new' }]);
});
