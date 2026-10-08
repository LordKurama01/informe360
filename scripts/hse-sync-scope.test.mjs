import test from 'node:test';
import assert from 'node:assert/strict';
import { eligibleForSync } from '../mobile/src/services/sync-scope.ts';

test('sync only matching account and company', () => {
  const captures = [
    { id:'ok', ownerUserId:'u1', workspace:{organizationId:'org1'} },
    { id:'other', ownerUserId:'u2', workspace:{organizationId:'org1'} },
    { id:'wrongorg', ownerUserId:'u1', workspace:{organizationId:'org2'} },
    { id:'legacy', workspace:{organizationId:'org1'} },
  ];
  assert.deepEqual(eligibleForSync(captures,{userId:'u1',organizationId:'org1'}).map(c=>c.id),['ok']);
  assert.deepEqual(eligibleForSync(captures,{userId:'',organizationId:'org1'}),[]);
});
