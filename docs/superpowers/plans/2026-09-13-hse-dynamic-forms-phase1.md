# HSE Dynamic Forms Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a versioned dynamic-form engine that powers future checklists, inspections, IPCR, PTW and incident forms without creating a custom screen per template.

**Architecture:** Supabase remains the single source of truth. Published form-template versions are immutable JSON schemas; executions reference a specific version. Mobile Expo renders and stores field responses, while Next.js desktop manages templates and reviews runs. The first consumer will be inspection/checklist flows.

**Tech Stack:** PostgreSQL/Supabase/RLS, Next.js 16, React 19, Expo SDK 57, React Native 0.86, TypeScript, React Hook Form `7.88.0`, existing Supabase clients and SQLite offline layer.

**Spec:** `docs/HSE_COPILOT_PLAN_MAESTRO_V2_2026-09-13.md`

## Global Constraints

- Keep `main` untouched until PR review.
- Continue from `feat/hse-copilot-mobile-p0` or a child feature branch.
- Supabase project: `wvjmsltqrztlvgmayicr`.
- One backend only; no secondary database or auth system.
- Every tenant-owned table must enforce RLS by `organization_id`/membership.
- Published template versions are immutable.
- Historical form runs must never change when a template is edited.
- Dynamic forms must work without AI.
- AI may suggest values but never approve, sign or create normative obligations.
- Mobile offline writes must be idempotent.
- A failed/non-conforming checklist answer may create a `finding`, but only by explicit user action.
- Use TDD and small commits.

---

## File Map

### Database

- Create: `database/supabase/migrations/<timestamp>_dynamic_forms_phase1.sql`

### Shared domain

- Create: `src/shared/hse/forms/types.ts`
- Create: `src/shared/hse/forms/validation.mjs`
- Create: `src/shared/hse/forms/validation.d.mts`
- Create: `src/shared/hse/forms/validation.test.mjs`

### Web/Desktop

- Modify: `package.json`
- Create: `src/services/hse/forms-browser.ts`
- Create: `src/blocks/hse-forms/FormTemplateList.tsx`
- Create: `src/blocks/hse-forms/FormTemplateEditor.tsx`
- Create: `src/blocks/hse-forms/FormRunReview.tsx`
- Create: `src/app/app/hse/forms/page.tsx`
- Create: `src/app/app/hse/forms/[templateId]/page.tsx`
- Create: `src/app/app/hse/form-runs/[runId]/page.tsx`

### Mobile

- Modify: `mobile/package.json`
- Create: `mobile/src/types/forms.ts`
- Create: `mobile/src/services/forms.ts`
- Create: `mobile/src/services/form-offline.ts`
- Create: `mobile/src/components/forms/DynamicForm.tsx`
- Create: `mobile/src/components/forms/FormField.tsx`
- Create: `mobile/src/components/forms/RiskMatrixField.tsx`
- Create: `mobile/app/forms/index.tsx`
- Create: `mobile/app/forms/[templateId].tsx`
- Create: `mobile/app/form-run/[runId].tsx`
- Modify: `mobile/app/(tabs)/index.tsx`

### QA

- Modify: `scripts/check-mobile-p0.mjs`
- Create: `scripts/check-dynamic-forms.mjs`
- Modify: `package.json`

---

### Task 1: Define the shared form contract

**Files:**
- Create: `src/shared/hse/forms/types.ts`
- Create: `src/shared/hse/forms/validation.mjs`
- Create: `src/shared/hse/forms/validation.d.mts`
- Test: `src/shared/hse/forms/validation.test.mjs`

**Interfaces:**
- Produces TypeScript types `HseFormSchema`, `HseFormSection`, `HseFormField`.
- Produces runtime functions `validateFormSchema(schema)` and `evaluateRequiredFields(schema, answers)`.

- [ ] **Step 1: Write the failing runtime test**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { validateFormSchema } from './validation.mjs';

