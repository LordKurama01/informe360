import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const sql = await readFile('database/supabase/migrations/20261008042500_harden_dynamic_form_rls_integrity.sql', 'utf8');
for (const marker of ['form_template_versions.organization_id','form_runs.organization_id','form_answers.organization_id','form_run_findings.organization_id']) assert.ok(sql.includes(marker), 'missing qualified tenant relation: ' + marker);
assert.ok(!sql.includes('r.organization_id = r.organization_id'), 'answer relation must not be tautological');
assert.ok(!sql.includes('t.organization_id = t.organization_id'), 'template relation must not be tautological');
console.log('HSE form RLS tenant-integrity contract OK');
