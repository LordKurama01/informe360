import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { selectHseInspections, inspectionStatusLabel } from '../src/shared/hse/inspection-view.ts';

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
  assert.match(control, /mode === 'inspections' \? styles\.navItemActive/, 'the active sidebar section must match the route');
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
