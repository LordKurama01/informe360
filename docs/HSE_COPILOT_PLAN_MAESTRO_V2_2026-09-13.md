# HSE Copilot — Plan Maestro V2

**Fecha:** 2026-09-13  
**Repositorio:** `LordKurama01/informe360`  
**Branch base verificada:** `feat/hse-copilot-mobile-p0`  
**HEAD verificado:** `ac7012daf52fa9867d12d79b2ebd925ed439cf5b`  
**Supabase:** `Informe360` (`wvjmsltqrztlvgmayicr`)  
**Principio rector:** evolucionar lo construido; no reiniciar producto, backend ni UX desde cero.

---

## 1. Visión de producto

Informe360 evoluciona a un **sistema operativo HSE** con dos superficies sobre una misma fuente de verdad:

- **HSE Copilot Mobile**: trabajo de campo nativo.
- **HSE Control Desktop**: gestión, análisis, documentación, permisos, incidentes, auditoría e informes.

El producto debe cubrir dos necesidades complementarias:

1. **Memoria operacional**: registrar hallazgos, asignar acciones, alertar, cerrar con evidencia y reutilizar todo en informes.
2. **Asistente técnico HSE**: consultar procedimientos, crear checklists/IPCR/PTW, investigar incidentes y responder con fuentes verificables.

Flujo central existente y obligatorio:

`captura → hallazgo → acción → vencimiento → alerta → evidencia → cierre → auditoría → informe`

Flujo ampliado objetivo:

`procedimiento → IPCR → PTW → tarea → inspección → hallazgo → CAPA → cierre → informe`

Si ocurre un incidente:

`evento → evidencia → investigación → causa → CAPA → seguimiento → cierre`

---

## 2. Regla de alcance: sólo HSE laboral

Las conversaciones/capturas usadas como referencia de usuario se filtran por relevancia profesional.

**Sí entra:**
- trabajo en altura;
- PT/Permisos de Trabajo;
- IPCR/JSA/JHA;
- perforación;
- rescate;
- equipos y certificaciones;
- incidentes;
- checklists;
- procedimientos;
- comunicaciones e informes HSE.

**No entra:**
- casa/planos;
- temas personales;
- cualquier conversación no vinculada al trabajo HSE.

No se inferirán módulos de producto a partir de ruido personal.

---

## 3. Estado real actual — lo que YA tenemos

### 3.1 Backend / Supabase

Proyecto nuevo `Informe360`, PostgreSQL 17, RLS y Storage privados.

Migraciones vivas verificadas:

1. `20260913012835_informe360_fresh_start`
2. `20260913013947_lock_server_only_logs`
3. `20260913014226_protect_owner_role`
4. `20260913020959_mobile_p0_operational_fields`
5. `20260913021812_create_finding_bundle_rpc`
6. `20260913023837_premium_pilot_hardening`
7. `20260913024154_idempotent_mobile_captures`
8. `20260913024742_transactional_finding_close`

Entidades ya disponibles:

- organizaciones y membresías;
- sitios;
- perfiles;
- capturas `field_entries`;
- hallazgos `findings`;
- acciones `smart_actions`;
- evidencias `evidence_files`;
- recordatorios `reminders`;
- informes `reports`;
- relación informe-hallazgo;
- auditoría `finding_events`;
- tokens de dispositivo;
- Storage privado para capturas y evidencias.

### 3.2 Mobile nativo

Existe app Expo/React Native con:

- login/registro;
- onboarding empresa/sitio;
- captura texto/audio/foto;
- subida privada;
- compresión de imágenes;
- cola offline SQLite;
- reintento idempotente;
- revisión humana;
- severidad y prioridad;
- fechas rápidas/manuales;
- bandejas abiertos/vencidos/cerrados;
- búsqueda;
- recordatorios;
- detalle de hallazgo;
- evidencia inicial/seguimiento/cierre;
- cierre/reapertura;
- trazabilidad;
- selección de hallazgos para informe.

### 3.3 Desktop

Existe HSE Control sobre Next.js con:

- misma sesión Supabase;
- misma organización/sitio;
- métricas reales;
- búsqueda y filtros;
- selección múltiple;
- creación de informes desde hallazgos;
- vista imprimible/PDF.

### 3.4 IA

Existe abstracción de proveedor y endpoints HSE preparados para:

