# EAPP.P1 — Inicio Android nativo con identidad de aplicación

**Fecha:** 2026-10-08. **Motivo:** captura del usuario en navegador Android de `informe360-hse-e1-qa.onrender.com` con pantalla alta, gran tarjeta naranja «Registrar hablando», cuatro botones redundantes, fila inferior con captura flotante y KPI «0% cierres en plazo» sin cierres.

## Diagnóstico
- El URL `informe360-hse-e1-qa.onrender.com` es **Expo Web Preview** y por definición se abre con la barra de navegador. No constituye APK instalada ni prueba de Android nativo.
- El home React Native real estaba en `mobile/app/(tabs)/index.tsx`, con el diseño equivalente al de la captura. `mobile/app/(tabs)/_layout.tsx` dibujaba una pestaña Capturar con círculo de 58px superpuesto (marginTop -19), a la vez que Inicio mostraba una tarjeta hero de 144px y cuatro atajos.
- También existía un botón «Cargar demo comercial» accesible desde Inicio, aun cuando el producto web ya había eliminado Demo.
- `summary.closureCompliancePct` se interpolaba como porcentaje incluso si el denominador (`closed`) era cero.
- Íconos de captura y tabbar se representaban con glifos de texto (●, ▣, ◇, !) en lugar de iconografía nativa.

## Cambios
1. `mobile/app/(tabs)/index.tsx`: experiencia de aplicación diseñada para campo. Cabecera oscura compacta con sitio/organización/IA, zona de acciones pequeña «Registrar por voz», tres atajos útiles (inspección, foto, texto), resumen de dos filas en tarjeta neutral, actividad reciente auténtica, cola offline/pendientes revisión. No se muestra Demo.
2. Estado de carga del home `loading/ready/error`: cero solo después de la consulta exitosa y «Sin cierres registrados» cuando no existe denominador. Pull-to-refresh real solo con gesto manual: evita spinner al entrar.
3. `mobile/app/(tabs)/_layout.tsx`: navegación de cinco pestañas con botón de captura de 44px sin superposición gigante; tamaños propios de pantalla táctil.
4. `mobile/package.json`: dependencia `@expo/vector-icons` para íconos MaterialCommunityIcons en atajos y tabs en lugar de caracteres de prueba.
5. `scripts/hse-mobile-field-home.test.mjs`: cuatro tests de regresión del diseño (sin demo, KPI no engañoso, cola offline preservada, tabs compactos), agregado a `npm run qa`.

## Entrega y próximos gates
- Primer deploy Expo Web QA `dep-db40886i0phs73egus90`, código `cd911fe387e52b6fb7a4274c77a650285d026b15`, **LIVE**, finalizado `2026-10-08T21:00:59Z`.
- Segundo deploy con íconos nativos `dep-db4094nlot8c73c8l3l0`, código `1b871ad09a9dd1a920bac174d36c9392503a319e`, iniciado. **Verificar API Render antes de afirmar LIVE**.
- Pruebas de `npm run qa`, typecheck Expo y export web son control estático/build, **no** aceptación visual por usuario ni comportamiento real con micrófono/cámara.
- **Importante:** la barra del navegador seguirá presente en Expo Web QA. Para comprobar si la aplicación «parece una app» debe instalarse una APK Android `com.informe360.hsecopilot`, empaquetada con Expo Android/EAS y probada en dispositivo.
- La APK definitiva del proyecto **no fue construida ni verificada** aquí. EAS `mobile/eas.json` tiene perfil `preview` con `android.buildType=apk`, pero su ejecución y descarga requieren un entorno/servicio de compilación Android disponible. No presentar preview como APK.
- `feat/hse-phases-1-5` de producción web permanece intacta. PR #3 sigue draft. No modificar base de datos, registros ni usuarios.
- Auditoría RLS de inspecciones sigue pendiente (ver `EWEB_P2_4_AUDITORIA_RLS_2026-10-08.md`).


## ✅ Publicación final comprobada
- Render static QA `dep-db4094nlot8c73c8l3l0` **LIVE** sobre `1b871ad09a9dd1a920bac174d36c9392503a319e`, finalizado `2026-10-08T21:02:50.818255Z`.
- `npm run qa` aprobó cuatro pruebas nuevas sobre el Inicio móvil; `mobile npm run typecheck` y `npx expo export --platform web --output-dir dist` completaron. Íconos MaterialCommunityIcons empacados en el bundle web.
- El visual final **no fue inspeccionado por el usuario después del cambio**, y esta exportación sigue sin ser APK Android. El próximo gate de producto es un build `preview` nativo y prueba en dispositivo.
- Diferenciación: web escritorio `https://informe360-hse-web-qa.onrender.com/app/hse` sigue siendo un producto distinto, no fue rediseñada en esta etapa.
