# Informe360 — Estado real verificado — 2026-09-11

> Fuente de verdad operativa creada a partir de una auditoría directa del repositorio, Supabase conectado, Render conectado y Vercel conectado. La documentación histórica no prevalece sobre este estado.

## 1. Snapshot técnico

- Repositorio: `LordKurama01/informe360`
- Default branch: `main`
- HEAD auditado: `5f7b108c24864434861485ada7ff3645824a5248`
- Commit: `Informe360 landing mobile-first final`
- Fecha del commit: 2026-06-14
- Branches antes de esta auditoría: sólo `main`
- Protección de `main`: no protegida
- PRs abiertos/encontrados: ninguno
- Issues abiertos/encontrados: ninguno
- GitHub Actions / CI versionado: no encontrado
- Checks/workflow runs del HEAD: ninguno
- Stack: Next.js 16, React 19, TypeScript, Supabase JS
- Script de QA declarado: `npm run qa` = estructura + typecheck + lint + build
- Estado actual de QA: **NO VERIFICADO**. No existe CI activo en el HEAD y el entorno de auditoría no pudo clonar GitHub por falta de resolución de red.

## 2. Clasificación ejecutiva

Informe360 **no es una idea ni un proyecto vacío**. Existe una base técnica reutilizable importante para reportes HSE, IA, normativa, acciones, calendario, evidencias y PDF.

Sin embargo, el estado actual debe clasificarse como:

**PROTOTIPO FUNCIONAL MODULAR / DEMO**, no como SaaS HSE operativo listo para producción.

El principal gap no es UI. Es cerrar una fuente de verdad viva y el circuito:

`capturar → persistir → recordar → reabrir → cerrar con evidencia → incorporar a informe`.

## 3. Runtime y despliegue

### Render

**NO ES EL RUNTIME ACTUAL IDENTIFICADO.**

En el workspace Render conectado no existe ningún servicio asociado a `LordKurama01/informe360`. El repositorio contiene `vercel.json`.

### Vercel

**NO CONFIRMADO.**

El plugin/conexión Vercel respondió sin exponer equipos (`teams: []`), por lo que no fue posible enumerar proyectos, deployment, dominio, variables ni logs. No se encontró una URL productiva verificable durante esta auditoría.

No asumir que existe o no existe un deploy hasta recuperar una conexión Vercel que exponga el proyecto o una URL/runtime verificable.

## 4. Supabase vivo

Proyectos visibles en la cuenta conectada:

1. `FINANCIA360-STAGING` — activo.
2. `Prestige AI Reception Production` — inactivo.
3. `Avanza` — activo.

Los dos proyectos activos fueron inspeccionados y sus esquemas corresponden claramente a Financia360/Avanza. No contienen las entidades distintivas de Informe360 (`reports`, `smart_actions`, `calendar_events`, `normatives`, etc.).

El proyecto Prestige está inactivo y la conexión a su base finalizó por timeout. Por fecha y nombre tampoco constituye evidencia suficiente para asumir que sea Informe360.

### Conclusión

**NO HAY HOY UN PROYECTO SUPABASE VIVO DE INFORME360 IDENTIFICADO ENTRE LOS PROYECTOS ACCESIBLES.**

No crear un proyecto nuevo hasta agotar la identificación mediante variables reales del runtime/deploy.

## 5. Schema histórico del repositorio

Existe `database/supabase/schema.sql` con entidades como:

- `profiles`
- `companies`
- `reports`
- `smart_actions`
- `calendar_events`
- `normatives`
- `ai_generation_logs`
- `tracking_events`
- `customer_feedback`
- `xprize_evidence_assets`
- `ai_decision_trail`
- `inspection_locations`
- `google_integration_status`
- `gmail_delivery_logs`
- `impact_metrics`

Este archivo es **schema histórico/candidato**, no evidencia de una base desplegada.

### Seguridad

No se encontraron en este schema instrucciones claras para:

- habilitar RLS en tablas expuestas;
- políticas RLS multiempresa;
- membership/tenant isolation;
- políticas de Storage.

Esto es un **bloqueante P0** antes de operar como SaaS multiempresa.

## 6. Variables e integraciones

`.env.example` declara las integraciones pero deja vacíos los secretos/URLs reales.

### Gemini

- Código real de cliente y orquestación: **sí**.
- `GEMINI_API_KEY` en runtime: **no confirmado**.
- Modelo default del código: `gemini-1.5-flash`.
- Sin API key: el sistema usa fallback/mock.

### Supabase

- Cliente server-side real: **sí**.
- URL/anon/service-role reales: **no confirmados**.
- Sin variables: servicios de tracking/log devuelven `Supabase not configured`.

### Google Auth

**PARCIAL.** Existe inicio OAuth. Si Supabase falta, se redirige a modo demo. No se verificó un flujo completo de callback/intercambio de código y sesión persistente del usuario.

