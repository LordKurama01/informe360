import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read=path=>readFile(path,'utf8');

test('Formularios uses the same HSE authentication, tenant and sidebar',async()=>{
  const [route,control,panel,service]=await Promise.all([
    read('src/app/app/hse/forms/page.tsx'),read('src/blocks/hse-control/HseControl.tsx'),
    read('src/blocks/hse-control/HseFormsPanel.tsx'),read('src/services/hse/forms-browser.ts'),
  ]);
  assert.match(route, /HseControl mode="forms"/);
  assert.match(control, /mode === 'forms' \? <HseFormsPanel workspace=\{workspace\}/);
  assert.match(control, /setInspectionTemplates\(await listFormTemplates\(nextWorkspace\)\)/);
  assert.match(control, /href="\/app\/hse\/forms"/);
  assert.match(panel, /\['owner','admin'\]\.includes\(workspace\.role\)/);
  assert.match(panel, /createFormTemplate\(workspace/);
  assert.match(panel, /publishFormVersion\(created\.versionId\)/);
  assert.match(service, /validateFormSchema\(input\.schema\)/);
  assert.doesNotMatch(route,/getHseWorkspace|minHeight:'100vh'|background:'#f4f7f6'/);
});

test('Agenda is a real HSE module rather than the platform generic calendar',async()=>{
  const [route,control,agenda,service]=await Promise.all([
    read('src/app/app/hse/agenda/page.tsx'),read('src/blocks/hse-control/HseControl.tsx'),
    read('src/blocks/hse-control/HseAgendaPanel.tsx'),read('src/services/hse/browser.ts'),
  ]);
  assert.match(route, /HseControl mode="agenda"/);
  assert.match(control, /href="\/app\/hse\/agenda"/);
  assert.doesNotMatch(control, /href="\/app\/calendar"/);
  assert.match(control, /getHseFindings\(nextWorkspace\),getHseReminders\(nextWorkspace\)/);
  assert.match(agenda, /createHseReminder\(workspace/);
  assert.match(agenda, /updateHseReminderStatus\(workspace,id,status\)/);
  assert.match(service, /\.eq\('organization_id', workspace\.organizationId\)\.eq\('status', 'pending'\)/);
  assert.match(agenda, /No hay recordatorios pendientes/);
  assert.doesNotMatch(agenda,/\bDemo\b/);
});

test('Report document has tenant/site guard and links back to Reports',async()=>{
  const doc=await read('src/app/app/hse/reports/[id]/page.tsx');
  assert.match(doc,/getHseWorkspace\(\)/);
  assert.match(doc,/result\.report\.organization_id!==workspace\.organizationId/);
  assert.match(doc,/result\.report\.site_id!==workspace\.siteId/);
  assert.match(doc,/href="\/app\/hse\/reports"/);
  assert.match(doc,/window\.print\(\)/);
});

test('HSE web route and app native shell remain separate',async()=>{
  const [control,css,app]=await Promise.all([
    read('src/blocks/hse-control/HseControl.tsx'),
    read('src/blocks/hse-control/HseControl.module.css'),
    read('mobile/app/_layout.tsx'),
  ]);
  for(const mode of ['forms','agenda','inspections','reports'])assert.match(control,new RegExp("mode === '"+mode+"'"));
  assert.match(css,/\.formsEditorGrid\{/);
  assert.match(css,/\.agendaColumns\{/);
  assert.match(app,/Platform\.OS === 'web' && width >= 760/);
  assert.doesNotMatch(control,/seedHseDemo|>Demo</);
});