test('published checklist schema accepts supported field types', () => {
  const result = validateFormSchema({
    version: 1,
    title: 'Trabajo en altura',
    sections: [{
      id: 'arnes',
      title: 'Arnés',
      fields: [{ id: 'costuras', type: 'compliance', label: 'Costuras íntegras', required: true }]
    }]
  });
  assert.equal(result.ok, true);
});
```

- [ ] **Step 2: Run the test and confirm RED**

Run: `node --test src/shared/hse/forms/validation.test.mjs`

Expected: FAIL because `validation.mjs` does not exist.

- [ ] **Step 3: Add exact TypeScript field union in `types.ts`**

```ts
export type HseFormField =
  | { id: string; type: 'text'; label: string; required?: boolean; multiline?: boolean }
  | { id: string; type: 'number'; label: string; required?: boolean; min?: number; max?: number }
  | { id: string; type: 'date'; label: string; required?: boolean }
  | { id: string; type: 'yes_no'; label: string; required?: boolean }
  | { id: string; type: 'compliance'; label: string; required?: boolean; createFindingOnFail?: boolean }
  | { id: string; type: 'select'; label: string; required?: boolean; options: { value: string; label: string }[] }
  | { id: string; type: 'photo'; label: string; required?: boolean }
  | { id: string; type: 'risk_matrix'; label: string; required?: boolean }
  | { id: string; type: 'repeater'; label: string; required?: boolean; fields: Exclude<HseFormField, { type: 'repeater' }>[] };

export type HseFormSection = {
  id: string;
  title: string;
  description?: string;
  fields: HseFormField[];
};

export type HseFormSchema = {
  version: 1;
  title: string;
  description?: string;
  sections: HseFormSection[];
};
```

`compliance` answer values are fixed to `complies | non_compliant | na`.

- [ ] **Step 4: Implement runtime validator in `validation.mjs`**

Reject:
- duplicate section IDs;
- duplicate field IDs;
- missing labels;
- unsupported types;
- select fields with zero options;
- nested repeaters;
- empty sections.

- [ ] **Step 5: Add `validation.d.mts` matching runtime signatures**

```ts
import type { HseFormSchema } from './types';

export function validateFormSchema(schema: unknown): { ok: true; value: HseFormSchema } | { ok: false; errors: string[] };
export function evaluateRequiredFields(schema: HseFormSchema, answers: Record<string, unknown>): string[];
```

- [ ] **Step 6: Run tests GREEN**

Run: `node --test src/shared/hse/forms/validation.test.mjs`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/shared/hse/forms
git commit -m "feat: define HSE dynamic form contract"
```

---

### Task 2: Add versioned form tables, links and RLS

**Files:**
- Create: `database/supabase/migrations/<timestamp>_dynamic_forms_phase1.sql`

**Consumes:** `HseFormSchema` JSON structure from Task 1.

**Produces:** tables and RPCs for templates, versions, runs and finding linkage.

- [ ] **Step 1: Define the exact tables in the migration**

Required tables:

```text
form_templates
form_template_versions
form_runs
form_answers
form_run_findings
```

- [ ] **Step 2: Implement core schema**

```sql
form_templates(
  id uuid pk,
  organization_id uuid not null,
  name text not null,
  category text not null,
  status text not null check (status in ('draft','active','archived')),
  created_by uuid not null,
  created_at timestamptz not null,
  updated_at timestamptz not null
)
```

```sql
form_template_versions(
  id uuid pk,
  organization_id uuid not null,
  template_id uuid not null,
  version integer not null,
  schema_json jsonb not null,
  status text not null check (status in ('draft','published','retired')),
  published_at timestamptz,
  created_by uuid not null,
  created_at timestamptz not null,
  unique(template_id, version)
)
```

```sql
form_runs(
  id uuid pk,
  organization_id uuid not null,
  site_id uuid,
  template_id uuid not null,
  template_version_id uuid not null,
  status text not null check (status in ('draft','in_progress','submitted','reviewed','cancelled')),
  client_run_id uuid,
  started_by uuid not null,
  started_at timestamptz not null,
  submitted_at timestamptz,
  reviewed_at timestamptz,
  unique(organization_id, client_run_id)
)
```

