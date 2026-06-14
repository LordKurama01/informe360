import { founderOffer } from '@/config/commercial-offer';
import { moneyARS } from '@/shared/utils/format';

export const landingCopy = {
  badge: 'Plataforma para informes profesionales de campo',
  headline: 'De la visita al informe listo, con IA y seguimiento real.',
  subheadline: 'Informe360 ayuda a profesionales y equipos de campo a transformar fotos, observaciones, checklists y hallazgos en informes técnicos, acciones SMART, PDF profesional y seguimiento calendarizado.',
  ctaPrimary: 'Solicitar acceso fundador',
  ctaSecondary: 'Ver cómo funciona',
  appCta: 'Ingresar',
  founderPrice: `${moneyARS(founderOffer.priceARS)} / mes`,
  founderNote: 'Precio fundador hasta diciembre 2026 para quienes ingresen antes del cierre comercial.',
  regularNote: `Desde enero 2027 el valor será ${moneyARS(founderOffer.regularPriceARS)} / mes.`,
  whatsappMessage: 'Hola, quiero solicitar acceso fundador a Informe360 AI Agent.'
};
