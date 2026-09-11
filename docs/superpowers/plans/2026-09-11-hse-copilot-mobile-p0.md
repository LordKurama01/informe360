# HSE Copilot Mobile P0 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** construir el primer vertical slice operativo de HSE Copilot como app React Native/Expo nativa: registrar texto/audio/foto, persistir captura y hallazgo, gestionar vencimiento/estado, alertar, cerrar con evidencia e incorporar hallazgos a Informe360.

**Architecture:** el Next.js existente se conserva como desktop/reporting y backend compatible. Se agrega una app móvil nativa en `mobile/` sin mover el web actual. Supabase/PostgreSQL será la fuente de verdad una vez identificado/provisionado el proyecto correcto; el cliente usa RLS y Storage privado. La IA queda detrás de un provider server-side con implementación local evaluable y OpenAI futura.

**Tech Stack:** Next.js 16, React 19, TypeScript, React Native/Expo, Expo Router, Supabase JS/PostgreSQL/Storage/Auth, Vitest para lógica server/shared, Jest Expo/Testing Library para mobile, Ollama/Qwen y whisper.cpp sólo después de benchmark.

**Spec:** `docs/HSE_COPILOT_PLAN_MAESTRO_2026-09-11.md`

## Global Constraints

- No modificar `main` directamente.
- Partir del estado auditado en `docs/INFORME360_ESTADO_REAL_2026-09-11.md`.
- No crear un segundo Supabase hasta confirmar que no existe el anterior o decidir formalmente provisionar uno nuevo.
- Mobile P0 es app nativa React Native/Expo; no WebView/PWA como núcleo.
- Desktop actual no se mueve ni se reescribe durante P0.
- Toda tabla multiempresa debe usar `organization_id` y RLS antes de ser consumida por cliente.
- `SUPABASE_SERVICE_ROLE_KEY` y claves de proveedores IA nunca llegan al cliente móvil.
- La captura original debe persistirse aunque falle IA/transcripción.
- El LLM no calcula periodicidades normativas legales.
- Cambios funcionales se desarrollan con TDD y commits pequeños.
- `npm run qa` del web debe seguir pasando; mobile agrega su propio `test`, `typecheck` y lint.

---

## File Structure

### Existente que se conserva

- `src/` — Next.js Informe360 actual.
- `database/supabase/` — schema histórico y nuevas migraciones controladas.
- `docs/` — auditoría, especificaciones y decisiones.

### Nuevo P0

- `mobile/` — aplicación Expo independiente dentro del mismo repositorio.
- `mobile/app/` — navegación Expo Router.
- `mobile/src/features/auth/` — sesión y selección de contexto.
- `mobile/src/features/capture/` — captura texto/audio/foto.
- `mobile/src/features/findings/` — lista, detalle y estados.
- `mobile/src/features/evidence/` — upload/evidencia.
- `mobile/src/lib/supabase.ts` — cliente Supabase móvil.
- `mobile/src/lib/offline/` — borradores/outbox mínima P0.
- `src/services/hse/` — lógica server-side HSE/AI reutilizable por desktop y mobile.
- `src/app/api/hse/` — endpoints server-only para IA y operaciones que no deban exponerse al cliente.
- `database/supabase/migrations/` — migraciones HSE P0 + RLS.
- `tests/hse/` — pruebas contractuales server/shared.

---

### Task 1: Crear rama de implementación, CI y guardrails

**Files:**
- Create: `.github/workflows/ci.yml`
- Modify: `package.json`
- Create: `vitest.config.ts`
- Create: `tests/hse/smoke.test.ts`

**Interfaces:**
- Produces: CI que ejecuta web structure/typecheck/lint/build y tests HSE.
- Produces: comando raíz `npm run test:hse`.

- [ ] **Step 1: crear rama desde el HEAD de documentación aprobado**

Run:

```bash
git switch -c feat/hse-copilot-mobile-p0 docs/hse-copilot-master-plan-2026-09-11
```

