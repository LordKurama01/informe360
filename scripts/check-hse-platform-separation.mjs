import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const mobile = await readFile('mobile/app/_layout.tsx', 'utf8');
const web = await readFile('src/blocks/hse-control/HseControl.tsx', 'utf8');
const webCss = await readFile('src/blocks/hse-control/HseControl.module.css', 'utf8');
const nextPage = await readFile('src/app/app/hse/page.tsx', 'utf8');
const webHome = await readFile('src/app/page.tsx', 'utf8');

assert.match(mobile, /Platform\.OS === 'web' && width >= 760/, 'only browser desktop width redirects away from Expo');
assert.match(mobile, /EXPO_PUBLIC_WEB_APP_URL/, 'desktop Expo preview must have configurable Next.js destination');
assert.match(mobile, /window\.location\.replace\(WEB_HSE_URL\)/, 'desktop must open dedicated web application');
assert.match(mobile, /<AuthProvider><WorkspaceProvider><SyncProvider>/, 'native app providers must remain intact');
assert.match(web, /className=\{styles\.sideNav\}/, 'web command center must preserve desktop sidebar');
assert.match(web, /getHseWorkspace/, 'web must share Supabase organization context');
assert.match(webCss, /\.appShell\{[^}]*grid-template-columns:/, 'web command center should have desktop column layout');
assert.match(webCss, /The browser UI stays a responsive website/, 'browser must have responsive web navigation');
assert.match(webCss, /\.mobileDockPrimary \{ display:none !important; \}/, 'web mobile must hide the Expo-style floating capture action');
assert.match(nextPage, /HseControl/, 'real Next.js web route must point at HSE command center');
assert.match(webHome, /HSE_WEB_QA_MODE === '1'/, 'dedicated QA web instance should open HSE command center');
assert.match(webHome, /redirect\('\/app\/hse'\)/, 'redirect web QA homepage to its own HSE route');

console.log('Informe360 WEB Next.js and APP React Native separation contracts OK');
