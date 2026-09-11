# HSE Copilot — Plan Maestro

**Fecha:** 2026-09-11  
**Repositorio:** `LordKurama01/informe360`  
**Estado base verificado:** `docs/INFORME360_ESTADO_REAL_2026-09-11.md`  
**Principio rector:** evolucionar Informe360; no rehacerlo desde cero.

---

## 1. Decisión de producto

Informe360 evoluciona a **HSE Copilot** con dos experiencias separadas sobre una única fuente de verdad:

1. **HSE Copilot Mobile** — aplicación nativa, diseñada primero para trabajo de campo.
2. **HSE Control Desktop** — aplicación de escritorio/web para administración, análisis, normativa, activos, auditoría e informes.

No se construirá una web responsive y luego se “adaptará” a teléfono. La experiencia móvil se diseña como producto nativo desde el inicio.

### Orden obligatorio

`Mobile nativo → backend operacional → piloto real → activos/normativa/offline → desktop`

El desktop actual de Informe360 se conserva como activo y base para reporting/gestión futura. No se elimina ni se reescribe durante P0.

---

## 2. Visión del producto

HSE Copilot debe convertirse en la memoria operacional de un técnico o ingeniero HSE.

Flujo objetivo:

`capturar → entender → persistir → asignar → vencer → alertar → resolver → evidenciar → auditar → informar`

Ejemplo de uso real:

> “Sala de bombas. Encontré una pérdida en una manguera hidráulica. Que mantenimiento la revise mañana.”

Resultado esperado:

- conservar audio/texto original;
- identificar ubicación;
- identificar elemento;
- estructurar hallazgo;
- sugerir acción;
- identificar responsable si fue expresado;
- resolver fecha relativa de usuario;
- pedir confirmación antes de guardar datos ambiguos;
- persistir;
- mostrar en Hoy / Próximos / Vencidos;
- notificar;
- permitir cierre con evidencia;
- incorporar el hallazgo a un informe posterior.

---

## 3. Principios no negociables

### 3.1 Mobile nativo primero

La app móvil debe aprovechar capacidades nativas:

- micrófono;
- cámara;
- notificaciones push;
- almacenamiento local;
- cola offline;
- sincronización;
- ubicación cuando sea necesaria;
- QR en fases posteriores;
- biometría si aporta valor posteriormente.

### 3.2 El usuario de campo no administra el sistema

Mobile optimiza:

- registrar;
- consultar;
- actuar;
- recibir alertas;
- adjuntar evidencia;
- cerrar.

Desktop optimiza:

- configurar;
- administrar usuarios/empresas/sitios;
- auditar;
- filtrar en volumen;
- gestionar normativa;
- gestionar activos;
- analizar;
- generar informes;
- exportar.

No se deben reutilizar pantallas completas entre mobile y desktop sólo para ahorrar desarrollo.

### 3.3 Una única fuente de verdad

Supabase/PostgreSQL será la fuente operacional cuando el proyecto real quede identificado/provisionado.

No crear una segunda base ni una arquitectura paralela.

### 3.4 IA intercambiable

Toda IA se consume detrás de una interfaz de proveedor.

Objetivo conceptual:

```ts
interface AIProvider {
  structureFieldEntry(input: FieldEntryInput): Promise<StructuredFindingDraft>;
  draftReport(input: ReportDraftInput): Promise<GeneratedReportDraft>;
}
```

La app móvil nunca debe depender directamente de OpenAI, Gemini, Ollama o un modelo específico.

### 3.5 La normativa no depende del LLM

El LLM no calcula libremente periodicidades legales ni vencimientos normativos.

La IA puede:

- clasificar;
- extraer datos;
- explicar;
- sugerir una regla a revisar.

El motor determinístico debe calcular:

`fuente → versión → jurisdicción → vigencia → requisito → periodicidad → método de cálculo → vencimiento`

---