Expected: rama nueva, `main` intacto.

- [ ] **Step 2: escribir smoke test fallando**

Create `tests/hse/smoke.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { HSE_P0_VERSION } from "../../src/services/hse/version";

describe("HSE Copilot P0", () => {
  it("exposes a versioned domain marker", () => {
    expect(HSE_P0_VERSION).toBe("2026-09-11-p0");
  });
});
```

- [ ] **Step 3: ejecutar test y confirmar RED**

Run:

```bash
npm run test:hse
```

Expected: FAIL porque `src/services/hse/version.ts` todavía no existe.

- [ ] **Step 4: agregar Vitest y script mínimo**

Modify `package.json` scripts:

```json
{
  "test:hse": "vitest run tests/hse",
  "qa:hse": "npm run test:hse && npm run typecheck && npm run lint && npm run build"
}
```

Add dev dependency compatible con Node del entorno:

```bash
npm install -D vitest
```

Create `vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/hse/**/*.test.ts"],
  },
});
```

- [ ] **Step 5: implementar marker mínimo**

Create `src/services/hse/version.ts`:

```ts
export const HSE_P0_VERSION = "2026-09-11-p0" as const;
```

- [ ] **Step 6: agregar CI**

Create `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  pull_request:
  push:
    branches: [main]

jobs:
  web:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm run test:structure
      - run: npm run test:hse
      - run: npm run typecheck
      - run: npm run lint
      - run: npm run build
```

- [ ] **Step 7: verificar GREEN y commit**

Run:

```bash
npm run test:hse && npm run qa
```

Expected: PASS.

Commit:

```bash
git add .github package.json package-lock.json vitest.config.ts tests/hse src/services/hse/version.ts
git commit -m "test: establish HSE Copilot CI guardrails"
```

---

### Task 2: Crear shell móvil Expo nativo

**Files:**
- Create: `mobile/package.json`
- Create: `mobile/app.json`
- Create: `mobile/tsconfig.json`
- Create: `mobile/app/_layout.tsx`
- Create: `mobile/app/(tabs)/_layout.tsx`
- Create: `mobile/app/(tabs)/index.tsx`
- Create: `mobile/app/(tabs)/findings.tsx`
- Create: `mobile/app/capture.tsx`
- Create: `mobile/src/components/PrimaryCaptureButton.tsx`
- Create: `mobile/src/components/__tests__/PrimaryCaptureButton.test.tsx`

**Interfaces:**
- Produces: navegación nativa `Inicio`, `Hallazgos`, `Registrar`.
- Produces: componente `PrimaryCaptureButton({ onPress })`.

- [ ] **Step 1: scaffold Expo TypeScript en `mobile/`**

Run desde raíz:

```bash
npx create-expo-app@latest mobile --template blank-typescript
cd mobile
npx expo install expo-router expo-dev-client react-native-safe-area-context react-native-screens
```

Expected: app Expo arranca sin modificar el Next.js raíz.

- [ ] **Step 2: instalar testing mobile**

Run:

```bash
cd mobile
npm install -D jest-expo @testing-library/react-native @types/jest
```

Add scripts en `mobile/package.json`:

```json
{
  "test": "jest --runInBand",
  "typecheck": "tsc --noEmit"
}
```

- [ ] **Step 3: escribir test RED del botón Registrar**

Create `mobile/src/components/__tests__/PrimaryCaptureButton.test.tsx`:

```tsx
import { fireEvent, render } from "@testing-library/react-native";
import { PrimaryCaptureButton } from "../PrimaryCaptureButton";

test("fires capture action from the primary mobile CTA", () => {
  const onPress = jest.fn();
  const view = render(<PrimaryCaptureButton onPress={onPress} />);
  fireEvent.press(view.getByText("REGISTRAR"));
  expect(onPress).toHaveBeenCalledTimes(1);
});
```

