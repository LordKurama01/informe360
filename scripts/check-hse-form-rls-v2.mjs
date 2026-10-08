import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const a = await readFile('database/supabase/migrations/20261008043000_apply_dynamic_form_rls_integrity.sql', 'utf8');
const b = await readFile('database/supabase/migrations/20261008043100_harden_form_run_rls_integrity.sql', 'utf8');
const sql = a + '\n' + b;
for (const marker of ['form_template_versions.organization_id','form_runs.organization_id','form_answers.organization_id','form_run_findings.organization_id','r.organization_id = form_answers.organization_id','s.organization_id = form_runs.organization_id','f.organization_id = form_run_findings.organization_id']) assert.ok(sql.includes(marker), 'missing tenant guard: ' + marker);
assert.ok(!sql.includes('r.organization_id = r.organization_id'));
assert.ok(!sql.includes('t.organization_id = t.organization_id'));
console.log('HSE current form RLS tenant-integrity contract OK');