## 4. Arquitectura objetivo

```text
                       ┌─────────────────────────┐
                       │     SUPABASE / POSTGRES │
                       │ Auth · DB · Storage     │
                       │ RLS · Realtime · Audit  │
                       └────────────┬────────────┘
                                    │
                     ┌──────────────┴──────────────┐
                     │                             │
          ┌──────────▼──────────┐       ┌──────────▼──────────┐
          │ HSE COPILOT MOBILE │       │ HSE CONTROL DESKTOP │
          │ React Native / Expo│       │ Next.js existente   │
          │ P0                 │       │ P2                   │
          └──────────┬──────────┘       └──────────┬──────────┘
                     │                             │
                     └──────────────┬──────────────┘
                                    │
                          ┌─────────▼─────────┐
                          │ Application/API   │
                          │ rules + AI router │
                          └─────────┬─────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    │                               │
             ┌──────▼──────┐                ┌───────▼────────┐
             │ Local/Free  │                │ Premium        │
             │ Ollama/Qwen │                │ OpenAI         │
             │ whisper.cpp │                │ future models  │
             └─────────────┘                └────────────────┘
```

### Regla de arquitectura

El proveedor local/premium modifica calidad, latencia, volumen y funciones de IA. No modifica permisos, normativa, vencimientos, integridad de datos ni seguridad.

---

## 5. Stack móvil objetivo

### Base

- React Native.
- Expo Development Build.
- Expo Router.
- TypeScript.
- Supabase JS.

### Capacidades nativas previstas

- audio: módulos oficiales Expo;
- cámara: `expo-camera`;
- notificaciones: `expo-notifications`;
- archivos/cache: módulos oficiales Expo;
- almacenamiento offline: `expo-sqlite`;
- secure storage de sesión/tokens: `expo-secure-store`;
- QR: capacidad de barcode de cámara cuando entre P1;
- ubicación: módulo Expo sólo cuando el caso de uso lo justifique.

### Restricción

No basar la app móvil en WebView, PWA o componentes exclusivamente DOM como núcleo operacional.

---

## 6. P0 — Piloto “memoria HSE”

El P0 debe resolver un circuito completo y pequeño antes de agregar módulos.

### Pantalla inicial

La aplicación abre en una superficie operacional simple:

```text
┌──────────────────────────────┐
│ Hola, Luis                   │
│ Sitio actual                 │
│                              │
│          🎙️                 │
│        REGISTRAR             │
│                              │
│    📷 Foto   ✍️ Escribir     │
│                              │
│ Hoy                          │
│ 🔴 vencidos                  │
│ 🟠 próximos                  │
│ 🟢 cerrados recientes        │
└──────────────────────────────┘
```

### P0 debe permitir

1. autenticarse;
2. seleccionar/recordar organización y sitio;
3. registrar por texto;
4. registrar audio real;
5. adjuntar foto real;
6. preservar la captura cruda;
7. estructurar un borrador de hallazgo;
8. confirmar/corregir borrador;
9. asignar responsable;
10. asignar vencimiento manual o extraído de una frase del usuario;
11. guardar;
12. ver Hoy / Próximos / Vencidos / Cerrados;
13. recibir al menos un canal real de recordatorio;
14. abrir el hallazgo desde otra sesión/dispositivo;
15. agregar evidencia de cierre;
16. cerrar/reabrir según permisos;
17. incorporar hallazgos seleccionados a Informe360.

### P0 no debe incluir todavía

- dashboard empresarial grande;
- builder genérico de formularios;
- facturación automática;
- WhatsApp;
- motor normativo completo;
- QR productivo;
- inventario completo de activos;
- offline complejo con resolución avanzada de conflictos;
- analítica predictiva;
- visión IA obligatoria en cada foto.

---

## 7. Modelo de datos mínimo

Las tablas definitivas se implementarán sobre la base Supabase real una vez identificada/provisionada. El modelo lógico P0 queda fijado así.

