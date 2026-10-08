import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const source = await readFile('src/app/api/hse/health/route.ts', 'utf8');
assert.ok(source.includes('ready: supabaseAdminConfigured'));
assert.ok(source.includes('serverData: supabaseAdminConfigured'));
assert.ok(source.includes('enhancedAi: enhancedAiConfigured'));
assert.ok(source.includes('whatsapp: whatsapp.configured'));
assert.ok(source.includes('ok: true'));
console.log('HSE runtime readiness contract OK');
