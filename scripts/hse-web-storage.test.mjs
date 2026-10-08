import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createWebKeyValueStore } from '../mobile/src/lib/web-storage.ts';

function fakeStorage() {
  const values = new Map();
  return {
    getItem(key) { return values.get(key) ?? null; },
    setItem(key, value) { values.set(key, value); },
    removeItem(key) { values.delete(key); },
  };
}

test('browser session and workspace survive adapter recreation', () => {
  const backing = fakeStorage();
  const first = createWebKeyValueStore(() => backing);
  first.setItem('hse_workspace', JSON.stringify({ organizationId: 'org1' }));
  first.setItem('sb-auth-token', 'existing-session');
  const afterReload = createWebKeyValueStore(() => backing);
  assert.deepEqual(JSON.parse(afterReload.getItem('hse_workspace')), { organizationId: 'org1' });
  assert.equal(afterReload.getItem('sb-auth-token'), 'existing-session');
  afterReload.removeItem('sb-auth-token');
  assert.equal(first.getItem('sb-auth-token'), null);
});

test('blocked browser storage does not claim a successful write', () => {
  const unavailable = createWebKeyValueStore(() => null);
  assert.equal(unavailable.getItem('token'), null);
  assert.throws(() => unavailable.setItem('token', 'secret'), /no está disponible/);
  unavailable.removeItem('token');

  const denied = createWebKeyValueStore(() => {
    throw new Error('SecurityError');
  });
  assert.equal(denied.getItem('token'), null);
  assert.throws(() => denied.setItem('token', 'secret'), /SecurityError/);
});

test('Expo SecureStore is never called on the web, including workspace flow', async () => {
  const secure = await readFile('mobile/src/lib/secure-storage.ts', 'utf8');
  const workspace = await readFile('mobile/src/services/workspace.ts', 'utf8');
  assert.match(secure, /Platform\.OS === 'web'/);
  assert.match(secure, /webStorage\.getItem\(base\)/);
  assert.match(secure, /webStorage\.setItem\(base, value\)/);
  assert.match(secure, /webStorage\.removeItem\(base\)/);
  assert.match(workspace, /secureStorage\.getItem\(KEY\)/);
  assert.match(workspace, /secureStorage\.setItem\(KEY/);
  assert.doesNotMatch(workspace, /SecureStore\.getItemAsync|SecureStore\.setItemAsync/);
});
