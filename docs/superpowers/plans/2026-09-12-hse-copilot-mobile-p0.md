# HSE Copilot Mobile P0 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convertir Informe360 en un piloto HSE Copilot mobile nativo vendible, con captura texto/audio/foto, IA gratuita intercambiable, persistencia Supabase, hallazgos/acciones/recordatorios/evidencia y reutilización en informes.

**Architecture:** `mobile/` será una app Expo SDK 57 independiente del frontend Next existente, pero ambos compartirán el mismo Supabase. El cliente móvil usa exclusivamente la publishable key y RLS; secretos de IA quedan en rutas server-side de Next. `AIProvider` abstrae Groq/Ollama/futuro OpenAI y nunca genera vencimientos normativos autoritativos.

**Tech Stack:** Expo SDK 57, React Native 0.86, Expo Router, TypeScript, Supabase JS, Expo SecureStore, Camera, Audio, Notifications, FileSystem, Next.js 16 API routes, Groq Free Plan (structured outputs + Whisper), Ollama/Qwen3 local opcional.

**Spec:** `docs/HSE_COPILOT_PLAN_MAESTRO_2026-09-11.md`

## Global Constraints

- Mobile nativo primero; no PWA/WebView como producto de campo.
- Supabase `wvjmsltqrztlvgmayicr` es la única fuente de verdad.
- RLS y Storage privado obligatorios.
- Captura cruda se persiste aunque falle IA.
- IA estructura/clasifica; no inventa normas ni vencimientos regulatorios.
- Secretos Groq/Ollama/OpenAI nunca se empaquetan en la app.
- Primero validar flujo completo: registrar → estructurar → confirmar → guardar → recordar → cerrar → evidenciar → informar.
- Repos Apache/MIT pueden donar patrones/código con atribución; AGPL sólo benchmark salvo decisión explícita.

---

### Task 1: Rama aislada y base Expo nativa

**Files:**
- Create: `mobile/package.json`
- Create: `mobile/app.json`
- Create: `mobile/tsconfig.json`
- Create: `mobile/app/_layout.tsx`
- Create: `mobile/app/index.tsx`
- Create: `mobile/src/theme.ts`

**Interfaces:**
- Produces: aplicación Expo SDK 57 ejecutable y navegación Expo Router.

- [ ] Crear rama `feat/hse-copilot-mobile-p0` desde `feat/supabase-fresh-start`.
- [ ] Escribir prueba/chequeo estructural que exija shell móvil y configuración Expo.
- [ ] Crear proyecto Expo SDK 57 mínimo con Router.
- [ ] Ejecutar TypeScript/Expo export check.
- [ ] Commit.

### Task 2: Supabase móvil y autenticación

**Files:**
- Create: `mobile/src/lib/supabase.ts`
- Create: `mobile/src/lib/session-storage.ts`
- Create: `mobile/src/providers/auth-provider.tsx`
- Create: `mobile/app/login.tsx`
- Create: `mobile/app/onboarding.tsx`

**Interfaces:**
- Produces: `useAuth()`, sesión persistida en SecureStore, creación de organización/sitio inicial.

- [ ] Probar que no se usa service role en cliente.
- [ ] Implementar cliente Supabase con Expo SecureStore.
- [ ] Implementar email/password signup/signin/signout.
- [ ] Implementar bootstrap de organización y sitio para primer usuario.
- [ ] Verificar RLS con usuario autenticado.
- [ ] Commit.

### Task 3: Contrato HSE compartido y parsing determinístico

**Files:**
- Create: `src/shared/hse/contracts.ts`
- Create: `src/shared/hse/date-resolution.ts`
- Create: `src/shared/hse/date-resolution.test.mjs`

**Interfaces:**
- Produces: `StructuredFindingDraft`, `resolveUserRelativeDate()`.

- [ ] Test rojo para fechas explícitas/relativas de usuario y rechazo de fechas regulatorias inferidas.
- [ ] Implementar contratos y parser mínimo.
- [ ] Test verde.
- [ ] Commit.

### Task 4: AIProvider gratuito/intercambiable

**Files:**
- Create: `src/services/ai/hse/types.ts`
- Create: `src/services/ai/hse/provider.ts`
- Create: `src/services/ai/hse/groq-provider.ts`
- Create: `src/services/ai/hse/ollama-provider.ts`
- Create: `src/services/ai/hse/router.ts`
- Create: `src/app/api/hse/structure/route.ts`
- Create: `src/app/api/hse/transcribe/route.ts`

**Interfaces:**
- Produces: `structureFieldEntry(text)`, `transcribeAudio(file)`.

