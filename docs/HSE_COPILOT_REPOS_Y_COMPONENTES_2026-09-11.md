# HSE Copilot — Repositorios y Componentes

**Fecha de revisión:** 2026-09-11  
**Objetivo:** registrar qué proyectos externos se adoptan, evalúan o descartan para ahorrar desarrollo sin comprometer arquitectura, licencias ni mantenibilidad.

Este documento es vinculante para P0/P1 salvo una revisión técnica posterior.

---

## 1. Regla general

No se va a “pegar” un repo entero dentro de Informe360.

Cada incorporación debe responder una pregunta concreta:

- ¿qué problema resuelve?
- ¿qué parte exacta se reutiliza?
- ¿qué licencia tiene?
- ¿es compatible con mobile nativo?
- ¿qué mantenimiento introduce?
- ¿se integra sin crear una segunda arquitectura?

Estados posibles:

- **ADOPTAR**: dependencia/base aprobada.
- **REFERENCIA DE DOMINIO**: se estudia y se pueden adaptar patrones/código compatible de forma selectiva.
- **EVALUAR**: candidato, requiere benchmark/prueba antes de entrar.
- **P1/P2**: no bloquea P0.
- **NO ADOPTAR**: descartado para la arquitectura actual.

---

## 2. Repos aprobados

### 2.1 `expo/expo`

**URL:** https://github.com/expo/expo  
**Licencia:** MIT  
**Estado:** **ADOPTAR — P0**

### Uso

Base del cliente móvil nativo:

- React Native/Expo;
- Expo Router;
- audio;
- cámara;
- notificaciones;
- archivos;
- SQLite;
- secure storage;
- ubicación/QR cuando entren en alcance.

### Decisión

Preferir módulos oficiales Expo antes que wrappers de terceros para capacidades nativas fundamentales.

### Razón

Reduce riesgo de mantenimiento, evita una app basada en DOM/WebView y mantiene TypeScript/React como lenguaje común con Informe360.

---

### 2.2 `supabase/supabase-js`

**URL:** https://github.com/supabase/supabase-js  
**Licencia:** MIT  
**Estado:** **ADOPTAR — P0**

### Uso

Cliente oficial para:

- Auth;
- PostgreSQL/Data API;
- Realtime cuando aporte valor;
- Storage;
- Functions.

### Decisión

Se utiliza tanto en la app móvil como en servicios web compatibles, siempre con RLS y sin exponer service role al cliente.

### Restricción

No provisionar una base nueva de HSE hasta cerrar la recuperación del runtime/Supabase actual o decidir conscientemente que debe crearse.

---

### 2.3 `SafetyMP/Autonomous-EHS-Management`

**URL:** https://github.com/SafetyMP/Autonomous-EHS-Management  
**Licencia:** Apache-2.0  
**Estado:** **REFERENCIA DE DOMINIO PRIORITARIA — P0/P1**

### Qué aporta

Tiene implementados/modelados conceptos que HSE Copilot necesita:

- observaciones de seguridad;
- incidentes;
- CAPA/acciones correctivas;
- inspecciones;
- evidencia;
- responsables;
- vencimientos;
- tareas;
- auditoría;
- RBAC;
- lifecycle de acciones.

### Qué reutilizar

Principalmente:

- modelos de dominio;
- transiciones de estado;
- nomenclatura consistente;
- patrones de evidencia;
- diseño de CAPA;
- ideas de escalation/follow-up;
- test cases y edge cases.

### Qué NO reutilizar como base

- no sustituir Supabase por su stack Postgres/Drizzle;
- no adoptar su auth completa;
- no copiar el frontend web como app móvil;
- no convertir HSE Copilot en un fork.

### Decisión

Usarlo para ahorrar diseño de dominio y errores conocidos, adaptando lo útil al modelo Supabase/Informe360.

---

### 2.4 `Artaeon/1300io`

**URL:** https://github.com/Artaeon/1300io  
**Licencia:** MIT  
**Estado:** **REFERENCIA UX/INSPECCIONES — P0/P1**