- [ ] **Step 4: implementar botón táctil grande**

Create `mobile/src/components/PrimaryCaptureButton.tsx`:

```tsx
import { Pressable, Text } from "react-native";

export function PrimaryCaptureButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel="Registrar hallazgo" onPress={onPress}>
      <Text>🎙️</Text>
      <Text>REGISTRAR</Text>
    </Pressable>
  );
}
```

- [ ] **Step 5: implementar navegación Expo Router**

`mobile/app/(tabs)/index.tsx` debe navegar a `/capture` al tocar `REGISTRAR`. `mobile/app/(tabs)/findings.tsx` empieza con estado vacío explícito. `mobile/app/capture.tsx` muestra tres modos: `Hablar`, `Escribir`, `Foto`.

- [ ] **Step 6: verificar**

Run:

```bash
cd mobile
npm test
npm run typecheck
npx expo export --platform android
```

Expected: tests/typecheck/export PASS.

- [ ] **Step 7: commit**

```bash
git add mobile
git commit -m "feat: add native HSE Copilot mobile shell"
```

---

### Task 3: Resolver Supabase objetivo y crear schema P0 con RLS

**Files:**
- Create: `database/supabase/migrations/20260911_120000_hse_copilot_p0.sql`
- Create: `tests/hse/schema-contract.test.ts`
- Create: `mobile/src/lib/supabase.ts`
- Create: `mobile/src/lib/env.ts`

**Interfaces:**
- Produces tablas: `organizations`, `organization_memberships`, `sites`, `field_entries`, `findings`, `evidence_files`, `reminders`, `report_findings`.
- Produces cliente móvil con publishable/anon key solamente.

- [ ] **Step 1: revalidar runtime y proyectos antes de tocar DB**

Required checks:

```text
- deployment/runtime actual
- variables de entorno reales
- Supabase refs visibles
- confirmar que FINANCIA360/Avanza no son destino HSE
```

Expected: una única decisión registrada: `reusar <project_ref>` o `provisionar nuevo HSE Supabase`.

No ejecutar migración sin esta decisión.

- [ ] **Step 2: escribir contrato RED de migration**

Create `tests/hse/schema-contract.test.ts` que lea el SQL y verifique tokens obligatorios:

```ts
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const sql = readFileSync(
  "database/supabase/migrations/20260911_120000_hse_copilot_p0.sql",
  "utf8",
);

describe("HSE P0 schema contract", () => {
  it.each([
    "create table if not exists public.organizations",
    "create table if not exists public.organization_memberships",
    "create table if not exists public.sites",
    "create table if not exists public.field_entries",
    "create table if not exists public.findings",
    "create table if not exists public.evidence_files",
    "create table if not exists public.reminders",
    "alter table public.findings enable row level security",
  ])("contains %s", (token) => {
    expect(sql.toLowerCase()).toContain(token);
  });
});
```

Expected: RED porque migration no existe.

- [ ] **Step 3: escribir migration mínima completa**

La migration debe:

- usar UUID PK;
- incluir `organization_id` en toda entidad tenant-scoped;
- relacionar membership con `auth.users`;
- habilitar RLS en todas las tablas expuestas;
- crear función helper `is_org_member(target_org uuid)` con `security definer` y `search_path` fijo;
- crear policies SELECT/INSERT/UPDATE apropiadas;
- impedir update de `field_entries.raw_text` una vez creado mediante trigger o privilegio controlado;
- crear índices por `organization_id`, `site_id`, `due_at`, `status`;
- no crear policies públicas anónimas.

- [ ] **Step 4: agregar cliente móvil seguro**

Create `mobile/src/lib/env.ts`:

```ts
export function requireEnv(name: "EXPO_PUBLIC_SUPABASE_URL" | "EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY") {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}
```

Create `mobile/src/lib/supabase.ts` usando `@supabase/supabase-js`, `react-native-url-polyfill` y almacenamiento de sesión compatible Expo. Nunca aceptar service-role.

