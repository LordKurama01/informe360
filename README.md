# Informe360 AI Agent - Build with Gemini XPRIZE Edition

Versión nueva de concurso iniciada el **02/06/2026**, basada en investigación previa del problema, pero con implementación, repo, Gemini, deploy, base de datos, ventas y evidencia creadas dentro del período del hackathon.

## Qué hace

Informe360 AI Agent convierte información desordenada de campo en documentación profesional:

- observaciones,
- fotos,
- audios transcriptos,
- incidentes,
- desvíos,
- checklists,

Y genera con Gemini:

- informe profesional editable,
- hallazgos,
- nivel de riesgo sugerido,
- normativa relacionada para revisar,
- acciones SMART,
- calendario de seguimiento,
- PDF profesional,
- logs de IA para evidencia XPRIZE.

## Oferta comercial inicial

**Acceso fundador completo:** $30.000 ARS / mes.  
Disponible para usuarios registrados y pagos hasta el **30/08/2026**.  
Precio fundador válido hasta **diciembre 2026**.  
Desde enero 2027: **$50.000 ARS / mes**.  
Usuarios posteriores al 30/08/2026 entran directamente al precio regular.

## Stack

- Next.js 16 + TypeScript
- Gemini API
- Supabase
- Google Auth / Gmail
- Google Calendar integration preparada
- Vercel
- PDF HTML printable
- Tracking propio
- Dashboard Control interno

## Arquitectura

Arquitectura modular extrema por bloques. Cada dominio tiene carpeta propia y layouts desktop/mobile separados cuando hace falta.

Ver: `docs/ARQUITECTURA_MODULAR.md`

## Comandos

```bash
npm install
npm run dev
```

QA local:

```bash
npm run qa
```

Deploy:

```powershell
cd "C:\Proyectos\Informe360-XPRIZE"
vercel --prod --force
```

## Variables obligatorias para producción

Copiar `.env.example` a `.env.local` y completar:

- `GEMINI_API_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- Google OAuth cuando se conecte auth real

## Nota de elegibilidad / origen

Frase oficial sugerida:

> Informe360 AI Agent started as a new Build with Gemini XPRIZE implementation on June 2, 2026, based on prior domain research and product exploration. The competition version, Gemini API integration, Google Cloud deployment, database, customer validation, revenue evidence, and AI logs were created during the hackathon period.


## V2 final judge-proof

Esta versión suma patrones de ganadores XPRIZE/Gemini: AI Decision Trail, métricas de impacto, Google Stack Center, Maps, Gmail API preparada, Vertex AI documentado, dashboard de evidencia más fuerte y demo case para video de 3 minutos.

Rutas clave:

- `/` Landing.
- `/login` Google Auth preparado.
- `/app/reports/new` Crear informe con Gemini.
- `/app/maps` Inspecciones / Google Maps.
- `/control` Dashboard interno.
- `/control/google` Google Stack Center.
- `/control/decision-trail` AI Decision Trail.
- `/control/xprize` Evidencia XPRIZE.
- `/demo` Caso demo.