### Organización y acceso

- `organizations`
- `organization_memberships`
- `sites`

### Captura

`field_entries`

Campos mínimos:

- `id`
- `organization_id`
- `site_id`
- `created_by`
- `capture_type` (`text | audio | photo | mixed`)
- `raw_text`
- `audio_storage_path`
- `captured_at`
- `created_at`

### Hallazgo

`findings`

Campos mínimos:

- `id`
- `organization_id`
- `site_id`
- `source_field_entry_id`
- `title`
- `description`
- `category`
- `severity`
- `status`
- `responsible_user_id`
- `due_at`
- `created_by`
- `created_at`
- `closed_at`
- `closed_by`

Estados P0:

`open → in_progress → closed`

`overdue` se calcula por fecha y estado; no debe guardarse como estado irreconciliable.

### Evidencia

`evidence_files`

- `id`
- `organization_id`
- `finding_id`
- `storage_path`
- `mime_type`
- `byte_size`
- `sha256` cuando corresponda;
- `uploaded_by`
- `created_at`

### Recordatorios

`reminders`

- `id`
- `organization_id`
- `finding_id`
- `scheduled_for`
- `channel`
- `status`
- `sent_at`
- `failure_reason`

### Informe

Relación muchos-a-muchos entre hallazgos y reportes para no duplicar información operacional.

---

## 8. IA: gratuito primero, premium después

### Plan gratuito/piloto

Objetivo: validar utilidad y recurrencia sin obligar al producto a pagar inferencia por cada interacción.

Proveedor inicial candidato:

- Ollama como runtime local;
- Qwen pequeño para extracción/estructuración;
- whisper.cpp para transcripción cuando el benchmark real sea aceptable;
- reglas determinísticas para fechas explícitas y validación;
- OCR opcional server-side, no bloqueante de P0.

### Restricción de infraestructura verificada

Servidor conectado auditado el 2026-09-11:

- 4 vCPU;
- 7.6 GiB RAM;
- ~4.8 GiB disponibles al momento de la medición;
- sin GPU NVIDIA.

Por lo tanto:

- un modelo local pequeño puede evaluarse;
- no se asume rendimiento aceptable hasta medir latencia real;
- no usar visión pesada local como dependencia crítica de P0;
- no permitir que una inferencia lenta bloquee la persistencia de la captura original.

### Premium

Cuando exista membresía/pago:

- OpenAI como proveedor premium inicial;
- mejor extracción;
- mayor contexto;
- visión avanzada;
- informes complejos;
- automatizaciones más intensivas;
- límites superiores.

### Regla de fallback

Si IA falla, la captura original se guarda igual y el usuario puede completar el hallazgo manualmente.

Nunca perder una observación de campo por caída de IA.

---

## 9. Seguridad y multiempresa

Bloqueante P0:

- autenticación real;
- RLS habilitado;
- políticas por `organization_id` + membership;
- Storage privado por organización;
- service role sólo en servidor;
- ningún secreto premium en la app móvil;
- auditoría de operaciones críticas;
- pruebas de aislamiento entre tenants.

Un usuario de Empresa A no debe poder leer, inferir ni enumerar datos de Empresa B.

---

## 10. Recordatorios y notificaciones

P0 debe tener un mecanismo real, no sólo una fecha guardada.

Diseño:

1. persistir `due_at`;
2. generar/sincronizar `reminders`;
3. worker/cron consulta recordatorios vencibles;
4. servicio de notificación envía push;
5. resultado queda registrado;
6. UI muestra vencido aunque el push falle.

La verdad del vencimiento vive en la base; la notificación es un canal, no la fuente de verdad.

---

## 11. Evidencia y cierre

Un cierre válido P0 debe poder contener:

- comentario de cierre;
- foto/documento opcional según política;
- usuario;
- timestamp;
- trazabilidad del hallazgo original.

