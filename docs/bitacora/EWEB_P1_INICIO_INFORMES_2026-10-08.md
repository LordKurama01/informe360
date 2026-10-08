# EWEB.P1 — Inicio e Informes, partes 1.1–1.5

Fecha de trabajo: 2026-10-08 (Argentina). Rama: `feat/hse-e1-offline-resilience-2026-10-08`. PR #3 **draft**. Sitio: [Web HSE QA](https://informe360-hse-web-qa.onrender.com/app/hse). Producción `feat/hse-phases-1-5` **no se modifica**.

## Objetivo aceptado
Un solo panel web HSE para escritorio, con navegación y marca consistentes; informes basados en datos auténticos de Supabase y ninguna acción pública para sembrar datos ficticios. La app nativa es otro producto de interfaz y no se sustituye por Expo Web.

## Avance por partes

| Parte | Descripción y evidencia | Estado |
|---|---|---|
| EWEB.P1.1 | Auditoría de `/app/hse` vs `/app/reports`: se encontró CSS legacy y lista inventada de informes. | VALIDADA |
| EWEB.P1.2 | Quitar botón «Demo» y llamada `seed_hse_demo` de la interfaz HSE. Test `test:hse:reports`. | VALIDADA EN QA |
| EWEB.P1.3 | Crear `/app/hse/reports` usando `HseControl mode="reports"`, RLS y filtros por empresa/sitio, vacío auténtico. Render `dep-db3qf0ad0e5s73b6jh4g` LIVE. | VALIDADA EN QA; revisión visual pendiente |
| EWEB.P1.4 | Medir datos correctamente: consulta cargando/error/ok, indicador de cierre «—» si no hay cierres, no presentar cero como resultado si falló Supabase, actualización capturando excepciones. | IMPLEMENTADA; retest Render en curso |
| EWEB.P1.5 | Gate QA técnico, compatibilidad rutas, verificación visual 1366/1440/1920 y 360–430 px con sesión real. | PENDIENTE |

## Entregables EWEB.P1.4
- `src/shared/hse/dashboard-metrics.ts`: lógica pura que devuelve «—» cuando faltan datos y solo calcula porcentaje de cierre con denominador válido.
- `src/blocks/hse-control/HseControl.tsx`: lectura explícita de estado `loading/ready/error`; mismo estado tanto en Inicio como en Informes; botón «Actualizar» captura fallos; estados vacíos solo ante consulta exitosa.
- `src/blocks/hse-control/HseControl.module.css`: estados diferenciados de sincronización, sin promesa falsa de conectividad.
- `scripts/hse-dashboard-metrics.test.mjs`: pruebas de unidades del KPI, errores, cero válido y estados de interfaz; agregadas a `npm run qa`.
- Commits relevantes: `13c8a37`, `d09e461`, `181a72d`, `0f89f62`, `6377f72`. Registro de ejecución en `REGISTRO.md`.

## Gate actual
Render Web QA `srv-db3pmdbncjis73bbrvig`; deploy `dep-db3qsml9fdbs73eslmf0` sobre SHA funcional `6377f727ea144c2cc4865aae313f88e66132e83a` fue disparado. **Consultar su estado final** antes de declarar validación. Si hay error de test, build, TS, lint o deploy, corregir en esta misma rama antes de avanzar.

## Límites conocidos y siguiente punto
- Sin prueba con sesión del usuario ni captura nueva del módulo de Informes; **no afirmar aprobación visual**.
- No se aplicó ninguna migración ni se crearon datos, cuentas o empresas.
- APK/IPA y EWEB.P2–P5 siguen abiertos.
- Al recibir «seguí»: revisar esta entrada, `ETAPAS.md` y `ESTADO.md`; comprobar QA `dep-db3qsml9fdbs73eslmf0`; registrar resultado; terminar EWEB.P1.5 y solo entonces comenzar Inspecciones EWEB.P2.