- [ ] **Step 5: aplicar migration en staging/target correcto**

Antes:

```sql
select current_database(), now();
```

Después verificar tablas, policies y RLS.

- [ ] **Step 6: probar aislamiento**

Crear usuarios/orgs A y B de prueba; desde sesión A intentar SELECT/UPDATE de finding B.

Expected: 0 rows o permission denied; nunca datos de B.

- [ ] **Step 7: commit**

```bash
git add database/supabase/migrations tests/hse mobile/src/lib
git commit -m "feat: add tenant-safe HSE P0 persistence"
```

---

### Task 4: Auth y contexto organización/sitio en mobile

**Files:**
- Create: `mobile/src/features/auth/AuthProvider.tsx`
- Create: `mobile/src/features/auth/useSession.ts`
- Create: `mobile/src/features/auth/SiteContextProvider.tsx`
- Create: `mobile/app/sign-in.tsx`
- Modify: `mobile/app/_layout.tsx`
- Test: `mobile/src/features/auth/__tests__/SiteContextProvider.test.tsx`

**Interfaces:**
- Produces: `useSession()`.
- Produces: `useSiteContext(): { organizationId, siteId, setSiteId }`.

- [ ] **Step 1: test RED de selección de sitio**

El test monta provider con dos sitios y verifica que el sitio seleccionado quede disponible a descendants y pueda persistirse.

- [ ] **Step 2: implementar AuthProvider sobre Supabase Auth**

Requisitos:

- restaurar sesión al abrir;
- escuchar cambio de auth;
- sign-out limpia contexto local;
- no mostrar app protegida hasta resolver sesión.

- [ ] **Step 3: implementar selector organización/sitio**

Consultar memberships permitidas por RLS. Si sólo hay un sitio, seleccionarlo automáticamente. Si hay varios, exigir selección.

- [ ] **Step 4: verificar tests/typecheck**

Run:

```bash
cd mobile
npm test
npm run typecheck
```

- [ ] **Step 5: commit**

```bash
git add mobile
git commit -m "feat: add mobile auth and site context"
```

---

### Task 5: Captura texto, audio y foto con persistencia raw-first

**Files:**
- Create: `mobile/src/features/capture/types.ts`
- Create: `mobile/src/features/capture/captureRepository.ts`
- Create: `mobile/src/features/capture/useAudioCapture.ts`
- Create: `mobile/src/features/capture/usePhotoCapture.ts`
- Create: `mobile/src/features/capture/CaptureComposer.tsx`
- Modify: `mobile/app/capture.tsx`
- Test: `mobile/src/features/capture/__tests__/captureRepository.test.ts`

**Interfaces:**
- Produces: `createFieldEntry(input: CreateFieldEntryInput): Promise<FieldEntry>`.
- Produces: `CaptureAsset` para audio/photo local y remoto.

- [ ] **Step 1: definir tipos**

```ts
export type CaptureType = "text" | "audio" | "photo" | "mixed";

export type CreateFieldEntryInput = {
  organizationId: string;
  siteId: string;
  captureType: CaptureType;
  rawText: string | null;
  audioUri?: string | null;
  photoUris?: string[];
  capturedAt: string;
};
```

- [ ] **Step 2: escribir test RED repository**

Mockear Supabase y verificar que siempre se inserte `field_entries` antes de invocar IA.

Test explícito:

```ts
it("persists raw capture even when structuring later fails", async () => {
  const entry = await createFieldEntry(validInput);
  expect(entry.id).toBeTruthy();
});
```

- [ ] **Step 3: audio nativo**

Usar módulo Expo oficial compatible con SDK elegido. Guardar archivo local primero; subir a Storage privado; asociar path al `field_entry`.

- [ ] **Step 4: foto nativa**

Usar `expo-camera`; comprimir sólo si supera límite definido; conservar metadata mínima; subir a bucket privado.