No sobrescribir el texto/captura original al editar el hallazgo estructurado.

---

## 12. Offline

### P0

Persistencia local básica de borradores y capturas pendientes.

### P1

Offline-first real:

- SQLite local;
- outbox de mutaciones;
- IDs cliente estables;
- retries idempotentes;
- sync al recuperar red;
- política explícita de conflictos.

Primera regla de conflicto:

- capturas nuevas: append-only;
- evidencia: append-only;
- cambios de estado: servidor valida transición y versión;
- no hacer “last write wins” silencioso para cierres o datos críticos.

---

## 13. Activos y normativa — P1

Después de validar el circuito P0 se incorporan:

### Activos

- matafuegos;
- equipos;
- EPP;
- instrumentos;
- elementos inspeccionables.

Entidad base:

`asset → site → category → identifier → status → evidence/history`

### QR

QR resuelve `asset_id` y abre el historial del activo.

### Normativa estructurada

Entidades separadas para:

- fuente;
- versión;
- jurisdicción;
- vigencia;
- requisito;
- periodicidad;
- cálculo;
- evidencia legal/técnica;
- revisión humana.

Las alertas 30/15/7/1 días sólo se habilitan cuando la regla determinística está versionada y validada.

---

## 14. Desktop — P2

El desktop no es una copia ampliada de mobile.

Debe especializarse en:

- command center;
- tablas y filtros masivos;
- gestión de organizaciones/sitios/usuarios;
- acciones correctivas;
- activos;
- normativa;
- vencimientos;
- inspecciones;
- reportes;
- auditoría;
- métricas;
- exportaciones.

El Next.js existente de Informe360 se reutiliza/evoluciona para esta capa.

---

## 15. Reutilización de Informe360

Se conserva y evoluciona:

- generador de informes;
- orquestación multiagente útil;
- modelos existentes de reportes;
- normativa/catalogación como antecedente;
- smart actions como antecedente;
- PDF/exportación;
- UI desktop aprovechable;
- tracking/logging donde corresponda.

Se reemplazan mocks/hardcodes únicamente cuando el circuito real esté disponible.

---

## 16. Reutilización open source

El detalle, licencia y decisión de cada repo vive en:

`docs/HSE_COPILOT_REPOS_Y_COMPONENTES_2026-09-11.md`

Reglas:

- sólo copiar/modificar código con licencia compatible verificada;
- registrar commit/tag de origen antes de copiar;
- preservar notices requeridos;
- no incorporar AGPL al producto propietario sin decisión legal/comercial explícita;
- repos sin licencia clara son benchmark, no fuente de código;
- preferir módulos oficiales Expo para capacidades nativas antes que wrappers pequeños sin mantenimiento.

---

## 17. Fases de ejecución

### Fase 0 — Recuperar plataforma y asegurar base

**Gate:** no empezar persistencia productiva hasta identificar/provisionar correctamente Supabase/runtime.

Entregables:

- runtime confirmado;
- Supabase de HSE identificado o provisionado conscientemente;
- CI activo;
- entorno dev/staging;
- auth funcionando;
- RLS tenant-safe;
- Storage privado.

### Fase 1 — Shell móvil nativo

Entregables:

- app Expo;
- navegación nativa;
- login;
- organización/sitio;
- Home mobile;
- pantalla Registrar.

### Fase 2 — Captura real

Entregables:

- texto;
- audio;
- cámara;
- upload resiliente;
- captura original persistida;
- draft estructurado.

### Fase 3 — Hallazgo operacional

Entregables:

- confirmar/editar;
- responsable;
- vencimiento;
- Hoy / Próximos / Vencidos / Cerrados;
- detalle;
- estado.

### Fase 4 — Alertas y cierre

Entregables:

- push real;
- recordatorios;
- evidencia;
- cierre;
- trazabilidad.

### Fase 5 — Informe360 integrado

Entregables:

