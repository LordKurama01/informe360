import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';

const requiredFiles = [
  'src/app/api/hse/channels/whatsapp/route.ts',
  'src/services/hse/channels/meta-whatsapp.ts',
  'src/services/hse/channels/types.ts',
  'src/services/hse/assistant/intent-router.ts',
  'src/services/hse/assistant/processor.ts',
  'src/services/hse/assistant/types.ts',
  'database/supabase/migrations/20260913160000_hse_whatsapp_field_copilot.sql',
];

for (const file of requiredFiles) await access(file);

const route = await readFile('src/app/api/hse/channels/whatsapp/route.ts', 'utf8');
assert.match(route, /X-Hub-Signature-256/i, 'WhatsApp webhook must verify the Meta HMAC signature');
assert.match(route, /hub\.verify_token|verify_token/i, 'WhatsApp webhook must implement Meta challenge verification');
assert.match(route, /request\.text\(\)/, 'Webhook signature verification must use the raw request body');

const adapter = await readFile('src/services/hse/channels/meta-whatsapp.ts', 'utf8');
assert.match(adapter, /createHmac\(['"]sha256['"]/, 'Meta adapter must verify SHA-256 signatures');
assert.match(adapter, /messageType === ['"]audio['"]|['"]audio['"]/, 'Meta adapter must support WhatsApp audio');
assert.match(adapter, /messageType === ['"]image['"]|['"]image['"]/, 'Meta adapter must support WhatsApp images');
assert.match(adapter, /graph\.facebook\.com/, 'Meta adapter must use the official Graph API transport');

const processor = await readFile('src/services/hse/assistant/processor.ts', 'utf8');
assert.match(processor, /awaiting_confirmation/, 'Official finding creation must use an explicit confirmation state');
assert.match(processor, /hse_channel_identities/, 'Channel commands must resolve a linked HSE identity');
assert.match(processor, /provider_message_id|idempotency/i, 'Inbound WhatsApp messages must be idempotent');
assert.match(processor, /transcribeAudio/, 'Audio messages must reuse the existing HSE transcription core');
assert.match(processor, /structureFieldEntry|analyzeImage/, 'WhatsApp findings must reuse the existing HSE AI core');

const migration = await readFile('database/supabase/migrations/20260913160000_hse_whatsapp_field_copilot.sql', 'utf8');
for (const table of ['hse_channel_identities', 'hse_channel_messages', 'hse_assistant_commands', 'hse_conversation_contexts']) {
  assert.match(migration, new RegExp(`create table(?: if not exists)? public\\.${table}`, 'i'), `Migration must create ${table}`);
}
assert.match(migration, /enable row level security/gi, 'New public channel tables must enable RLS');
assert.match(migration, /'whatsapp'/i, 'Reminder channel contract must include WhatsApp');
assert.match(migration, /grant execute[\s\S]*service_role/i, 'Channel finding RPC must be service-role only');

const env = await readFile('.env.example', 'utf8');
for (const name of ['META_APP_SECRET', 'META_WHATSAPP_VERIFY_TOKEN', 'META_WHATSAPP_ACCESS_TOKEN', 'META_WHATSAPP_PHONE_NUMBER_ID', 'META_GRAPH_API_VERSION']) {
  assert.match(env, new RegExp(`^${name}=`, 'm'), `.env.example must document ${name}`);
}

const mobileEnv = await readFile('mobile/.env.example', 'utf8');
assert.doesNotMatch(mobileEnv, /META_APP_SECRET|META_WHATSAPP_ACCESS_TOKEN|SUPABASE_SERVICE_ROLE_KEY/, 'Mobile env must never contain server/provider secrets');
const mobileApi = await readFile('mobile/src/services/api.ts', 'utf8');
assert.doesNotMatch(mobileApi, /META_APP_SECRET|META_WHATSAPP_ACCESS_TOKEN|SUPABASE_SERVICE_ROLE_KEY/, 'Mobile code must never contain server/provider secrets');

console.log(`HSE WhatsApp field copilot contract OK (${requiredFiles.length} required files)`);
