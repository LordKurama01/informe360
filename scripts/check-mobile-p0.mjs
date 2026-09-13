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
  'mobile/app/pending-reviews.tsx',
  'mobile/app/(tabs)/index.tsx',
  'mobile/app/(tabs)/findings.tsx',
  'mobile/app/(tabs)/alerts.tsx',
  'mobile/app/finding/[id].tsx',
  'mobile/src/lib/supabase.ts',
  'mobile/src/providers/auth-provider.tsx',
  'mobile/src/providers/workspace-provider.tsx',
  'mobile/src/providers/sync-provider.tsx',
  'mobile/src/services/findings.ts',
  'mobile/src/services/api.ts',
  'mobile/src/services/upload.ts',
  'mobile/src/services/notifications.ts',
  'mobile/src/services/media.ts',
  'mobile/src/services/offline-queue.ts',
  'mobile/src/services/network.ts',
  'mobile/src/services/sync.ts',
  'mobile/src/services/capture-pipeline.ts',
  'mobile/src/services/pending-reviews.ts',
  'mobile/src/services/ai-status.ts',
  'mobile/src/services/demo.ts',
  'mobile/src/components/AiStatusPill.tsx',
];

for (const file of requiredFiles) await access(file);

const pkg = JSON.parse(await readFile('mobile/package.json', 'utf8'));
assert.match(pkg.dependencies.expo, /^~57\./, 'mobile must use Expo SDK 57');
for (const dependency of ['expo-camera','expo-audio','expo-notifications','expo-sqlite','expo-network','expo-image-manipulator','expo-file-system','@supabase/supabase-js']) {
  assert.ok(pkg.dependencies[dependency], `${dependency} is required`);
}

const appConfig = JSON.parse(await readFile('mobile/app.json', 'utf8'));
assert.equal(appConfig.expo.scheme, 'hsecopilot');
assert.ok(appConfig.expo.plugins.some((entry) => entry === 'expo-router'), 'Expo Router plugin required');

const supabaseSource = await readFile('mobile/src/lib/supabase.ts', 'utf8');
assert.doesNotMatch(supabaseSource, /SERVICE_ROLE/i, 'mobile must never contain a service role key');

const apiSource = await readFile('mobile/src/services/api.ts', 'utf8');
assert.doesNotMatch(apiSource, /GROQ_API_KEY|OPENAI_API_KEY|SERVICE_ROLE/i, 'mobile must never contain provider or server secrets');

const reviewSource = await readFile('mobile/app/review-draft.tsx', 'utf8');
assert.match(reviewSource, /vencimientos legales\/normativos no los decide la IA/i, 'mobile review must preserve normative safety language');

console.log(`Mobile premium pilot structure OK (${requiredFiles.length} required files)`);