### Qué aporta

- producto mobile-first;
- flujo de inspección;
- captura de defectos;
- evidencia fotográfica;
- historial;
- reportes/PDF;
- audit trail.

### Decisión

Usarlo como benchmark y fuente selectiva de patrones de UX/data flow. No importar su backend ni su arquitectura completa.

---

### 2.5 `ggml-org/whisper.cpp`

**URL:** https://github.com/ggml-org/whisper.cpp  
**Licencia:** MIT  
**Estado:** **EVALUAR PARA ADOPTAR — P0**

### Uso candidato

Transcripción local/self-hosted de audios de campo.

### Criterio de entrada

Debe pasar benchmark en el servidor real:

- latencia de audio corto;
- RAM;
- CPU;
- concurrencia mínima;
- calidad en español rioplatense/ruido de campo.

### Restricción

La grabación debe guardarse aunque la transcripción falle o tarde demasiado.

---

### 2.6 `ollama/ollama`

**URL:** https://github.com/ollama/ollama  
**Licencia:** MIT  
**Estado:** **EVALUAR PARA ADOPTAR — P0**

### Uso candidato

Runtime local para un modelo pequeño de extracción estructurada.

Ejemplo de tarea:

```text
Entrada:
“Sala de bombas. Manguera con pérdida. Mantenimiento revisar mañana.”

Salida:
{
  "location": "Sala de bombas",
  "assetOrElement": "Manguera",
  "finding": "Pérdida",
  "action": "Revisar",
  "responsible": "Mantenimiento",
  "dueExpression": "mañana"
}
```

### Restricción

Servidor verificado: 4 vCPU, 7.6 GiB RAM, sin GPU.

Ollama se incorpora sólo si el modelo elegido cumple un SLA razonable para textos breves sin degradar otros servicios.

No se usarán modelos locales grandes de visión como dependencia crítica de P0.

---

### 2.7 Qwen pequeño vía Ollama

**Repositorio/familia:** https://github.com/QwenLM/Qwen3  
**Estado:** **MODELO CANDIDATO — EVALUAR**

### Uso

Extracción de JSON estructurado y clasificación breve.

### Regla

Antes de fijar un modelo en producción se debe registrar:

- nombre exacto;
- versión/tag/digest;
- cuantización;
- licencia exacta del artefacto de modelo;
- benchmark en nuestro servidor;
- prompts y tests contractuales.

No se ata la aplicación a Qwen; vive detrás de `AIProvider`.

---

### 2.8 `naptha/tesseract.js`

**URL:** https://github.com/naptha/tesseract.js  
**Licencia:** Apache-2.0  
**Estado:** **EVALUAR — P1 / opcional P0**

### Uso posible

OCR server-side/browser compatible para leer:

- placas;
- etiquetas;
- números de serie;
- fechas impresas;
- texto visible en evidencia.

### Decisión

No bloquear P0 con OCR. La foto vale como evidencia aunque no pueda extraerse texto.

En mobile nativo no se lo tratará como módulo nativo central; puede procesarse en backend si el beneficio justifica la latencia.

---

### 2.9 `openai/openai-node`

**URL:** https://github.com/openai/openai-node  
**Licencia:** Apache-2.0  
**Estado:** **ADOPTAR CUANDO ENTRE PREMIUM**

### Uso

Proveedor premium server-side para:

- estructuración avanzada;
- visión;
- reportes complejos;
- razonamiento con mayor contexto.

### Restricción

Nunca incluir API keys en la app React Native.

OpenAI será un provider detrás del mismo contrato que el proveedor local.

---

## 3. Componentes que dejamos de adoptar por el giro a mobile nativo

La decisión mobile nativa cambia varias recomendaciones hechas durante la exploración inicial.

### `wmik/use-media-recorder`

**URL:** https://github.com/wmik/use-media-recorder  
**Licencia:** MIT  
**Estado:** **NO ADOPTAR PARA MOBILE**

Razón: está basado en MediaRecorder/web. Para React Native se prefieren módulos oficiales Expo de audio.