```sql
form_answers(
  id uuid pk,
  organization_id uuid not null,
  form_run_id uuid not null,
  field_id text not null,
  value_json jsonb,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  unique(form_run_id, field_id)
)
```

```sql
form_run_findings(
  organization_id uuid not null,
  form_run_id uuid not null,
  field_id text not null,
  finding_id uuid not null,
  created_at timestamptz not null,
  primary key(form_run_id, field_id, finding_id)
)
```

- [ ] **Step 3: Add immutability guard**

Create a trigger that rejects changes to `schema_json`, `template_id` or `version` when the existing row has `status = 'published'`.

- [ ] **Step 4: Add RLS**

Authenticated users may access only records whose `organization_id` belongs to one of their memberships. Anonymous access is denied. `form_run_findings` follows the same organization boundary.

- [ ] **Step 5: Add idempotent run RPC**

Create:

```sql
create_form_run(
  p_template_version_id uuid,
  p_site_id uuid,
  p_client_run_id uuid
) returns uuid
```

It must return the existing run ID when the same `client_run_id` is retried in the same organization.

- [ ] **Step 6: Add explicit form-run → finding link RPC**

Create:

```sql
link_form_answer_to_finding(
  p_form_run_id uuid,
  p_field_id text,
  p_finding_id uuid
) returns void
```

The function must validate that run and finding belong to the caller's organization before inserting the link.

- [ ] **Step 7: Apply migration and verify RLS**

```sql
select relname, relrowsecurity
from pg_class
where relname in (
  'form_templates',
  'form_template_versions',
  'form_runs',
  'form_answers',
  'form_run_findings'
);
```

Expected: five rows with `relrowsecurity = true`.

- [ ] **Step 8: Commit exact migration filename matching Supabase history**

---

### Task 3: Add shared desktop services and dependency

**Files:**
- Modify: `package.json`
- Create: `src/services/hse/forms-browser.ts`

**Produces:**

```ts
listFormTemplates(workspace)
getFormTemplate(templateId)
createFormTemplate(input)
createDraftVersion(templateId, schema)
publishFormVersion(versionId)
listFormRuns(workspace, filters)
getFormRun(runId)
```

- [ ] **Step 1: Add `react-hook-form` `7.88.0` to root dependencies**
- [ ] **Step 2: Implement all reads via existing browser Supabase client**
- [ ] **Step 3: Implement mutations with explicit organization scoping**
- [ ] **Step 4: Reject publish when `validateFormSchema()` returns `ok: false`**
- [ ] **Step 5: Run root typecheck**

Run: `npm run typecheck`

Expected: PASS.

- [ ] **Step 6: Commit**

---

### Task 4: Build desktop template manager

**Files:**
- Create: `src/blocks/hse-forms/FormTemplateList.tsx`
- Create: `src/blocks/hse-forms/FormTemplateEditor.tsx`
- Create: `src/app/app/hse/forms/page.tsx`
- Create: `src/app/app/hse/forms/[templateId]/page.tsx`

**Produces:** administrator UI for templates and versions.

- [ ] **Step 1: Create list page**

Show name, category, current published version and status.

- [ ] **Step 2: Create editor using React Hook Form**

Editor supports adding/reordering sections and fields from the Phase 1 union.

- [ ] **Step 3: Add preview mode**

Preview uses the same `HseFormSchema` contract without saving responses.

- [ ] **Step 4: Add publish confirmation**

The confirmation text must state: “Una versión publicada queda inmutable. Los cambios posteriores crearán una nueva versión.”

- [ ] **Step 5: Add navigation from `/app/hse`**

- [ ] **Step 6: Run lint + build**

```bash
npm run lint
npm run build
```

Expected: PASS.

- [ ] **Step 7: Commit**