- estructuración de hallazgo;
- transcripción;
- análisis de imagen;
- fallback manual.

La captura original siempre se persiste antes de depender de IA.

### 3.5 QA ya alcanzado

En el branch actual se verificó previamente:

- tests HSE;
- TypeScript web;
- ESLint;
- build Next;
- TypeScript mobile;
- export Android Expo.

Esto no reemplaza volver a correr QA antes de cada merge/release.

---

## 4. Lo que FALTA para convertirlo en plataforma HSE completa

Faltan módulos de dominio alrededor del núcleo actual:

1. motor dinámico de formularios;
2. inspecciones y checklists configurables;
3. IPCR/JSA/JHA;
4. Permisos de Trabajo;
5. biblioteca documental + control de revisiones;
6. “Preguntar a HSE” con RAG y citas;
7. incidentes + investigación;
8. CAPA transversal;
9. activos/equipos/certificaciones/QR;
10. capacitación y competencias;
11. normativa estructurada y vencimientos determinísticos;
12. administración/RBAC más granular;
13. deploy público estable;
14. prueba física con usuarios reales;
15. onboarding/comercialización/billing posteriores.

---

## 5. Repos externos: cómo se usan sin reemplazar nuestra arquitectura

### SafetyMP / Autonomous-EHS-Management — ADOPTAR PATRONES/CÓDIGO SELECTIVO

**Licencia:** Apache-2.0.

Reutilizar/adaptar:

- workflow de PTW;
- incidentes;
- CAPA;
- inspecciones;
- observaciones;
- aprobaciones;
- auditoría;
- RBAC;
- estados e idempotencia.

**No copiar:** su backend completo, Drizzle/Postgres, auth o tenancy. Todo se traduce a Supabase/RLS.

### EHSBase — ADOPTAR MODELO FUNCIONAL

**Licencia:** MIT.

Reutilizar conceptos:

- matriz probabilidad × consecuencia;
- Risk Assessment;
- documentos/revisiones;
- incidentes;
- PTW por tipo;
- checklists de trabajo crítico.

**No usar:** su stack PHP/SQLite como backend.

### AuditM-Field — ADOPTAR UX DE CAMPO

**Licencia:** MIT.

Reutilizar:

- checklist en terreno;
- evidencia fotográfica;
- anotación;
- offline-first;
- transición “No cumple → Crear hallazgo”.

### OpenDocuments — ADOPTAR MOTOR/RAG POR PARTES

**Licencia:** MIT.

Reutilizar/adaptar:

- ingestión de documentos;
- chunking;
- búsqueda semántica;
- embeddings;
- citas;
- integración con Ollama/LLM;
- arquitectura de base de conocimiento.

No levantarlo como producto paralelo: integrar su patrón dentro de Informe360.

### React Hook Form — ADOPTAR COMO MOTOR DE FORMULARIOS

**Licencia:** MIT.

Usar en web y, donde convenga, React Native para:

- formularios dinámicos;
- validación;
- arrays de pasos;
- estados de error;
- formularios extensos.

### Benchmark-only

No copiar código de repos sin licencia compatible o licencia no clara. Pueden servir para UX/benchmark únicamente.

---

## 6. Arquitectura objetivo

```text
                           SUPABASE
      Auth · PostgreSQL · Storage · RLS · Audit · Realtime
                               │
              ┌────────────────┴─────────────────┐
              │                                  │
      HSE COPILOT MOBILE                 HSE CONTROL DESKTOP
       Expo / React Native                    Next.js
              │                                  │
              └────────────────┬─────────────────┘
                               │
                     DOMAIN / APPLICATION API
                               │
      ┌───────────────┬────────┼─────────┬──────────────┐
      │               │        │         │              │
  Findings         Forms     PTW      Incidents      Knowledge
  Actions          IPCR      CAPA     RCA            Documents
  Evidence         Checks    Audit    5P/5Why        RAG/Citations
      │                                                  │
      └──────────────────── AI PROVIDER ─────────────────┘
                        Free / Local / Premium
```

Regla: **una sola base, un solo tenancy, un solo historial operacional**.

---

## 7. Módulo 1 — Motor dinámico de formularios

### Objetivo

Evitar programar una pantalla distinta para cada inspección, IPCR o PT.

### Modelo propuesto

