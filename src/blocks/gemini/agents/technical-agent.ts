import type { ReportInput } from '@/types/report';

export function buildTechnicalAgentPrompt(input: ReportInput) {
  return `Analizá técnicamente el caso HSE. Identificá hallazgos, riesgos, causas probables y datos faltantes. No emitas dictamen legal. Caso: ${input.fieldNotes}`;
}