- seleccionar hallazgos;
- generar informe existente con datos reales;
- preservar vínculo hallazgo ↔ informe.

### Fase 6 — Piloto Luis

Gate de salida:

- registrar observaciones reales durante uso de campo;
- volver a abrirlas otro día;
- recibir recordatorios;
- cerrar con evidencia;
- generar al menos un informe desde hallazgos reales.

### Fase 7 — P1

- activos;
- QR;
- offline robusto;
- periodicidad normativa;
- alertas normativas;
- inspecciones recurrentes.

### Fase 8 — P2

- desktop operacional completo;
- reporting/analytics;
- administración avanzada.

---

## 18. Modelo comercial inicial

### Piloto / Free

Debe ser suficientemente bueno para validar retención:

- captura;
- hallazgos;
- responsables;
- vencimientos manuales;
- evidencia;
- alertas básicas;
- IA local limitada cuando responda dentro del SLA definido.

### Membresía Pro

Puede monetizar:

- IA premium;
- visión avanzada;
- generación avanzada de informes;
- mayor almacenamiento;
- más organizaciones/sitios;
- automatizaciones;
- analítica;
- reglas normativas avanzadas;
- exports/integraciones;
- historial extendido según política comercial.

La seguridad y exactitud normativa no se degradan en Free.

---

## 19. Métricas del piloto

Medir desde P0:

- capturas por usuario/semana;
- % capturas confirmadas como hallazgo;
- tiempo captura → guardado;
- % hallazgos con responsable;
- % hallazgos con vencimiento;
- % recordatorios entregados;
- % hallazgos cerrados;
- tiempo medio de cierre;
- % cierres con evidencia;
- hallazgos reutilizados en informe;
- usuarios activos semanales;
- retención del piloto.

No optimizar una métrica de IA antes de validar que el técnico vuelve a usar el producto.

---

## 20. Definition of Done del P0

P0 está terminado sólo si:

1. la app es React Native/Expo y corre como app nativa de desarrollo/distribución;
2. un usuario real inicia sesión;
3. registra texto, audio y foto;
4. la captura original queda persistida;
5. un hallazgo se guarda en base real;
6. RLS impide acceso cruzado entre organizaciones;
7. puede verse desde otra sesión/dispositivo;
8. aparece correctamente en Hoy/Próximos/Vencidos/Cerrados;
9. existe recordatorio real;
10. puede cerrarse con evidencia persistente;
11. el cierre queda auditado;
12. el hallazgo puede incorporarse a un informe Informe360;
13. tests, typecheck, lint y build están verdes en CI;
14. no depende de datos demo para completar el flujo.

---

## 21. Riesgos principales

### Runtime/Supabase no identificado

Mitigación: recuperar primero la fuente de verdad; no crear bases duplicadas por impulso.

### IA local lenta

Mitigación: benchmark, timeouts, captura-first, fallback manual y provider intercambiable.

### Scope creep

Mitigación: no abrir activos/QR/normativa completa hasta cerrar el circuito piloto.

### UI móvil convertida en mini-desktop

Mitigación: una acción primaria por pantalla, navegación corta, targets táctiles grandes y uso con una mano.

### Datos HSE sensibles

Mitigación: RLS, Storage privado, audit trail, mínimo privilegio, secretos sólo server-side.

### Normativa incorrecta

Mitigación: reglas determinísticas versionadas y revisión humana; IA no inventa periodicidades.

---

## 22. Decisión final

**No crear otro producto.**

Informe360 se convierte en la base del ecosistema HSE Copilot.

El primer producto nuevo visible será **HSE Copilot Mobile**, nativo, operativo y centrado en campo.

La primera victoria comercial no es “tener muchos módulos”: es que un técnico registre un hallazgo real en segundos, el sistema lo recuerde, lo acompañe hasta el cierre y lo reutilice automáticamente para demostrar el trabajo realizado.