### Google Calendar

**PREPARADO/PARCIAL.** El callback registra que recibió código/error pero no intercambia token ni crea eventos reales. La UI declara que la exportación externa se incorporará posteriormente.

### Maps / Gmail / Cloud

Código/configuración preparada en distintos grados. Integración runtime real: **no confirmada**.

### Pagos

Primera versión manual preparada. No existe evidencia de billing SaaS completo.

## 7. IA multiagente existente

Existe una arquitectura reutilizable:

`Input Agent → Technical Agent → Normative Agent → SMART Action Agent → Calendar Agent → Executive Agent → Evidence Agent`

Fortaleza: esta arquitectura coincide bien con la futura transformación a HSE Copilot.

Límite actual: si no existe `GEMINI_API_KEY`, los agentes y la generación final operan con respuestas de fallback/mock. Además, la generación de un informe no equivale a persistencia operacional del hallazgo.

## 8. Estado real por módulo

| Función | Estado | Evidencia / gap principal |
|---|---|---|
| Creación de informe | REAL/PARCIAL | Formulario y generación existen; persistencia del informe no está cerrada de punta a punta. |
| Nota de campo | PARCIAL | Existe `fieldNotes`, pero no captura rápida persistente independiente. |
| Cacería técnica | REAL como tipo de informe | Existe en el flujo y prompts. |
| Voz | PARCIAL | Existe `audioTranscript`; no se encontró grabador `MediaRecorder/getUserMedia` ni transcripción real. |
| Fotos/evidencia | PARCIAL | Picker, preview y metadata existen; no se verificó upload persistente a Storage. |
| Hallazgo | PARCIAL | IA genera `findings`; no existe entidad operacional persistente separada y cerrable. |
| Acción SMART | PARCIAL/MOCK | Modelo, schema y generación existen; la pantalla actual usa datos hardcodeados. |
| Normativa | PARCIAL | Catálogo, filtros y agente existen; falta motor estructurado de obligaciones/periodicidad. |
| Calendario | PARCIAL/MOCK | Schema y sugerencias existen; UI hardcodeada y endpoint interno no persiste el evento. |
| Recordatorios automáticos | NO IMPLEMENTADO operativo | No existe motor/scheduler verificado. |
| Activos | NO IMPLEMENTADO | No existe entidad general para matafuegos/equipos/EPP/etc. |
| Historial de activo | NO IMPLEMENTADO | Depende del módulo de activos. |
| Vencimientos | NO IMPLEMENTADO | No existe motor de vencimientos. |
| Motor de periodicidad normativa | NO IMPLEMENTADO | La normativa actual no modela obligación/versionado/periodicidad/vigencia. |
| Alertas | NO IMPLEMENTADO operativo | Sin scheduler/canal de entrega verificado. |
| QR | NO IMPLEMENTADO | Segunda etapa. |
| Inspecciones recurrentes | PARCIAL | Hay checklist/reportes, pero no recurrencia persistente. |
| Offline | NO CONFIRMADO | No se encontró una estrategia offline operativa auditada. |
| Multiempresa | PARCIAL / INSEGURO PARA SAAS | Existe `companies` en schema histórico; falta aislamiento real/RLS verificado. |
| Historial de informes | MOCK | La pantalla usa datos locales: 25 de Mayo S.A., Base operativa Junín, Planta Norte. |
| Dashboard/control | PARCIAL/MOCK | Existe UI y `mock-control-data.ts`. |
| PDF | REAL/PARCIAL | Genera HTML e invoca impresión del navegador; no se verificó almacenamiento del PDF. |
| Auth | PARCIAL | Inicio OAuth preparado, sesión real no validada. |
| Tracking/AI logs | REAL SI HAY SUPABASE | Código inserta en Supabase; runtime actual no confirmado. |

## 9. Diferencia crítica para HSE Copilot

Informe360 hoy está optimizado principalmente para:

**datos de campo → generación de informe**

HSE Copilot necesita agregar una capa operacional persistente:

**captura → hallazgo → acción → vencimiento → alerta → evidencia → cierre → informe**

El informe debe transformarse en una salida del sistema, no en la única unidad central de trabajo.

## 10. Regla normativa obligatoria

El LLM **NO DEBE CALCULAR LIBREMENTE PERIODICIDADES O VENCIMIENTOS NORMATIVOS**.

El futuro motor debe modelar, como mínimo:

`fuente → versión → jurisdicción → vigencia → categoría → activo/requisito → obligación → periodicidad → método de cálculo → última revisión`

La IA puede:

- clasificar el activo/hallazgo;
- extraer fechas y datos;
- sugerir qué regla revisar;
- explicar la regla.

El motor determinístico debe calcular el próximo vencimiento.

## 11. P0 recomendado — circuito piloto de Luis

