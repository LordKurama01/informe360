import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';

const requiredFiles = [
  'mobile/package.json',
  'mobile/app.json',
  'mobile/app/_layout.tsx',
  'mobile/app/index.tsx',
  'mobile/app/login.tsx',
  'mobile/app/onboarding.tsx',
  'mobile/app/register.tsx',
  'mobile/app/review-draft.tsx',
  'mobile/app/(tabs)/index.tsx',
  'mobile/app/(tabs)/findings.tsx',
  'mobile/app/(tabs)/alerts.tsx',
  'mobile/app/finding/[id].tsx',
  'mobile/src/lib/supabase.ts',
  'mobile/src/providers/auth-provider.tsx',
  'mobile/src/services/findings.ts',
  'mobile/src/services/api.ts',
  'mobile/src/services/upload.ts',
  'mobile/src/services/notifications.ts',
];

for (const file of requiredFiles) await access(file);

const pkg = JSON.parse(await readFile('mobile/package.json', 'utf8'));
assert.match(pkg.dependencies.expo, /^~57\./, 'mobile must use Expo SDK 57');
assert.ok(pkg.dependencies['expo-camera'], 'camera is required');
assert.ok(pkg.dependencies['expo-audio'], 'audio is required');
assert.ok(pkg.dependencies['expo-notifications'], 'notifications are required');
assert.ok(pkg.dependencies['@supabase/supabase-js'], 'Supabase client is required');

const appConfig = JSON.parse(await readFile('mobile/app.json', 'utf8'));
assert.equal(appConfig.expo.scheme, 'hsecopilot');
assert.ok(appConfig.expo.plugins.some((entry) => entry === 'expo-router'), 'Expo Router plugin required');

const supabaseSource = await readFile('mobile/src/lib/supabase.ts', 'utf8');
assert.doesNotMatch(supabaseSource, /SERVICE_ROLE/i, 'mobile must never contain a service role key');

console.log(`Mobile P0 structure OK (${requiredFiles.length} required files)`);
