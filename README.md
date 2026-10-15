<p align="left"><img src="https://raw.githubusercontent.com/LordKurama01/theprestige-group/main/branding/tpg-diamondgold.png" alt="Diamante original de The Prestige Group" width="56" /> <strong>The Prestige Group</strong></p>

# Informe360 — Informes de campo asistidos por IA

**De observaciones dispersas a informes estructurados, editables y accionables.**

Informe360 está orientado a profesionales y equipos que registran inspecciones, incidentes o desvíos y necesitan documentarlos de forma consistente. El repositorio contiene una implementación desarrollada alrededor de **Next.js**, **TypeScript** e integración con herramientas de IA.

## El problema

Fotos, notas, checklists y registros de campo suelen quedar en soportes separados. Consolidar toda esa información manualmente retrasa la entrega del informe y dificulta seguir las acciones.

## Qué incorpora el proyecto

- Captura y organización de observaciones, incidentes, desvíos y listas de verificación.
- Estructuración asistida por IA para elaborar hallazgos e informes editables.
- Propuesta de acciones correctivas y seguimiento.
- Generación de documentos/PDF y componentes de calendario y control.
- Módulos de evidencia y trazabilidad del proceso de IA.

**Alcance:** la existencia de módulos y rutas en el código no constituye por sí sola una validación de integraciones externas o una garantía de funcionamiento en producción.

## Arquitectura técnica

| Capa | Tecnología / estructura |
| --- | --- |
| Aplicación | Next.js 16, React 19, TypeScript |
| IA | Integraciones del proyecto con Gemini |
| Datos | Integración con Supabase contemplada en el proyecto |
| Organización | Bloques separados para auth, informes, PDF, calendario y control |
| QA | Scripts de estructura, lint, typecheck y build |

La organización está documentada en [Arquitectura modular](docs/ARQUITECTURA_MODULAR.md).

## Desarrollo local

```bash
npm install
npm run dev
```

### Validaciones disponibles

```bash
npm run test:structure
npm run typecheck
npm run lint
npm run build
# Orquestación del paquete:
npm run qa
```

Son **comandos disponibles**, no resultados de pruebas ejecutadas durante esta actualización del README. Las integraciones externas requieren configuración propia. Usar [`.env.example`](.env.example) como referencia; **no subir valores reales al repositorio**.

## Historia del proyecto

El repositorio incluye trabajo iniciado en 2026 y documentación de una versión orientada al **Build with Gemini XPRIZE**. Ese contexto histórico no implica premios, selección, elegibilidad confirmada ni resultados comerciales verificados.

La evolución y sus decisiones se pueden consultar en el historial de commits y [la documentación técnica](docs/). Se retiraron de esta portada las ofertas comerciales con fechas antiguas para evitar presentar precios no vigentes.

## Estado y próximos controles

- **Verificado en repositorio:** existencia de scripts en `package.json`, documentación de arquitectura y estructura de proyecto Next.js.
- **No verificado en esta pasada documental:** entorno productivo, integraciones activas, estado de login ni éxito de QA.
- **Siguiente validación técnica:** ejecutar `npm run qa` en un entorno controlado antes de anunciar una versión de producción.

[**Portfolio del grupo**](https://github.com/LordKurama01/theprestige-group) · [**Instrucciones**](AGENTS.md) · [**Bitácora**](BITACORA.md)

---

<sub><img src="https://raw.githubusercontent.com/LordKurama01/theprestige-group/main/branding/tpg-diamondgold.png" alt="" width="18" /> The Prestige Group · Software y automatización.</sub>
