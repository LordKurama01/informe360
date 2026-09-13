# HSE Copilot — Mobile-first premium UI design

Fecha: 2026-09-13

## Objetivo

Reorganizar la experiencia nativa de HSE Copilot para que el teléfono sea la herramienta operativa principal de campo. El trabajo es un refactor de UX/UI sobre capacidades existentes: no agrega nuevas reglas de negocio, no cambia el esquema de Supabase y no sustituye los servicios de captura, sincronización, IA, formularios, inspecciones, hallazgos ni cierre.

## Principio rector

**Campo = celular. Escritorio = control.**

La app móvil se diseña para recorridas, inspecciones y registro de evidencia con una mano, en movimiento, con conectividad imperfecta y bajo presión operativa. La capa desktop queda fuera de este refactor y seguirá orientada a supervisión, administración, informes y configuración.

## Flujo principal

Inicio → Capturar → Revisar → Hallazgo → Seguimiento → Cierre.

Inspecciones, formularios y alertas deben integrarse a ese mismo circuito, sin crear una segunda experiencia paralela.

## Alcance

### Incluido

- Sistema visual nativo consistente y reutilizable.
- Navegación inferior de cinco destinos operativos.
- Inicio simplificado y orientado a acción.
- Centro de captura para voz, foto y texto.
- Hallazgos: búsqueda, filtros, prioridad, vencimientos y armado de informes.
- Alertas y vencimientos.
- Inspecciones como módulo móvil de primer nivel.
- Formularios y borradores offline.
- Login y onboarding visualmente coherentes.
- Registro/captura y revisión humana.
- Detalle de hallazgo, evidencia, seguimiento, cierre y reapertura.
- Estados offline/sincronización/IA visibles sin dominar la pantalla.
- Accesibilidad táctil: objetivos principales de al menos 48 px y jerarquía legible.

### Fuera de alcance

- Nuevos módulos funcionales como IPCR/ATS/PT.
- Cambios de base de datos o RLS.
- Cambios en proveedores de IA.
- Nueva lógica de sincronización u offline queue.
- Rediseño completo del desktop/web.
- Integración EAS, generación de APK y QA física final; eso pertenece al cierre operativo pendiente de Fase 1.

## Arquitectura de navegación

La barra inferior tendrá cinco destinos de uso frecuente:

1. **Inicio** — situación de la obra/sitio y accesos de campo.
2. **Hallazgos** — memoria operativa, filtros y búsqueda.
3. **Capturar** — acción central; abre voz, foto o texto.
4. **Inspecciones** — biblioteca y actividad reciente.
5. **Alertas** — vencimientos y seguimientos.

La captura debe ser visualmente dominante en la navegación, pero no bloquear el resto de las tareas.

## Sistema visual

Dirección: industrial premium, sobria y legible. Fondo gris muy claro, superficies blancas, tinta oscura, teal como acento de producto y colores semánticos sólo para riesgo/estado.

El archivo `mobile/src/theme.ts` será la fuente única de tokens. Se conservarán las claves actuales para compatibilidad y se ampliarán con:

- superficies y fondos alternativos;
- tinta secundaria y tenue;
- estados danger/warning/success/info suaves;
- escala de espaciado;
- radios;
- tipografía/tamaños de referencia;
- sombras/elevación moderada.

No se agrega una librería visual pesada ni una dependencia de iconos en esta iteración. Se prioriza estabilidad del bundle y componentes propios pequeños.

## Componentes compartidos

Se consolidarán primitivas de UI para evitar que cada pantalla invente su propio lenguaje:

- `Screen`: safe area, fondo, scroll, padding y espacio inferior compatible con tabs.
- `PrimaryButton`: tamaños, estados, feedback y tonos.
- `FindingCard`: tarjeta operativa compacta y escaneable.
- `FieldHeader`: kicker, título, subtítulo y acción opcional.
- `SectionHeader`: título de sección + acción secundaria.
- `MetricTile`: métrica operativa clickeable.
- `StatusPill`: estados semánticos reutilizables donde aporte claridad.

## Pantallas

### Inicio

Debe responder en pocos segundos: dónde estoy, qué necesita atención y cómo registro algo.

Jerarquía:

- sitio/organización + estado IA/sesión;
- banners sólo cuando hay algo accionable: offline pendiente o revisión humana;
- CTA principal de captura;
- accesos rápidos: inspección, foto, texto y búsqueda;
- situación operativa compacta: abiertos, vencidos, próximos, cerrados;
- críticos abiertos como alerta prioritaria;
- actividad reciente.

La demo comercial queda disponible sólo en empty state.

### Capturar

Nueva entrada de navegación que no duplica el pipeline. Presenta tres modos existentes:

- voz como acción primaria;
- foto;
- texto.

Cada elección navega a `/register?mode=...`. No procesa ni persiste nada por sí misma.

### Registro

Mantiene exactamente la lógica existente de permisos, cámara, audio, borrador, online/offline y `processCapture`. Se rediseña para que cada modo tenga una instrucción corta, un único CTA dominante y feedback claro.

### Hallazgos

Mantiene búsqueda, debounce, filtros, selección múltiple y creación de informe. Visualmente prioriza título, criticidad, ubicación, responsable y vencimiento. Los filtros deben poder recorrerse rápidamente sin convertir la pantalla en una nube de badges.

### Detalle

Debe ordenar la información por decisión operativa:

1. identidad/estado/riesgo;
2. descripción y datos clave;
3. acciones;
4. evidencia inicial;
5. seguimiento;
6. evidencia de cierre;
7. cierre/reapertura;
8. trazabilidad.

No se elimina evidencia ni se oculta trazabilidad.

### Inspecciones

Pasa a ser destino de primer nivel en tabs. La lógica existente de plantillas, seed y runs recientes se extrae a una pantalla compartida para que la ruta histórica `/inspections` pueda seguir funcionando sin duplicar negocio.

### Formularios

Conserva plantillas, categoría, versión, drafts offline y rutas existentes. Debe verse como parte del mismo producto, no como una sección administrativa.

### Alertas

Agrupa vencidas, hoy y próximas como hoy, con mayor contraste para urgencia y menos texto explicativo permanente.

### Login/onboarding/revisión

Adoptan el mismo sistema visual; no se cambia autenticación ni reglas de seguridad. La revisión humana conserva el mensaje de seguridad normativa y el hecho de que la IA propone pero no decide vencimientos legales/normativos.

## Offline, IA y seguridad

- El estado offline debe ser visible cuando requiera acción, no decorativo.
- La cola local sigue siendo la fuente de persistencia temporal.
- Ninguna clave de servidor entra en el bundle móvil.
- IA sigue siendo asistencia; la revisión humana precede a la creación del hallazgo cuando corresponde.
- Los mensajes de seguridad normativa existentes se preservan.

## Criterios de aceptación

1. La navegación móvil expone Inicio, Hallazgos, Capturar, Inspecciones y Alertas.
2. Capturar ofrece voz/foto/texto y reutiliza `/register`.
3. Home conserva sync offline, revisiones, métricas, críticos y actividad reciente.
4. Inspecciones sigue usando los servicios existentes y se accede desde tabs.
5. Hallazgos conserva búsqueda, filtros y armado de informes.
6. Detalle conserva evidencia, acciones, cierre, reapertura y trazabilidad.
7. Login y formularios comparten el sistema visual.
8. No hay migraciones ni cambios de Supabase.
9. `npm run qa`, typecheck móvil y Expo Android export deben pasar en CI.
10. El trabajo permanece aislado de la rama auto-deploy hasta completar verificación.