---

### Task 5: Add mobile dependency and domain types

**Files:**
- Modify: `mobile/package.json`
- Create: `mobile/src/types/forms.ts`

- [ ] **Step 1: Add `react-hook-form` `7.88.0`**
- [ ] **Step 2: Mirror the shared form contract in mobile**

Do not invent alternate field names. Match `HseFormSchema` exactly.

- [ ] **Step 3: Run install/typecheck**

```bash
cd mobile
npm install
npm run typecheck
```

Expected: PASS.

- [ ] **Step 4: Commit**

---

### Task 6: Build mobile dynamic renderer

**Files:**
- Create: `mobile/src/components/forms/DynamicForm.tsx`
- Create: `mobile/src/components/forms/FormField.tsx`
- Create: `mobile/src/components/forms/RiskMatrixField.tsx`

**Consumes:** `HseFormSchema`.

**Produces:**

```ts
<DynamicForm
  schema={schema}
  initialAnswers={answers}
  onChange={setAnswers}
  onSubmit={submit}
/>
```

- [ ] **Step 1: Render text, number, date, yes/no, compliance and select**
- [ ] **Step 2: Render photo field using existing image/evidence helpers**
- [ ] **Step 3: Render risk matrix result as calculated UI, not free text**
- [ ] **Step 4: Render one-level repeater for IPCR-style steps**
- [ ] **Step 5: Enforce required fields before submit**
- [ ] **Step 6: Run mobile typecheck**

```bash
cd mobile && npm run typecheck
```

Expected: PASS.

- [ ] **Step 7: Commit**

---

### Task 7: Add run lifecycle and persistence

**Files:**
- Create: `mobile/src/services/forms.ts`
- Create: `mobile/app/forms/index.tsx`
- Create: `mobile/app/forms/[templateId].tsx`
- Create: `mobile/app/form-run/[runId].tsx`

**Produces:** list/start/save/resume/submit form runs.

- [ ] **Step 1: List active templates for current organization**
- [ ] **Step 2: Start run through `create_form_run` with a generated stable `client_run_id`**
- [ ] **Step 3: Upsert answers by `(form_run_id, field_id)`**
- [ ] **Step 4: Resume draft/in-progress run**
- [ ] **Step 5: Submit only after local required-field validation**
- [ ] **Step 6: Add Home entry `Inspeccionar`**
- [ ] **Step 7: Run mobile typecheck**
- [ ] **Step 8: Commit**

---

### Task 8: Add offline form outbox

**Files:**
- Create: `mobile/src/services/form-offline.ts`
- Modify: `mobile/src/providers/sync-provider.tsx`
- Modify: `mobile/src/services/sync.ts`

**Produces:** local run/answer persistence and retry.

- [ ] **Step 1: Create SQLite tables**

```text
pending_form_runs
pending_form_answers
```

Each queued run stores stable `client_run_id`.

- [ ] **Step 2: Save answers locally before remote upload**
- [ ] **Step 3: Sync run idempotently, then answers**
- [ ] **Step 4: Mark local rows synced only after server confirmation**
- [ ] **Step 5: Do not auto-submit on reconnect**

User must still confirm/submit a completed form.

- [ ] **Step 6: Test airplane-mode scenario manually**

Expected: close app → reopen → answers remain → reconnect → no duplicates.

- [ ] **Step 7: Commit**

---

### Task 9: Connect non-compliance to findings

**Files:**
- Modify: `mobile/app/form-run/[runId].tsx`
- Modify: `mobile/src/services/forms.ts`

**Consumes:** `form_run_findings` and `link_form_answer_to_finding()` from Task 2.

**Produces:** explicit `Crear hallazgo` action from a failed checklist item.

- [ ] **Step 1: Detect `compliance = non_compliant` answers where `createFindingOnFail = true`**
- [ ] **Step 2: Show explicit CTA; never auto-create a finding**
- [ ] **Step 3: Pre-fill the existing finding draft with**

