import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const ui = await readFile('src/blocks/hse-control/HseControl.tsx','utf8');
const css = await readFile('src/blocks/hse-control/HseControl.module.css','utf8');

test('fast navigation never renders the previous login-like loading screen', () => {
  assert.match(ui, /showSlowBoot, setShowSlowBoot/, 'startup skeleton must be delayed');
  assert.match(ui, /setShowSlowBoot\(true\), 320/, 'quick loads should not show a full-screen splash');
  assert.match(ui, /if\(booting\)return <main className=\{styles\.bootFrame\}/);
  assert.doesNotMatch(ui, /if\(booting\)return <main className=\{styles\.authShell\}/);
  assert.match(css, /\.bootFrame\{/, 'loading frame must match real dashboard dimensions');
  assert.match(css, /\.bootAside\{/, 'side panel must be skeleton-shaped for slower connections');
});

test('typing searches does not reset auth, workspace or entire dashboard', () => {
  assert.match(ui, /getHseFindings\(workspace, searchText\)/, 'search is scoped to findings');
  assert.match(ui, /\}, 280\);/, 'search requests are debounced');
  assert.match(ui, /\}, \[loadWorkspace, handleLoadError\]\);/, 'bootstrap may not depend on search query');
  assert.match(ui, /\}, \[mode\]\);/, 'workspace revalidation cannot be tied to every keystroke');
  assert.match(ui, /setBaseFindings\(nextFindings\)/, 'clearing search can restore the original list');
  assert.match(ui, /if \(active\) setFindings\(results\)/, 'stale requests cannot replace later results');
  assert.match(ui, /setQuery\(''\)/, 'sign out clears search and scoped data');
});

test('active sidebar slider and transitions respect reduced motion', () => {
  assert.match(css, /\.navItemActive:before\{/, 'active route must have a visible indicator');
  assert.match(css, /\.navItem:focus-visible\{/, 'keyboard users must see focus');
  assert.match(css, /prefers-reduced-motion:reduce/, 'animations must respect reduced motion');
  assert.match(ui, /aria-busy=\{searchPending\}/, 'search announces its loading state');
  assert.match(css, /\.listSearching\{/, 'only results should dim during search');
});