- `form_templates`
- `form_template_versions`
- `form_runs`
- `form_answers`

Una versión de plantilla contiene un `schema_json` inmutable una vez publicada.

Tipos de campo iniciales:

- texto corto/largo;
- sí/no;
- cumple/no cumple/N/A;
- número;
- fecha;
- selección simple/múltiple;
- foto/evidencia;
- firma/confirmación;
- matriz de riesgo;
- repetidor de pasos.

### Regla crítica

Una ejecución siempre referencia una **versión fija** de plantilla. Si la plantilla cambia, el registro histórico no cambia.

### Resultado

El mismo motor servirá para:

- checklists;
- IPCR;
- PTW;
- incidentes;
- inspección de equipos;
- capacitaciones/evaluaciones futuras.

---

## 8. Módulo 2 — Inspecciones y checklists

### Entidades

- `inspections`
- `inspection_items` o respuestas vía `form_runs`
- relación a `findings`

### Flujo

`elegir checklist → completar → adjuntar evidencia → detectar no conformidad → crear hallazgo → asignar acción → cerrar`

### Regla

“No cumple” debe poder crear un hallazgo con un clic conservando:

- pregunta original;
- respuesta;
- foto;
- observación;
- inspección de origen;
- usuario/fecha/sitio.

### Primeros checklists

Priorizar los usos reales:

- trabajo en altura;
- sistema anticaídas;
- Pirosalva;
- espacios confinados/rescate;
- matafuegos;
- inspección general de perforación.

---

## 9. Módulo 3 — IPCR / JSA / JHA

### Modelo

- `risk_assessments`
- `risk_assessment_steps`
- `risk_controls`
- `risk_assessment_participants`
- `risk_assessment_events`

### Paso de riesgo

Cada paso contiene:

- tarea;
- peligro;
- consecuencia;
- probabilidad;
- severidad/consecuencia;
- riesgo inicial;
- medidas de control;
- riesgo residual.

### Matriz

Configurable por organización, empezando con 5×5.

### IA

Puede sugerir peligros/controles desde la descripción de tarea, pero:

- no aprueba;
- no firma;
- no reemplaza criterio técnico;
- muestra siempre que es sugerencia.

---

## 10. Módulo 4 — Permisos de Trabajo

### Modelo

- `work_permits`
- `work_permit_roles`
- `work_permit_checks`
- `work_permit_approvals`
- `work_permit_events`
- relación opcional a `risk_assessment_id`

### Estado

`draft → pending_approval → authorized → active → suspended → closed/cancelled`

### Reglas iniciales del procedimiento real

- Autorizante, Solicitante y Ejecutante son roles explícitos.
- Solicitante y Autorizante nunca pueden ser la misma persona en el mismo PT.
- En Perforación, mecánicos y eléctricos no pueden asumir rol de Solicitante.
- Toda violación se bloquea en backend, no sólo en UI.

### Tipos iniciales

- trabajo en caliente;
- altura;
- espacio confinado;
- LOTO/energías;
- excavación;
- líneas/sustancias peligrosas;
- otro configurable.

---

## 11. Módulo 5 — Biblioteca documental y Preguntar a HSE

### Entidades

- `knowledge_documents`
- `knowledge_document_versions`
- `knowledge_chunks`
- `knowledge_citations`

### Documentos

Guardar:

- código;
- título;
- revisión;
- estado;
- fecha de vigencia;
- archivo;
- organización;
- tipo;
- hash;
- historial.

### Revisión

Ejemplo:

`PG-03-SE-29 Rev.07 → archivada`  
`PG-03-SE-29 Rev.08 → vigente`

Por defecto el asistente consulta la revisión vigente, pero permite historia cuando el usuario lo pide.

### Respuestas

Toda respuesta de conocimiento debe clasificarse como:

- **Encontrado en fuente**;
- **Inferencia técnica**;
- **No encontrado**.

Cuando exista fuente, mostrar documento/revisión/sección/página cuando sea posible.

### Regla crítica

El LLM no convierte una inferencia en obligación normativa.

---

## 12. Módulo 6 — Incidentes e investigación

### Entidades

- `incidents`
- `incident_people`
- `incident_evidence`
- `incident_events`
- `incident_investigations`
- `incident_causes`

### Captura inicial