```text
source = form run
question label
answer
site
attached photo reference
form run id
field id
```

- [ ] **Step 4: Send the user through the existing finding review/confirmation screen**
- [ ] **Step 5: After finding creation call `link_form_answer_to_finding()`**
- [ ] **Step 6: Verify that closing the finding never rewrites the original answer**
- [ ] **Step 7: Commit**

---

### Task 10: Desktop form-run review

**Files:**
- Create: `src/blocks/hse-forms/FormRunReview.tsx`
- Create: `src/app/app/hse/form-runs/[runId]/page.tsx`

- [ ] **Step 1: Show template/version/site/operator/status**
- [ ] **Step 2: Render answers read-only by section**
- [ ] **Step 3: Highlight non-compliant answers**
- [ ] **Step 4: Link generated findings via `form_run_findings`**
- [ ] **Step 5: Add print-friendly review**
- [ ] **Step 6: Run root QA**

```bash
npm run qa
```

Expected: PASS.

- [ ] **Step 7: Commit**

---

### Task 11: Seed first demo HSE templates

**Files:**
- Create: `database/supabase/migrations/<timestamp>_seed_hse_form_templates.sql`

**Templates:**

1. `Trabajo en altura — inspección básica`
2. `Sistema anticaídas en escalera`
3. `Pirosalva — inspección preuso`
4. `Espacio confinado — preingreso`

- [ ] **Step 1: Use only structural/demo questions that do not claim unverified legal periodicities**

Example compliant questions:

```text
¿El equipo presenta daño visible?
¿La identificación es legible?
¿El elemento está correctamente instalado?
¿Se adjunta evidencia fotográfica cuando corresponde?
```

- [ ] **Step 2: For any question that depends on a procedure or legal frequency, store a `reference_required` note instead of a claimed interval**
- [ ] **Step 3: Publish version 1 only for the demo organization**
- [ ] **Step 4: Run a complete checklist and create one finding from a failed answer**
- [ ] **Step 5: Commit**

---

### Task 12: Final verification and release gate

**Files:**
- Modify: `scripts/check-mobile-p0.mjs`
- Create: `scripts/check-dynamic-forms.mjs`
- Modify: `package.json`

- [ ] **Step 1: Add structure checks for all form-engine files**
- [ ] **Step 2: Add root script**

```json
"test:forms": "node --test src/shared/hse/forms/*.test.mjs"
```

- [ ] **Step 3: Add `test:forms` into `qa` before typecheck**
- [ ] **Step 4: Run clean root QA**

```bash
npm ci --no-audit --no-fund
npm run qa
```

Expected: PASS.

- [ ] **Step 5: Run clean mobile QA**

```bash
cd mobile
npm ci --no-audit --no-fund
npm run typecheck
npx expo export --platform android --output-dir dist
```

Expected: PASS.

- [ ] **Step 6: Manual acceptance**

```text
login
→ choose site
→ Inspeccionar
→ Trabajo en altura
→ complete form
→ mark one item No cumple
→ attach photo
→ save offline/reconnect
→ submit
→ create finding
→ see finding in HSE Control desktop
→ close finding with evidence
→ original inspection/form run remains unchanged
```

- [ ] **Step 7: Security acceptance**

Organization A cannot list/read/update templates, versions, runs, answers or form-run/finding links from Organization B.

- [ ] **Step 8: Commit final verification evidence**

---

## Phase 1 Exit Criteria

Phase 1 is complete only when:

- admins can create/version/publish a form template;
- mobile can render it without a custom screen;
- field users can start/save/resume/submit;
- responses survive offline/reconnect;
- published versions cannot mutate;
- non-compliance can explicitly create a finding;
- the finding keeps source traceability;
- desktop can review the original run;
- multi-tenant isolation is tested;
- web and Android builds pass.

After this exit, implement Phase 2 from the Master Plan: **Inspections/Checklists as a first-class domain**, followed by IPCR and PTW.
