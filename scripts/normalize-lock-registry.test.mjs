import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeLockfileText } from './normalize-lock-registry.mjs';

test('replaces the internal artifact registry prefix without changing package identity', () => {
  const input = JSON.stringify({
    packages: {
      'node_modules/example': {
        version: '1.2.3',
        resolved: 'https://packages.applied-caas-gateway1.internal.api.openai.org/artifactory/api/npm/npm-public/example/-/example-1.2.3.tgz',
        integrity: 'sha512-example'
      }
    }
  }, null, 2);

  const output = normalizeLockfileText(input);
  const parsed = JSON.parse(output);

  assert.equal(
    parsed.packages['node_modules/example'].resolved,
    'https://registry.npmjs.org/example/-/example-1.2.3.tgz'
  );
  assert.equal(parsed.packages['node_modules/example'].version, '1.2.3');
  assert.equal(parsed.packages['node_modules/example'].integrity, 'sha512-example');
  assert.doesNotMatch(output, /applied-caas-gateway/);
});

test('is a no-op for an already portable lockfile', () => {
  const input = JSON.stringify({
    packages: {
      'node_modules/example': {
        resolved: 'https://registry.npmjs.org/example/-/example-1.2.3.tgz'
      }
    }
  }, null, 2);

  assert.equal(normalizeLockfileText(input), input);
});
