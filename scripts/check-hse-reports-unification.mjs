import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const hse = await readFile('src/blocks/hse-control/HseControl.tsx','utf8');
const css = await readFile('src/blocks/hse-control/HseControl.module.css','utf8');
const service = await readFile('src/services/hse/browser.ts','utf8');
const hseRoute = await readFile('src/app/app/hse/reports/page.tsx','utf8');
const legacyRoute = await readFile('src/app/app/reports/page.tsx','utf8');

assert.doesNotMatch(hse, /\bseedHseDemo\b|\bDemo\b|\bdemo comercial\b/i, 'HSE must never advertise demo or seed example records');
assert.match(hse, /href="\/app\/hse\/reports"/, 'HSE navigation must use its dedicated reports route');
assert.match(hse, /mode === 'reports'/, 'Reports must reuse the HSE operating shell');
assert.match(hse, /className=\{styles\.sideNav\}/, 'Reports must preserve the same left navigation');
assert.match(hse, /listHseReports\(nextWorkspace\)/, 'Reports must use real tenant-scoped records');
assert.match(hse, /Todavía no hay informes generados/, 'Empty datasets must not show invented reports');
assert.match(hseRoute, /<HseControl mode="reports"/, 'Dedicated route must use the shared HSE layout');
assert.match(legacyRoute, /HSE_WEB_QA_MODE === '1'/, 'Legacy cross-product route must only redirect for dedicated HSE web');
assert.match(legacyRoute, /redirect\('\/app\/hse\/reports'\)/, 'Old reports link must land in HSE module');

assert.match(service, /from\('reports'\)/, 'HSE reports must be loaded from Supabase');
assert.match(service, /eq\('organization_id', workspace\.organizationId\)/, 'Reports must be constrained to the active organization');
assert.match(service, /if \(workspace\.siteId\) request = request\.eq\('site_id', workspace\.siteId\)/, 'Reports must respect the selected site');
assert.match(css, /\.reportRow\{/,'Report rows must use shared HSE styling');
console.log('HSE reports unified navigation and real-data contract OK');