No construir todavía activos, QR, offline serio ni un gran dashboard.

Primero cerrar un circuito completo:

1. Usuario identificado.
2. Botón principal **Registrar**.
3. Entrada por texto, voz y foto.
4. Persistir captura original.
5. Estructurarla como hallazgo/acción sin perder el original.
6. Guardar fecha y responsable.
7. Mostrar `Hoy / Próximos / Vencidos / Cerrados`.
8. Recordar al usuario por un canal real.
9. Reabrir el hallazgo desde otra sesión/dispositivo.
10. Cerrar con evidencia persistida.
11. Incorporar uno o varios hallazgos al generador de Informe360.

Ese es el primer vertical slice del producto.

## 12. Arquitectura propuesta para P0

Reutilizar el repo existente. No crear arquitectura paralela.

Entidades mínimas nuevas o consolidadas:

- tenant/organización + memberships;
- sites/establecimientos;
- `field_entries` para preservar captura cruda;
- `findings` como hallazgo estructurado;
- `smart_actions` reutilizada/evolucionada;
- `evidence_files` con Storage real;
- `reminders`/eventos programables;
- relación hallazgos ↔ informes.

Los **activos** y el motor normativo de **vencimientos periódicos** deben entrar inmediatamente después del circuito P0, sin contaminar el primer piloto con complejidad innecesaria.

## 13. Orden de implementación recomendado

### P0-A — Foundation operacional

- recuperar/confirmar runtime;
- identificar o provisionar Supabase sólo después de confirmar que no existe el anterior;
- auth real;
- tenant isolation + RLS;
- CI obligatorio;
- persistencia de captura/hallazgos.

### P0-B — Captura y seguimiento

- Registrar mobile-first;
- voz real;
- foto/storage real;
- fecha/responsable;
- listas Hoy/Próximos/Vencidos/Cerrados;
- recordatorio real;
- cierre con evidencia.

### P0-C — Integración con Informe360

- seleccionar hallazgos;
- generar/reutilizar informe existente;
- mantener trazabilidad del hallazgo original y del cierre.

### P1

- activos;
- inspecciones por activo;
- reglas normativas versionadas;
- vencimientos determinísticos;
- alertas 30/15/7/1/vencido.

### P2

- QR;
- dashboard maduro;
- Google Calendar externo;
- reportes avanzados.

### P3

- offline robusto;
- WhatsApp;
- automatizaciones enterprise;
- integraciones adicionales.

## 14. Riesgos prioritarios

1. **Seguridad multiempresa**: no exponer tablas nuevas sin RLS/policies.
2. **Fuente de verdad inexistente/no identificada**: no seguir acumulando UI sobre mocks.
3. **LLM como autoridad normativa**: prohibido para periodicidades/vencimientos.
4. **Evidence loss**: las fotos/archivos deben almacenarse antes de considerarlos evidencia real.
5. **Reminder theater**: una fecha en UI no es una alerta. Debe existir scheduler + entrega verificable.
6. **Main sin protección/CI**: no desarrollar HSE Copilot directamente sobre `main`.

## 15. QA y definición de terminado

No declarar una etapa terminada por compilar.

Antes de merge/deploy exigir:

- tests;
- typecheck;
- lint;
- build;
- CI verde;
- migration/RLS tests;
- QA funcional mobile;
- QA de persistencia entre sesiones;
- deploy verificado;
- smoke test del runtime.

El MVP piloto está terminado cuando Luis puede registrar un hallazgo real desde el celular, recibir seguimiento, reabrirlo, cerrarlo con evidencia y reutilizarlo en un informe sin perder información.

## 16. Viabilidad actualizada

### Viabilidad de producto: **92%**

Suma:

- problema real de campo;
- usuario piloto disponible;
- base HSE existente;
- reportes, IA, normativa, PDF y UX reutilizables;
- fuerte recurrencia potencial por historial/vencimientos/acciones.

Resta:

- persistencia viva no identificada;
- runtime no confirmado;
- varios módulos son mock;
- falta seguridad multiempresa;
- falta captura de voz real;
- falta Storage/evidencia real;
- falta motor de recordatorios;
- falta motor normativo de periodicidad.

### Readiness técnico para piloto hoy: **60%**

La diferencia entre 92% y 60% es exactamente el trabajo P0: convertir un generador inteligente de reportes en un sistema operativo persistente.

## 17. Decisión

**NO crear otro producto. NO reescribir.**

Continuar sobre `LordKurama01/informe360`, preservando la generación de reportes y la arquitectura multiagente, pero cambiando el centro de gravedad hacia la memoria operacional HSE.

Próximo paso técnico después de esta auditoría: diseñar y aprobar el P0 operacional (modelo de datos, RLS, captura, recordatorios y cierre) y luego implementarlo en una rama dedicada, nunca directamente en `main`.
