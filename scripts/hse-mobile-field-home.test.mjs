import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const home = await readFile('mobile/app/(tabs)/index.tsx', 'utf8');
const tabs = await readFile('mobile/app/(tabs)/_layout.tsx', 'utf8');

test('mobile home is a compact field dashboard without a demo action', () => {
  assert.match(home, /Registrar por voz/);
  assert.match(home, /Inspeccionar/);
  assert.match(home, /Fotografía/);
  assert.match(home, /Escribir/);
  assert.match(home, /Estado del sitio/);
  assert.doesNotMatch(home, /seedDemoWorkspace|loadDemo|Cargar demo comercial|demoBusy/i);
  assert.doesNotMatch(home, /MetricTile|styles\.captureHero|styles\.quickActions/, 'oversized old mobile screen must not reappear');
  assert.match(home, /voiceAction:\{minHeight:104/, 'primary action should be an app-sized native card');
  assert.match(home, /quickAction:\{flex:1,minHeight:86/, 'quick actions must be thumb-friendly and compact');
});

test('mobile dashboard metrics distinguish missing data from zero', () => {
  assert.match(home, /dataState === 'ready' \? String\(value\) : '—'/);
  assert.match(home, /summary\.closed > 0 \?/, 'percentage cannot be derived without closures');
  assert.match(home, /Sin cierres registrados/);
  assert.doesNotMatch(home, /meta=\{\`\$\{summary\.closureCompliancePct\}%/, 'never claim 0% when no closure exists');
  assert.match(home, /setDataState\('error'\)/);
  assert.match(home, /setDataState\('ready'\)/);
});

test('home preserves real operation, offline queue, review and finding routes', () => {
  for (const marker of ['pendingCount', 'refreshPending', 'reviewCount', 'criticalOpen',
    'getDashboardSummary', 'listFindings', 'listPendingReviews', 'manualSync']) {
    assert.ok(home.includes(marker), marker);
  }
  for (const route of ['/(tabs)/findings', '/(tabs)/inspections', '/register?mode=audio',
    '/register?mode=photo', '/register?mode=text']) assert.ok(home.includes(route), route);
  assert.match(home, /onRefresh=\{\(\) => void load\(true\)\}/, 'refresh must stay manual');
  assert.match(home, /if \(manual\) setRefreshing\(true\)/, 'initial read must not flash pull-to-refresh');
});

test('navigation stays native-sized, with accessible bottom capture action', () => {
  for (const name of ['index','findings','capture','inspections','alerts']) {
    assert.ok(tabs.includes(`name="${name}"`));
  }
  assert.match(tabs, /height: 69/, 'compact bottom navigation');
  assert.match(tabs, /width: 44, height: 44/, 'compact capture control');
  assert.doesNotMatch(tabs, /marginTop: -19|width: 58, height: 58/, 'old floating oversized capture action');
  assert.match(tabs, /tabBarHideOnKeyboard: true/);
});
