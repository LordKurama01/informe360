import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { evaluateRequiredFields } from '../src/shared/hse/forms/validation.mjs';

test('published real templates use the existing native create_form_run RPC', async () => {
  const service = await readFile('src/services/hse/forms-browser.ts','utf8');
  assert.match(service, /export async function startHseInspection/);
  assert.match(service, /template\.organization_id !== workspace\.organizationId/);
  assert.match(service, /template\.status !== 'active'/);
  assert.match(service, /\.rpc\('create_form_run'/);
  assert.match(service, /p_client_run_id: clientId/, 'idempotent client UUID must be retained');
  assert.match(service, /eq\('organization_id', workspace\.organizationId\)/);
  assert.match(service, /workspace\.siteId && run\.site_id !== workspace\.siteId/, 'wrong site must not open');
  assert.match(service, /template\.category !== 'inspection'/, 'only inspection rows use this editor');
});

test('draft writes are constrained and submitted forms cannot be edited from UI', async () => {
  const service = await readFile('src/services/hse/forms-browser.ts','utf8');
  const panel = await readFile('src/blocks/hse-control/HseInspectionRunPanel.tsx','utf8');
  assert.match(service, /\['draft', 'in_progress'\]\.includes\(bundle\.run\.status\)/);
  assert.match(service, /new Set\(bundle\.version\.schema_json\.sections\.flatMap/);
  assert.match(service, /\.upsert\(rows, \{ onConflict: 'form_run_id,field_id' \}\)/);
  assert.match(service, /\.eq\('id', bundle\.run\.id\)\.eq\('organization_id', workspace\.organizationId\)/);
  assert.match(service, /\.in\('status', \['draft', 'in_progress'\]\)/);
  assert.match(panel, /readOnlyRun\(bundle\.run\.status\)/);
  assert.match(panel, /Guardar borrador/);
  assert.match(panel, /Presentar inspección/);
  assert.match(panel, /evaluateRequiredFields\(bundle\.version\.schema_json, answers\)/);
  assert.match(panel, /bloques repetibles/i, 'unsupported repeaters must not submit fake data');
});

test('required compliance fields retain safety semantics from the native app', () => {
  const schema = { version: 1, title: 'Altura', sections: [{ id: 'one', title: 'Equipos', fields: [
    { id: 'arnes', label: 'Arnés', type: 'compliance', required: true },
    { id: 'observacion', label: 'Observaciones', type: 'text', required: false },
  ] }] };
  assert.deepEqual(evaluateRequiredFields(schema, {}), ['arnes']);
  assert.deepEqual(evaluateRequiredFields(schema, { arnes: 'non_compliant' }), []);
  assert.deepEqual(evaluateRequiredFields(schema, { arnes: 'complies' }), []);
  assert.deepEqual(evaluateRequiredFields(schema, { arnes: 'na' }), []);
  assert.deepEqual(evaluateRequiredFields(schema, { arnes: 'not_valid' }), ['arnes']);
});

test('private photos use organization/run path and signed URLs, never a public bucket', async () => {
  const svc = await readFile('src/services/hse/forms-browser.ts','utf8');
  assert.match(svc, /'hse-evidence'/);
  assert.match(svc, /organizationId\}\/form-runs\/\$\{runId\}/);
  assert.match(svc, /contentType: file\.type/);
  assert.match(svc, /createSignedUrl\(value\.slice\('hse-evidence:'\.length\), 900\)/);
  assert.doesNotMatch(svc, /getPublicUrl\(/);
});

test('inspections and the editor keep the same Next.js HSE navigation', async () => {
  const route = await readFile('src/app/app/hse/inspections/[runId]/page.tsx','utf8');
  const control = await readFile('src/blocks/hse-control/HseControl.tsx','utf8');
  assert.match(route, /mode="inspection-run"/);
  assert.match(control, /<HseInspectionRunPanel workspace=\{workspace\} runId=\{inspectionRunId\}/);
  assert.match(control, /startHseInspection\(workspace, template\)/);
  assert.match(control, /router\.push\('\/app\/hse\/inspections\/' \+ id\)/);
  assert.match(control, /href=\{\`\/app\/hse\/inspections\/\$\{run\.id\}\`\}/);
  assert.doesNotMatch(route, /minHeight:'100vh'|background:'#f4f7f6'/);
});
