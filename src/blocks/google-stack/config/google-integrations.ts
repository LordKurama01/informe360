import type { GoogleIntegrationItem } from '@/types/integration';

export const googleIntegrations: GoogleIntegrationItem[] = [
  {
    id: 'gemini-api',
    name: 'Gemini API',
    status: 'ready',
    purpose: 'Agentes para interpretar visitas, hallazgos, normativa, acciones SMART, calendario y resumen ejecutivo.',
    evidence: 'ai_generation_logs + AI Decision Trail + reports.generated_report',
    requiredEnv: ['GEMINI_API_KEY', 'GEMINI_MODEL']
  },
  {
    id: 'google-auth',
    name: 'Google Auth / Gmail Login',
    status: 'ready',
    purpose: 'Ingreso simple con Gmail, identidad real y onboarding liviano.',
    evidence: 'profiles + tracking_events.login',
    requiredEnv: ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET']
  },
  {
    id: 'google-calendar',
    name: 'Google Calendar API',
    status: 'ready',
    purpose: 'Crear reinspecciones, vencimientos y visitas futuras desde informes y acciones.',
    evidence: 'calendar_events + google_calendar_event_id cuando se autorice',
    requiredEnv: ['GOOGLE_CALENDAR_REDIRECT_URI']
  },
  {
    id: 'google-maps',
    name: 'Google Maps Platform',
    status: 'ready',
    purpose: 'Ubicar empresas, inspecciones, bases y lugares de visita.',
    evidence: 'inspection_locations + map_url en reportes',
    requiredEnv: ['NEXT_PUBLIC_GOOGLE_MAPS_API_KEY']
  },
  {
    id: 'cloud-run',
    name: 'Google Cloud Run',
    status: 'future',
    purpose: 'Backend de agentes y tareas server-side cuando salgamos de Vercel-only.',
    evidence: 'deployment logs + Cloud Run service URL',
    requiredEnv: ['GOOGLE_CLOUD_PROJECT_ID']
  },
  {
    id: 'cloud-storage',
    name: 'Google Cloud Storage',
    status: 'future',
    purpose: 'Guardar PDFs, fotos, evidencias y capturas autorizadas.',
    evidence: 'storage_paths + xprize_evidence_assets',
    requiredEnv: ['GOOGLE_CLOUD_STORAGE_BUCKET']
  },
  {
    id: 'cloud-logging',
    name: 'Cloud Logging',
    status: 'future',
    purpose: 'Trazabilidad técnica de agentes, errores, requests y uso de Gemini.',
    evidence: 'Cloud Logging Explorer + Supabase ai_generation_logs',
    requiredEnv: ['GOOGLE_CLOUD_PROJECT_ID']
  },
  {
    id: 'gmail-api',
    name: 'Gmail API',
    status: 'future',
    purpose: 'Enviar PDFs, recordatorios y seguimientos al cliente desde la cuenta autorizada.',
    evidence: 'gmail_delivery_logs + tracking_events.email_sent',
    requiredEnv: ['GOOGLE_GMAIL_REDIRECT_URI']
  },
  {
    id: 'vertex-ai',
    name: 'Vertex AI',
    status: 'future',
    purpose: 'Capa enterprise opcional para evaluar modelos, prompts y monitoreo si el proyecto escala.',
    evidence: 'Vertex evaluations + model/prompt registry',
    requiredEnv: ['GOOGLE_CLOUD_PROJECT_ID']
  },
  {
    id: 'ga4',
    name: 'Google Analytics 4',
    status: 'ready',
    purpose: 'Medir landing, fuentes, clicks y conversión junto al tracking interno.',
    evidence: 'GA4 events + tracking_events',
    requiredEnv: ['NEXT_PUBLIC_GA_MEASUREMENT_ID']
  }
];
