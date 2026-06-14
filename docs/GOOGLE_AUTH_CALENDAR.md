# Google Auth y Calendar

## Regla

Login inicial con Gmail / Google Auth.

No pedir permisos de Calendar en el login inicial. Calendar se solicita solo cuando el usuario quiere agendar una reinspección, vencimiento o visita.

## Flujo

1. Ingresar con Google.
2. Crear perfil.
3. Crear informe.
4. Gemini sugiere seguimiento.
5. Usuario acepta crear evento.
6. Se pide permiso Google Calendar.
7. Se guarda evento interno y, si autoriza, en Google Calendar.
