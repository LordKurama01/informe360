# Deploy Vercel + Supabase + Gemini

## 1. Crear proyecto

Carpeta sugerida:

```powershell
C:\Proyectos\Informe360-XPRIZE
```

## 2. Instalar

```powershell
npm install
npm run dev
```

## 3. Supabase

Ejecutar en SQL Editor:

1. `database/supabase/schema.sql`
2. `database/supabase/seed_normatives.sql`

## 4. Variables en Vercel

- `GEMINI_API_KEY`
- `GEMINI_MODEL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_ADMIN_EMAIL`

## 5. Deploy

```powershell
cd "C:\Proyectos\Informe360-XPRIZE"
vercel --prod --force
```

## 6. Health check

Abrir:

```txt
/api/health
```
