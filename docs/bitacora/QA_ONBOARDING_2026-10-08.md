# QA de acceso al panel — 2026-10-08

Diagnóstico: la pantalla de alta de empresa no refrescaba automáticamente la asignación del espacio mientras permanecía abierta; errores mediante alertas móviles no eran visibles en la vista web.

Corrección en `mobile/app/onboarding.tsx`: comprobar el espacio asignado al ingresar, redirigir al panel cuando exista, permitir reintento explícito y mostrar errores en línea. Antes de crear una empresa nueva comprueba si la cuenta ya tiene una asignada, para evitar duplicados.

Prueba contractual: `scripts/check-mobile-onboarding.mjs`, incorporada a `npm run qa`.

Despliegue QA: servicio `informe360-hse-e1-qa` (Render), rama de desarrollo separada de producción. El resultado debe verificarse antes de darlo por finalizado.

Pendiente: prueba de navegación y autenticación en el teléfono del usuario. El resto de las mejoras offline siguen en PR #3 borrador.


## Verificación final
- Render QA `dep-db3gpjdg1s2s73ad7gr0`: **LIVE**, commit funcional `50a218c7f359253b7e6d732fd3df1f0a99c1bc4d`. Las pruebas de onboarding pasaron, junto al typecheck Expo y export web.
- Base de datos: un espacio de evaluación, un miembro y un sitio; no se crearon duplicados durante la reparación.
- Producción conectada a `feat/hse-phases-1-5` mantuvo HEAD `422f8bcbce65b3e68f892d51d37b1ed0999690c5`; sin cambios.
- La prueba del botón con sesión activa del usuario sigue pendiente de verificación visual por el usuario. La aplicación debería redirigir automáticamente al panel al detectar la membresía existente.
- URL: https://informe360-hse-e1-qa.onrender.com
