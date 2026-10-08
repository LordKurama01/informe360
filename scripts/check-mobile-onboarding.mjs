import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const onboarding = await readFile('mobile/app/onboarding.tsx', 'utf8');
const workspace = await readFile('mobile/src/services/workspace.ts', 'utf8');

for (const marker of ['useEffect', 'refresh()', 'resolveWorkspace()', "router.replace('/(tabs)')", 'accessibilityLiveRegion', 'styles.feedback', 'Entrar al panel', 'Crear un espacio nuevo']) {
  assert.ok(onboarding.includes(marker), 'onboarding must support ' + marker);
}
assert.ok(!onboarding.includes('Alert.alert'), 'React Native Web must not silently lose onboarding errors');
assert.match(onboarding, /if \(workspace\) router\.replace\('\/\(tabs\)'\)/, 'already-assigned users skip onboarding');
assert.match(onboarding, /if \(!existing\) await createWorkspace\(company, site\)/, 'never duplicate an assigned organization');
assert.match(workspace, /organization_members/, 'workspace must resolve persisted organization membership');
console.log('HSE onboarding existing-workspace and web-feedback contract OK');
