# Bitácora operativa permanente — Informe360 HSE

**Creación:** 2026-10-07 (Argentina)  
**Repositorio:** [LordKurama01/informe360](https://github.com/LordKurama01/informe360)  
**Estatus de este paquete:** documentación de planificación; **no** implica que se hayan ejecutado las etapas de producto.  
**Rama de documentación inicial:** `docs/bitacora-hse-2026-10-07` (base: `feat/hse-phases-1-5`).

## Fuentes de verdad

| Documento | Uso |
| --- | --- |
| [AGENTS.md](../../AGENTS.md) | Reglas obligatorias de inspección, seguridad, registro y reanudación. |
| [ESTADO.md](ESTADO.md) | Snapshot técnico verificado, riesgos, trabajo en curso y punto exacto de continuidad. |
| [ETAPAS.md](ETAPAS.md) | Roadmap de etapas/partes con gates, entregables y criterios de cierre. |
| [REGISTRO.md](REGISTRO.md) | Diario cronológico append-only: qué se hizo, SHA, evidencia, pendientes, rollback. |

Estas notas NO sustituyen la verdad del repositorio, el estado de Supabase/Render ni CI. Antes de cada tarea volver a verificar esos sistemas.

## Cómo interpretar «seguí»

1. Localizar este índice y la última entrada del REGISTRO **en GitHub**. Si no hay merge, usar el [índice permanente issue #2](https://github.com/LordKurama01/informe360/issues/2): la bitácora más reciente está en `feat/hse-e1-offline-resilience-2026-10-08` ([PR #3](https://github.com/LordKurama01/informe360/pull/3)), descendiente de `docs/bitacora-hse-2026-10-07` ([PR #1](https://github.com/LordKurama01/informe360/pull/1)).
2. Leer ESTADO y ETAPAS para localizar la primera parte no validada, teniendo en cuenta dependencias.
3. Verificar rama de código, SHA HEAD, archivos, RLS/infra si aplica, CI, riesgos y diferencias con el estado documentado. Si cambió algo, corregir primero el ESTADO y registrar la divergencia.
4. Ejecutar **una parte acotada**, con commits trazables y sin duplicar funcionalidades. Si el usuario pide completar varias partes, repetir el ciclo sin perder gates.
5. Correr pruebas proporcionadas al riesgo (tests, lint, typecheck, build, Android, iOS, smoke con datos ficticios); guardar enlaces a runs y errores.
6. Antes de darla por terminada, actualizar ESTADO/ETAPAS/REGISTRO en GitHub, con `última parte validada` y `próxima acción exacta`. Si CI no corrió, estado IMPLEMENTADA SIN QA; si falla, BLOQUEADA.

## Convención de registro

`E<etapa>.P<parte>` + fecha local + SHA base + rama + alcance + archivos + pruebas realizadas/resultados + status + links + riesgos/rollback + siguiente parte. No registrar ejecución supuesta; usar explícitamente `no ejecutado`, `sin comprobar` o `no aplica`.

Cada parte se respalda en **código y tests, o documentación verificable si es una etapa de auditoría**. Mantener `REGISTRO.md` append-only (sin reescritura del pasado). No incluir credenciales, información sensible, datos de clientes, secretos o evidencias privadas.

## Estado de trabajo activo

**E1 en ejecución**, última bitácora: [E1_AVANCE_2026-10-07.md](E1_AVANCE_2026-10-07.md). E1.P1 auditada, P2/P3 en curso y P4 bloqueada. La ruta crítica aún no habilita E2. No fusionar PRs borradores ni desplegar por defecto.

## Política de integración

Render `informe360-hse` realiza deploy automático al recibir commits en `feat/hse-phases-1-5`. Por eso la documentación nació en rama aparte con PR hacia desarrollo, sin alterar la rama auto-desplegada. No integrar ni mover `main` o la rama productiva por el solo hecho de documentar.

## Fuentes históricas a revisar al retomar

- `docs/HSE_COPILOT_PLAN_MAESTRO_V2_2026-09-13.md`
- `docs/superpowers/plans/2026-09-13-hse-dynamic-forms-phase1.md`
- `docs/superpowers/plans/2026-09-13-hse-mobile-first-premium-ui.md`
- `docs/HSE_COPILOT_REPOS_Y_COMPONENTES_2026-09-12_ADDENDUM.md`
- `.github/workflows/ci.yml`