- [ ] **Step 5: no bloquear guardado por IA**

Flujo:

```text
capture locally
→ persist field_entry
→ upload assets
→ mark upload result
→ request structuring
```

No invertir el orden.

- [ ] **Step 6: verificar**

Casos obligatorios:

- texto online;
- audio online;
- foto online;
- IA caída;
- upload falla después de crear entry;
- retry no duplica `field_entry`.

- [ ] **Step 7: commit**

```bash
git add mobile/src/features/capture mobile/app/capture.tsx
git commit -m "feat: persist native field capture before AI"
```

---

### Task 6: AIProvider server-side y benchmark local

**Files:**
- Create: `src/services/hse/ai/types.ts`
- Create: `src/services/hse/ai/provider.ts`
- Create: `src/services/hse/ai/local-provider.ts`
- Create: `src/services/hse/ai/openai-provider.ts`
- Create: `src/services/hse/ai/structure-field-entry.ts`
- Create: `src/app/api/hse/structure/route.ts`
- Create: `tests/hse/ai-provider.test.ts`
- Create: `scripts/benchmark-hse-local-ai.mjs`

**Interfaces:**
- Produces:

```ts
export type StructuredFindingDraft = {
  title: string;
  description: string;
  category: string | null;
  severity: "low" | "medium" | "high" | "critical" | null;
  responsibleText: string | null;
  dueExpression: string | null;
  confidence: number;
};
```

- [ ] **Step 1: escribir contrato RED**

Test con input fijo:

```ts
const text = "Sala de bombas. Manguera con pérdida. Mantenimiento revisar mañana.";
```

Validar que el parser/provider retorne objeto que cumple schema y nunca agregue una periodicidad normativa.

- [ ] **Step 2: implementar validator determinístico**

Antes de confiar en el modelo, validar JSON y rangos de confianza. Si el provider devuelve inválido, responder `needs_manual_review: true`.

- [ ] **Step 3: implementar provider local**

`local-provider.ts` llama a endpoint Ollama configurable sólo desde server. Timeout corto y error tipado.

- [ ] **Step 4: agregar provider OpenAI sin activarlo por defecto**

`openai-provider.ts` usa SDK oficial sólo server-side y se selecciona por configuración/plan, nunca desde mobile.

- [ ] **Step 5: benchmark en servidor real**

`scripts/benchmark-hse-local-ai.mjs` debe medir al menos 20 prompts cortos y reportar:

- p50;
- p95;
- errores;
- JSON válido;
- extracción exacta de fecha/responsable/elemento.

Gate recomendado para P0 interactivo:

- JSON válido >= 98%;
- error rate < 2%;
- p95 <= 8 s en prompt corto.

Si no cumple: local IA queda async/no bloqueante o se usa modo manual hasta mejorar infraestructura.

- [ ] **Step 6: commit**

```bash
git add src/services/hse/ai src/app/api/hse/structure tests/hse scripts/benchmark-hse-local-ai.mjs
git commit -m "feat: add provider-neutral HSE structuring"
```

---

### Task 7: Confirmación del hallazgo y listas operativas

**Files:**
- Create: `mobile/src/features/findings/types.ts`
- Create: `mobile/src/features/findings/findingsRepository.ts`
- Create: `mobile/src/features/findings/FindingDraftReview.tsx`
- Create: `mobile/src/features/findings/FindingsList.tsx`
- Create: `mobile/app/findings/[id].tsx`
- Modify: `mobile/app/(tabs)/index.tsx`
- Modify: `mobile/app/(tabs)/findings.tsx`
- Test: `mobile/src/features/findings/__tests__/findingsRepository.test.ts`

**Interfaces:**
- Produces: `createFindingFromEntry`.
- Produces: `listFindings(bucket: "today" | "upcoming" | "overdue" | "closed")`.

- [ ] **Step 1: test RED de buckets**

Congelar reloj y verificar:

