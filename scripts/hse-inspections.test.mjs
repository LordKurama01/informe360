import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { selectHseInspections, filterInspectionRuns, inspectionStatusLabel } from '../src/shared/hse/inspection-view.ts';

test('only inspection templates and matching org-site executions enter the view', () => {
  const templates = [
    { id: 'checklist', name: 'Trabajo en altura', category: 'inspection', status: 'active', description: null },
    { id: 'permit', name: 'Permiso de trabajo', category: 'permit', status: 'active', description: null },
    { id: 'inspect-draft', name: 'Inspección de extintores', category: 'inspection', status: 'draft', description: null },
  ];
  const runs = [
    { id: 'a', template_id: 'checklist', site_id: 'site-A', status: 'submitted', started_at: '2026-10-08T10:00:00Z' },
    { id: 'b', template_id: 'checklist', site_id: 'site-B', status: 'draft', started_at: '2026-10-08T10:00:00Z' },
    { id: 'c', template_id: 'permit', site_id: 'site-A', status: 'submitted', started_at: '2026-10-08T10:00:00Z' },
  ];
  const view = selectHseInspections(templates, runs, 'site-A');
  assert.deepEqual(view.templates.map(x => x.id), ['checklist', 'inspect-draft']);
  assert.deepEqual(view.runs.map(x => x.id), ['a']);
  assert.equal(view.names.get('checklist'), 'Trabajo en altura');
  assert.equal(selectHseInspections(templates, runs, null).runs.length, 2);
  assert.equal(runs.length, 3, 'the source must not be mutated');
});

test('inspection status labels remain readable and unknown states are never invented', () => {
  assert.equal(inspectionStatusLabel('submitted'), 'Enviada');
  assert.equal(inspectionStatusLabel('draft'), 'Borrador');
  assert.equal(inspectionStatusLabel('in_progress'), 'En curso');
  assert.equal(inspectionStatusLabel('new_unknown_status'), 'Estado no identificado');
});

test('Inspecciones route uses the exact HSE shell, authentic data and navigation', async () => {
  const route = await readFile('src/app/app/hse/inspections/page.tsx', 'utf8');
  const control = await readFile('src/blocks/hse-control/HseControl.tsx', 'utf8');
  const service = await readFile('src/services/hse/forms-browser.ts', 'utf8');
  const css = await readFile('src/blocks/hse-control/HseControl.module.css', 'utf8');

  assert.match(route, /<HseControl mode="inspections"/, 'the route must not render a separate app');
  assert.match(control, /mode === 'inspections' \? <>/, 'inspection view must reuse authenticated workspace shell');
  assert.match(control, /mode === 'inspections' \|\| mode === 'inspection-run' \? styles\.navItemActive/, 'both inspection history and details must share the active sidebar section');
  assert.match(control, /listFormTemplates\(nextWorkspace\)/);
  assert.match(control, /listFormRuns\(nextWorkspace\)/);
  assert.match(control, /dataStatus === 'ready' \? <div className=\{styles\.inspectionCards\}>/, 'empty state must not appear on failed load');
  assert.match(control, /role="alert"/, 'service failures must appear visibly');
  assert.match(control, /href="\/app\/hse\/forms"/, 'existing form builder should remain reachable');
  assert.match(service, /seed_hse_inspection_templates/, 'preserve opt-in standards action');
  assert.match(control, /onClick=\{\(\) => void installStandards\(\)\}/, 'template import cannot be automatic');
  assert.match(css, /\.inspectionCards\{/, 'inspection cards use the common HSE CSS');
  assert.doesNotMatch(route, /minHeight:'100vh'|background:'#f4f7f6'/, 'no competing inline app shell');
});

test('inspection search and status tabs preserve original rows and avoid extra queries', () => {
  const names = new Map([['alt', 'Trabajo en altura'], ['fire', 'Matafuegos']]);
  const runs = [
    { id: 'p', template_id: 'alt', site_id: 'a', status: 'draft', started_at: '2026-10-08T10:00:00Z' },
    { id: 's', template_id: 'alt', site_id: 'a', status: 'submitted', started_at: '2026-10-08T11:00:00Z' },
    { id: 'f', template_id: 'fire', site_id: 'a', status: 'in_progress', started_at: '2026-10-08T12:00:00Z' },
  ];
  assert.deepEqual(filterInspectionRuns(runs, names, 'ALTURA', 'all').map(x => x.id), ['p', 's']);
  assert.deepEqual(filterInspectionRuns(runs, names, '', 'pending').map(x => x.id), ['p', 'f']);
  assert.deepEqual(filterInspectionRuns(runs, names, '', 'submitted').map(x => x.id), ['s']);
  assert.equal(filterInspectionRuns(runs, names, 'sin coincidencia', 'all').length, 0);
  assert.equal(runs.length, 3, 'filter must never modify in-memory inspection records');
});

test('filters stay inside Inspecciones without reloading login or other HSE pages', async () => {
  const control = await readFile('src/blocks/hse-control/HseControl.tsx','utf8');
  assert.match(control, /filterInspectionRuns\(inspectionData\.runs/, 'filter must run locally');
  assert.match(control, /aria-pressed=\{inspectionFilter === value\}/, 'active tab must be announced');
  assert.match(control, /aria-label="Buscar inspecciones"/, 'search must be accessible');
  assert.match(control, /No hay ejecuciones que coincidan con estos filtros/, 'empty filtered state must be explicit');
});
