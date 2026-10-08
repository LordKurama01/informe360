import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const login = await readFile('mobile/app/login.tsx', 'utf8');

for (const marker of [
  'KeyboardAvoidingView', 'SafeAreaView', 'ScrollView', 'accessibilityLabel',
  'styles.hero', 'styles.brandImage', 'styles.loginPanel', 'styles.passwordAction',
  'styles.feedback', "router.replace('/')", "submit('up')", "submit('in')",
]) assert.ok(login.includes(marker), 'login must preserve ' + marker);

assert.ok(!login.includes('brandMarkText}>360'), 'generic 360 tile must not return');
assert.ok(!/justifyContent:\s*'center',\s*paddingBottom:\s*theme\.spacing\.xxl/.test(login), 'login must not vertically center the entire screen');
assert.match(login, /require\('\.\.\/assets\/brand\/app-icon\.png'\)/, 'use existing app identity asset');
assert.match(login, /height: 5[024]/, 'inputs and action buttons must remain touch friendly');
assert.match(login, /setFeedback\(message\)/, 'authentication errors must render inline');
assert.match(login, /setBusy\(false\)/, 'busy state must always be cleared');
console.log('HSE mobile login layout and auth contracts OK');