- `open + due_at pasado` => overdue;
- `open + due_at hoy` => today;
- `open + futuro` => upcoming;
- `closed` => closed aunque `due_at` haya pasado.

- [ ] **Step 2: implementar queries sin estado overdue persistido**

`overdue` se deriva de `status != closed && due_at < now()`.

- [ ] **Step 3: implementar pantalla de confirmación**

Mostrar:

- captura original en modo sólo lectura;
- título;
- descripción;
- severidad;
- responsable;
- vencimiento;
- CTA `Guardar hallazgo`.

Si confidence es baja, resaltar los campos inciertos; nunca ocultar la captura original.

- [ ] **Step 4: implementar Home operacional**

Home sólo muestra conteos y primeras tareas, no dashboard empresarial.

- [ ] **Step 5: verificar y commit**

```bash
cd mobile && npm test && npm run typecheck
cd .. && git add mobile
git commit -m "feat: add finding review and operational queues"
```

---

### Task 8: Recordatorios y push real

**Files:**
- Create: `mobile/src/features/notifications/registerPush.ts`
- Create: `src/services/hse/reminders/build-reminders.ts`
- Create: `src/services/hse/reminders/send-due-reminders.ts`
- Create: `src/app/api/hse/reminders/run/route.ts`
- Create: `tests/hse/reminders.test.ts`
- Modify: migration P0 para `push_devices` si no quedó en Task 3.

**Interfaces:**
- Produces: `buildRemindersForFinding(finding)` idempotente.
- Produces: worker endpoint protegido.

- [ ] **Step 1: test RED de idempotencia**

Crear dos veces recordatorios para mismo finding/due_at.

Expected: mismo conjunto lógico, sin duplicados.

- [ ] **Step 2: registrar token push por usuario/dispositivo**

Guardar token asociado a `auth.uid()` y organización permitida. Rotación/re-registro actualiza, no duplica indefinidamente.

- [ ] **Step 3: implementar envío**

Worker selecciona `scheduled_for <= now()` y `status = pending`, envía, marca `sent` o `failed` con motivo.

- [ ] **Step 4: seguridad**

Endpoint cron no acepta ejecución pública sin secreto/identidad de scheduler. Service role queda server-side.

- [ ] **Step 5: verificar fallo de push**

Aunque push falle, finding debe seguir apareciendo overdue/today en UI.

- [ ] **Step 6: commit**

```bash
git add mobile/src/features/notifications src/services/hse/reminders src/app/api/hse/reminders tests/hse database/supabase/migrations
git commit -m "feat: add durable HSE reminders and mobile push"
```

---

### Task 9: Cierre con evidencia y audit trail

**Files:**
- Create: `mobile/src/features/evidence/evidenceRepository.ts`
- Create: `mobile/src/features/findings/CloseFindingSheet.tsx`
- Create: `src/services/hse/audit/write-audit-event.ts`
- Create: `tests/hse/finding-close.test.ts`
- Modify: migration para `audit_events` si no existe una entidad reutilizable segura.

**Interfaces:**
- Produces: `closeFinding({ findingId, note, evidence })`.
- Produces: evento de auditoría con actor, timestamp, before/after.

- [ ] **Step 1: test RED de transición**

Validar:

- open → closed permitido;
- closed → closed no crea eventos duplicados;
- usuario de otra organización rechazado;
- captura original permanece intacta.

- [ ] **Step 2: upload de evidencia**

Storage path:

```text
<organization_id>/findings/<finding_id>/<uuid>.<ext>
```

Bucket privado; acceso mediante sesión/policies o URL firmada server-side según caso.

- [ ] **Step 3: cerrar en transacción/RPC segura**

El cierre y audit event deben quedar consistentes. Si falla audit, no confirmar cierre silenciosamente.

- [ ] **Step 4: verificar reopen según rol**

Si P0 habilita reopen, registrar evento explícito y conservar `closed_at` previo en audit trail.

- [ ] **Step 5: commit**

