# QA de acceso al panel — 2026-10-08

Diagnóstico: la pantalla de alta de empresa no refrescaba automáticamente la asignación del espacio mientras permanecía abierta; errores mediante alertas móviles no eran visibles en la vista web.

Corrección en `mobile/app/onboarding.tsx`: comprobar el espacio asignado al ingresar, redirigir al panel cuando exista, permitir reintento explícito y mostrar errores en línea. Antes de crear una empresa nueva comprueba si la cuenta ya tiene una asignada, para evitar duplicados.

Prueba contractual: `scripts/check-mobile-onboarding.mjs`, incorporada a `npm run qa`.

Despliegue QA: servicio `informe360-hse-e1-qa` (Render), rama de desarrollo separada de producción. El resultado debe verificarse antes de darlo por finalizado.

Pendiente: prueba de navegación y autenticación en el teléfono del usuario. El resto de las mejoras offline siguen en PR #3 borrador.