Puede seguir sirviendo como referencia para una futura captura web, pero no para P0 móvil.

---

### `GoogleChrome/workbox`

**URL:** https://github.com/GoogleChrome/workbox  
**Licencia:** MIT  
**Estado:** **NO ADOPTAR PARA OFFLINE MOBILE**

Razón: Workbox resuelve service workers/PWA. HSE Copilot Mobile usará almacenamiento nativo/SQLite y una outbox de sincronización.

Puede ser útil para el desktop/PWA futuro, no para P0 móvil.

---

### `nimiq/qr-scanner`

**URL:** https://github.com/nimiq/qr-scanner  
**Licencia:** MIT  
**Estado:** **NO ADOPTAR PARA MOBILE**

Razón: es una solución web. Expo Camera ya cubre barcode scanning nativo cuando QR entre en P1.

---

### `web-push-libs/web-push`

**URL:** https://github.com/web-push-libs/web-push  
**Estado:** **NO ADOPTAR PARA PUSH MOBILE P0**

Razón: Web Push no debe ser la capa principal de una app nativa. Para P0 se evaluará `expo-notifications` y el servicio de push apropiado.

Puede conservar utilidad para notificaciones web del desktop más adelante.

---

## 4. Repos que sólo sirven como benchmark

### BeaconHS

**Estado:** **SOLO BENCHMARK**

Razón principal: licencia AGPL-3.0 incompatible con la estrategia de copiar/integrar código dentro de un SaaS propietario sin asumir sus obligaciones.

Sirve para estudiar producto, módulos y UX.

---

### Shelf

**Estado:** **SOLO BENCHMARK**

Buen referente para activos/QR, pero no se incorpora código AGPL al producto sin revisión legal/comercial explícita.

---

### HSE Digital Toolkit

**Estado:** **SOLO BENCHMARK mientras no exista licencia compatible inequívoca verificada**

Sirve para observar formularios, PWA y operación HSE, no para copiar código.

---

### Maintain-IQ

**Estado:** **SOLO BENCHMARK mientras no exista licencia utilizable verificada**

Conceptualmente útil para activo → falla → evidencia → historial, pero no se adopta código sin licencia clara.

---

## 5. Mapa de adopción por fase

### P0 — obligatorio/candidato inmediato

- `expo/expo` — **ADOPTAR**.
- `supabase/supabase-js` — **ADOPTAR**.
- `SafetyMP/Autonomous-EHS-Management` — **REFERENCIA DE DOMINIO**.
- `Artaeon/1300io` — **REFERENCIA UX**.
- `ggml-org/whisper.cpp` — **BENCHMARK/POC**.
- `ollama/ollama` — **BENCHMARK/POC**.
- Qwen pequeño — **BENCHMARK/POC**.

### P1

- `naptha/tesseract.js` si OCR aporta valor real.
- módulos Expo de QR/offline/localización.
- activos y normativa estructurada.

### Premium

- `openai/openai-node` server-side.

### P2 desktop

Reevaluar:

- Workbox si el desktop requiere PWA/offline web;
- web-push si se necesitan notificaciones web.

---

## 6. Protocolo antes de incorporar código externo

Para cada repo/componente que pase de evaluación a producción:

1. registrar URL;
2. registrar commit/tag/digest exacto;
3. verificar licencia en el commit/tag elegido;
4. revisar SECURITY/advisories conocidos;
5. determinar si se instala como dependencia o se adapta código;
6. documentar archivos/patrones adaptados;
7. conservar notices requeridos;
8. agregar tests de integración propios;
9. medir tamaño/performance si afecta mobile;
10. agregarlo a esta tabla con estado final.

---

## 7. Decisión ejecutiva

El stack P0 no necesita diez frameworks.

La combinación prioritaria queda:

```text
Informe360 existente
+ React Native / Expo
+ Supabase
+ patrones de dominio de Autonomous EHS
+ patrones UX de 1300.io
+ IA local pequeña sólo si el benchmark la aprueba
```

Todo lo demás entra únicamente cuando desbloquea un caso de uso concreto.