- [ ] Test de contrato: respuesta schema estricta y `normative_due_at` inexistente.
- [ ] Groq structured outputs con `qwen/qwen3.8-27b` o `openai/gpt-oss-20b` configurable.
- [ ] Groq Whisper Large V3 Turbo para piloto/free limits.
- [ ] Ollama Qwen3 4B como fallback opcional por `OLLAMA_BASE_URL`.
- [ ] Fallback manual cuando no hay proveedor disponible.
- [ ] Commit.

### Task 5: Registrar texto/audio/foto

**Files:**
- Create: `mobile/app/register.tsx`
- Create: `mobile/src/features/capture/text-capture.tsx`
- Create: `mobile/src/features/capture/audio-capture.tsx`
- Create: `mobile/src/features/capture/photo-capture.tsx`
- Create: `mobile/src/services/upload.ts`

**Interfaces:**
- Consumes: Supabase auth + `/api/hse/structure` + `/api/hse/transcribe`.
- Produces: `field_entries` + borrador confirmable.

- [ ] Captura texto con persistencia raw primero.
- [ ] Audio real con módulo Expo; subir al bucket privado antes de transcribir.
- [ ] Foto real con Expo Camera/ImagePicker; subir evidencia privada.
- [ ] Si IA falla, mantener captura y abrir edición manual.
- [ ] Commit.

### Task 6: Confirmación y persistencia de hallazgos/acciones

**Files:**
- Create: `mobile/app/review-draft.tsx`
- Create: `mobile/src/features/findings/finding-form.tsx`
- Create: `mobile/src/services/findings.ts`

**Interfaces:**
- Produces: `findings`, `smart_actions`, `reminders` atómicamente desde el flujo de usuario.

- [ ] Validar title/severity/responsable/fecha.
- [ ] Nunca aceptar fecha normativa generada por IA como autoridad.
- [ ] Guardar hallazgo y acción; marcar field_entry `structured`.
- [ ] Crear recordatorio in-app/push cuando exista due_at.
- [ ] Commit.

### Task 7: Home operativa y bandejas

**Files:**
- Create: `mobile/app/(tabs)/_layout.tsx`
- Create: `mobile/app/(tabs)/index.tsx`
- Create: `mobile/app/(tabs)/findings.tsx`
- Create: `mobile/app/(tabs)/alerts.tsx`
- Create: `mobile/src/features/findings/finding-card.tsx`

**Interfaces:**
- Produces: Hoy / Próximos / Vencidos / Cerrados.

- [ ] Consultas por organización/sitio bajo RLS.
- [ ] `overdue` calculado por `due_at` + status.
- [ ] CTA central `REGISTRAR`.
- [ ] Pull-to-refresh y estados vacíos/error.
- [ ] Commit.

### Task 8: Evidencia y cierre

**Files:**
- Create: `mobile/app/finding/[id].tsx`
- Create: `mobile/src/features/evidence/evidence-uploader.tsx`
- Create: `mobile/src/services/evidence.ts`

**Interfaces:**
- Produces: evidencia privada, cierre/reapertura trazable.

- [ ] Adjuntar foto/documento sin sobrescribir captura original.
- [ ] Cerrar con comentario + timestamp + usuario.
- [ ] Reabrir según permisos.
- [ ] Commit.

### Task 9: Notificaciones y offline básico

**Files:**
- Create: `mobile/src/services/notifications.ts`
- Create: `mobile/src/services/drafts.ts`
- Create: `mobile/src/services/network.ts`

**Interfaces:**
- Produces: recordatorio local real y persistencia local de borradores/capturas pendientes.

- [ ] Programar notificación local cuando due_at sea futuro.
- [ ] Guardar borradores fallidos localmente.
- [ ] Reintento manual al recuperar conexión; sin conflict resolution compleja P0.
- [ ] Commit.

### Task 10: Informe360 desktop consume hallazgos reales

**Files:**
- Modify: flujo de reportes existente bajo `src/app/app/reports/**` o servicio equivalente.
- Create: `src/services/hse/findings-for-report.ts`

**Interfaces:**
- Produces: selección de hallazgos reales y filas `report_findings`.

- [ ] Listar hallazgos de organización/sitio.
- [ ] Permitir seleccionar hallazgos en informe.
- [ ] Persistir relación sin duplicar contenido operacional.
- [ ] Commit.

### Task 11: QA, documentación comercial y demo

**Files:**
- Modify: `.github/workflows/ci.yml`
- Create: `docs/HSE_COPILOT_PILOTO_VENDIBLE.md`
- Update: `docs/HSE_COPILOT_REPOS_Y_COMPONENTES_2026-09-11.md`

**Interfaces:**
- Produces: CI web + móvil, runbook de demo y catálogo de componentes/licencias.

- [ ] CI verifica root y `mobile`.
- [ ] Documentar variables gratuitas y degradación cuando se agotan límites.
- [ ] Documentar demo comercial de 5 minutos.
- [ ] Ejecutar QA completo y registrar limitaciones reales.
- [ ] Commit.
