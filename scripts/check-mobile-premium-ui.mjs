import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';

const requiredFiles = [
  'mobile/src/components/FieldHeader.tsx',
  'mobile/src/components/SectionHeader.tsx',
  'mobile/src/components/MetricTile.tsx',
  'mobile/src/screens/InspectionsScreen.tsx',
  'mobile/app/(tabs)/capture.tsx',
  'mobile/app/(tabs)/inspections.tsx',
  'mobile/src/lib/secure-storage.web.ts',
];

for (const file of requiredFiles) await access(file);

const theme = await readFile('mobile/src/theme.ts', 'utf8');
assert.match(theme, /surfaceMuted/, 'premium mobile theme must expose a muted surface token');
assert.match(theme, /spacing\s*:/, 'premium mobile theme must expose spacing tokens');
assert.match(theme, /shadow\s*:/, 'premium mobile theme must expose shadow tokens');

const tabs = await readFile('mobile/app/(tabs)/_layout.tsx', 'utf8');
for (const route of ['index', 'findings', 'capture', 'inspections', 'alerts']) {
  assert.match(tabs, new RegExp(`name=["']${route}["']`), `bottom navigation must expose ${route}`);
}
assert.match(tabs, /tabBarButton/, 'capture must have a distinct central tab treatment');

const capture = await readFile('mobile/app/(tabs)/capture.tsx', 'utf8');
for (const mode of ['audio', 'photo', 'text']) {
  assert.match(capture, new RegExp(`mode=${mode}`), `capture hub must route to ${mode}`);
}

const tabInspections = await readFile('mobile/app/(tabs)/inspections.tsx', 'utf8');
const legacyInspections = await readFile('mobile/app/inspections/index.tsx', 'utf8');
assert.match(tabInspections, /InspectionsScreen/, 'tab inspections must use the shared inspections screen');
assert.match(legacyInspections, /InspectionsScreen/, 'legacy inspections route must use the shared inspections screen');

const home = await readFile('mobile/app/(tabs)/index.tsx', 'utf8');
for (const marker of ['pendingCount', 'reviewCount', 'criticalOpen']) {
  assert.match(home, new RegExp(marker), `home must preserve ${marker} operational state`);
}
assert.match(home, /\(tabs\)\/capture|\/register\?mode=audio/, 'home must keep a direct primary capture path');

const findingDetail = await readFile('mobile/app/finding/[id].tsx', 'utf8');
for (const marker of ['initial', 'supporting', 'closure', 'reopenFinding', 'closeFinding']) {
  assert.match(findingDetail, new RegExp(marker), `finding detail must preserve ${marker}`);
}

const webStorage = await readFile('mobile/src/lib/secure-storage.web.ts', 'utf8');
assert.match(webStorage, /localStorage/, 'web auth storage must use a browser-safe storage backend');

const authProvider = await readFile('mobile/src/providers/auth-provider.tsx', 'utf8');
assert.match(authProvider, /finally\s*\(\s*\(\)\s*=>\s*setLoading\(false\)\s*\)/, 'auth bootstrap must always leave loading state');

console.log('Mobile-first premium UI contract OK');