- fecha/hora;
- sitio/equipo;
- tarea;
- personas;
- testigos;
- daño;
- acciones inmediatas;
- evidencia;
- documentos relacionados.

### Investigación

Métodos disponibles:

- 5P;
- 5 Porqués;
- cronología;
- factores causales;
- Ishikawa;
- BowTie.

No todos son obligatorios en todos los eventos.

### Resultado

La investigación puede generar CAPA/acciones usando el mismo motor de seguimiento del producto.

---

## 13. Módulo 7 — CAPA transversal

No crear un segundo sistema de tareas.

`smart_actions` sigue siendo la cola operacional y se amplía para relacionarse con:

- hallazgo;
- inspección;
- incidente;
- PT;
- IPCR;
- auditoría;
- activo.

Crear una capa de enlaces/origen auditada en vez de duplicar acciones por módulo.

Estados mínimos:

`open → in_progress → verification → closed/cancelled`

Cierre CAPA con evidencia y verificación cuando aplique.

---

## 14. Módulo 8 — Activos, equipos, certificaciones y QR

### Entidades

- `assets`
- `asset_categories`
- `asset_events`
- `asset_inspections`
- `asset_certifications`
- `asset_documents`

### Casos iniciales

- arneses;
- cabos/retráctiles;
- Pirosalva;
- pértiga/trípode/rescate;
- detectores;
- matafuegos;
- equipos inspeccionables.

### QR

QR codifica/resuelve `asset_id`, nunca reglas legales.

Al escanear:

`activo → estado → certificado → última inspección → hallazgos → nueva inspección`

---

## 15. Normativa y vencimientos determinísticos

### Regla absoluta

La IA no determina periodicidades legales como fuente de verdad.

Modelo requerido:

`source → version → jurisdiction → validity → requirement → periodicity → calculation → due_date`

Toda regla debe ser versionada y revisable.

Si no existe regla validada:

- permitir fecha manual;
- mostrar “sin regla normativa validada”;
- nunca inventar vencimiento.

---

## 16. IA — estrategia gratuita y premium

### Gratuito/piloto

- reglas determinísticas primero;
- proveedor remoto gratuito cuando haya clave/límite disponible;
- Ollama/Qwen pequeño opcional para tareas cortas;
- transcripción local/remota según benchmark;
- fallback manual obligatorio.

### Premium

Proveedor premium intercambiable para:

- mejor RAG;
- visión;
- redacción compleja;
- informes largos;
- análisis de incidentes;
- automatizaciones.

### Contrato

Ningún módulo de negocio depende de un modelo concreto.

---

## 17. Seguridad

Bloqueantes de cada módulo:

- RLS por organización;
- Storage privado;
- service-role sólo server-side;
- pruebas A≠B por tenant;
- auditoría append-only;
- state machines validadas en backend;
- mutaciones críticas idempotentes;
- no sobrescribir evidencia histórica;
- roles sensibles separados;
- documentos y chunks aislados por organización.

---

## 18. Offline

### Ya existe

Captura offline básica con SQLite y reintentos idempotentes.

### Expandir después

- inspecciones offline;
- respuestas de checklist offline;
- IPCR borrador offline;
- evidencia offline;
- outbox por mutación;
- resolución explícita de conflictos.

No aplicar `last write wins` silencioso a cierres, PT, aprobaciones o documentos vigentes.

---

## 19. Orden de implementación obligatorio

### Fase 0 — Cerrar piloto actual

1. deploy público estable web/API;
2. configurar claves IA cuando estén disponibles;
3. prueba en teléfono real;
4. validar flujo completo con usuario piloto;
5. corregir fricción crítica.

**Exit:** captura real → hallazgo → acción → alerta → evidencia → cierre → informe.

### Fase 1 — Motor de formularios

1. schema/versiones;
2. renderer mobile;
3. renderer desktop/editor;
4. validación;
5. respuestas/evidencia;
6. tests multi-tenant.

**Exit:** crear una plantilla nueva sin escribir una pantalla nueva.

### Fase 2 — Inspecciones/checklists

1. inspecciones;
2. primeras plantillas HSE reales;
3. no conformidad → hallazgo;
4. offline;
5. dashboard.

**Exit:** completar checklist de campo y generar hallazgo trazable.

### Fase 3 — IPCR

1. matriz 5×5 configurable;
2. pasos de tarea;
3. controles;
4. participantes;
5. IA sugerente;
6. exportación/informe.