```bash
git add mobile/src/features/evidence mobile/src/features/findings src/services/hse/audit tests/hse database/supabase/migrations
git commit -m "feat: close HSE findings with durable evidence"
```

---

### Task 10: Integrar hallazgos reales con Informe360

**Files:**
- Create: `src/services/hse/reports/finding-to-report-input.ts`
- Modify: `src/types/report.ts`
- Modify: `src/blocks/reports/shared/ReportForm.tsx`
- Create: `tests/hse/report-integration.test.ts`

**Interfaces:**
- Produces: `findingsToReportInput(findings)`.
- Preserva IDs/origen para trazabilidad.

- [ ] **Step 1: test RED mapping**

Dado dos findings reales, el mapper debe producir texto/evidencia de informe sin inventar hallazgos nuevos.

- [ ] **Step 2: extender ReportInput**

Agregar referencia opcional a findings seleccionados sin romper reportes históricos/demo.

- [ ] **Step 3: permitir selección desde desktop**

El formulario de Informe360 debe poder cargar hallazgos reales por organización/sitio y agregarlos al borrador.

- [ ] **Step 4: conservar relación**

Al guardar/generar informe persistente, insertar `report_findings` con IDs reales.

- [ ] **Step 5: verificar regresión**

Run:

```bash
npm run test:hse
npm run qa
```

Expected: PASS.

- [ ] **Step 6: commit**

```bash
git add src/services/hse/reports src/types/report.ts src/blocks/reports tests/hse
git commit -m "feat: build Informe360 reports from real findings"
```

---

### Task 11: Pilot verification before merge

**Files:**
- Create: `docs/qa/HSE_COPILOT_P0_PILOT_CHECKLIST.md`
- Create: `docs/qa/HSE_COPILOT_P0_RESULTS.md`

**Interfaces:**
- Produces evidencia verificable de que P0 funciona end-to-end.

- [ ] **Step 1: ejecutar suite automática completa**

Root:

```bash
npm ci
npm run test:structure
npm run test:hse
npm run typecheck
npm run lint
npm run build
```

Mobile:

```bash
cd mobile
npm ci
npm test
npm run typecheck
npx expo export --platform android
```

Expected: todo PASS.

- [ ] **Step 2: prueba manual en dispositivo real**

Checklist:

```text
[ ] login real
[ ] seleccionar sitio
[ ] crear hallazgo por texto
[ ] crear hallazgo por audio
[ ] adjuntar foto
[ ] matar/reabrir app y confirmar persistencia
[ ] abrir en otra sesión/dispositivo
[ ] recibir push
[ ] ver overdue al pasar fecha
[ ] cerrar con evidencia
[ ] confirmar audit trail
[ ] incorporar hallazgo a Informe360
[ ] generar/exportar informe
```

- [ ] **Step 3: prueba de aislamiento**

Usuario A intenta acceder por ID conocido a finding/evidence de organización B.

Expected: acceso denegado/0 rows.

- [ ] **Step 4: completar resultados sin maquillar fallos**

`docs/qa/HSE_COPILOT_P0_RESULTS.md` debe registrar commit probado, dispositivo/OS, entorno, tests, fallos y limitaciones reales.

- [ ] **Step 5: abrir PR**

PR desde `feat/hse-copilot-mobile-p0` hacia `main` sólo cuando CI esté verde y checklist P0 tenga evidencia.

---

## Execution Order

Ejecutar estrictamente:

`1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10 → 11`

La excepción es Task 6: el benchmark local puede concluir que Ollama/Qwen no cumple SLA; eso **no bloquea** el resto del P0 porque la captura y el formulario manual deben seguir funcionando.

## P0 Exit Gate

No declarar “MVP terminado” hasta demostrar en un dispositivo real:

`registrar → guardar → reabrir → recordar → cerrar con evidencia → informar`

sin mocks como fuente de verdad y con aislamiento multiempresa probado.
