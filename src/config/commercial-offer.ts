export const founderOffer = {
  id: 'founder-full-access-2026',
  name: 'Acceso fundador completo',
  priceARS: 30000,
  currency: 'ARS',
  billingPeriod: 'month',
  publicDeadlineISO: '2026-08-30',
  xprizeEvidenceTargetISO: '2026-08-17',
  founderPriceValidUntilISO: '2026-12-31',
  regularPriceARS: 50000,
  regularPriceStartsISO: '2027-01-01',
  copy: {
    headline: 'Informes profesionales con IA, normativa, acciones SMART y seguimiento.',
    subheadline: 'Precio fundador disponible para usuarios registrados y pagos hasta el 30 de agosto de 2026.',
    disclaimer: 'Normativa relacionada para revisión profesional. Validación final a cargo del responsable técnico.'
  },
  included: [
    'Informes con Gemini',
    'Fotos y observaciones de campo',
    'Audios transcriptos',
    'Acciones SMART',
    'Normativa relacionada',
    'PDF profesional',
    'Historial',
    'Calendario de seguimiento',
    'Soporte inicial'
  ]
} as const;

export type FounderOffer = typeof founderOffer;