**Exit:** crear y revisar IPCR real de perforación.

### Fase 4 — PTW

1. modelo/estados;
2. roles;
3. aprobaciones;
4. reglas PG-03-SE-29;
5. checklists por tipo;
6. integración IPCR;
7. auditoría.

**Exit:** PT completo con separación de roles y cierre trazable.

### Fase 5 — Documentos + Preguntar HSE

1. biblioteca;
2. versiones/revisiones;
3. ingestión;
4. chunking/índice;
5. búsqueda híbrida;
6. respuesta con citas;
7. política de “no encontrado”.

**Exit:** responder preguntas sobre procedimiento vigente con fuente verificable.

### Fase 6 — Incidentes + investigación + CAPA

1. intake;
2. evidencia;
3. 5P;
4. 5 Why;
5. cronología/factores;
6. Ishikawa/BowTie opcionales;
7. CAPA;
8. informe preliminar.

**Exit:** incidente desde evento hasta acciones correctivas y cierre.

### Fase 7 — Activos/certificaciones/QR

1. activos;
2. categorías;
3. QR;
4. inspecciones;
5. documentos/certificados;
6. reglas determinísticas;
7. alertas.

**Exit:** escanear equipo y ver historial/estado/inspección/certificación.

### Fase 8 — Desktop empresarial

- administración de plantillas;
- usuarios/roles;
- métricas avanzadas;
- auditoría;
- documentos;
- activos;
- PTW;
- incidentes;
- reportes/exportación.

### Fase 9 — Comercialización

- demo estable;
- tenant demo resettable;
- onboarding;
- límites free/pro;
- telemetría de uso;
- pricing;
- billing sólo cuando exista validación comercial.

---

## 20. Qué NO hacer todavía

No priorizar antes de cerrar las fases anteriores:

- visión CCTV/EPP en tiempo real;
- predicción de accidentes;
- WhatsApp complejo;
- marketplace;
- integraciones ERP profundas;
- billing avanzado;
- múltiples bases/backend paralelos;
- copiar repos completos sin necesidad;
- llenar el producto de módulos no usados por técnicos reales.

---

## 21. QA y Definition of Done global

Cada módulo debe tener:

1. test de dominio/state machine;
2. test de RLS multi-tenant;
3. test de permisos;
4. prueba de idempotencia en mutaciones críticas;
5. TypeScript/lint/build;
6. prueba mobile cuando corresponda;
7. prueba manual de happy path;
8. prueba manual de fallo de red/IA cuando aplique;
9. auditoría de cambios;
10. documentación actualizada.

No se considera terminado un módulo sólo porque la UI existe.

---

## 22. Métricas de piloto

Medir desde los primeros usuarios:

- tiempo para registrar hallazgo;
- % de capturas que llegan a hallazgo;
- % de hallazgos con responsable;
- % con vencimiento;
- acciones cerradas en plazo;
- tiempo medio de cierre;
- nº de inspecciones por usuario;
- nº de preguntas HSE con fuente válida;
- nº de correcciones manuales a sugerencias IA;
- errores offline/sync;
- recurrencia semanal.

---

## 23. Objetivo comercial mínimo

El producto se puede ofrecer en piloto cuando un cliente puede demostrar, sin mocks como fuente de verdad:

1. entrar con su empresa;
2. registrar desde teléfono;
3. inspeccionar;
4. generar hallazgo;
5. asignar acción;
6. recibir seguimiento;
7. cerrar con evidencia;
8. consultar un procedimiento con fuente;
9. crear un IPCR;
10. abrir/cerrar un PT;
11. registrar un incidente;
12. obtener informe y trazabilidad.

Ese es el umbral de **plataforma HSE vendible**, no la cantidad de pantallas.

---

## 24. Próximo movimiento

El próximo bloque de desarrollo debe ser **Fase 1: Motor dinámico de formularios**, manteniendo el piloto actual operativo.

Razón:

- habilita checklists;
- se reutiliza en IPCR;
- se reutiliza en PTW;
- se reutiliza en incidentes;
- reduce drásticamente código duplicado;
- permite que futuras plantillas sean configurables sin programar nuevas pantallas.

Después: **Inspecciones → IPCR → PTW → Documentos/RAG → Incidentes/CAPA → Activos/QR**.
