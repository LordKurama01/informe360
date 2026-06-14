import type { AiDecisionTrailStep, DecisionTrailStepType, GeneratedReport, ReportInput, SmartAction, TechnicalDetail } from '@/types/report';
import { addDays, addMonths } from '@/shared/utils/format';
import { makeId } from '@/shared/utils/id';

const validRisk = new Set(['bajo', 'medio', 'alto', 'crítico', 'a revisar']);
const validPriority = new Set(['baja', 'media', 'alta', 'crítica']);
const validTrailTypes = new Set(['input', 'technical', 'normative', 'smart', 'calendar', 'executive', 'evidence']);

export function parseGeminiReport(rawText: string, input: ReportInput, provider: 'gemini' | 'mock'): GeneratedReport {
  const parsed = safeJson(rawText);
  const now = new Date();
  const manualMinutes = Number(parsed?.impactMetrics?.estimatedManualTimeMinutes || input.estimatedManualTimeMinutes || 180);
  const aiMinutes = Number(parsed?.impactMetrics?.estimatedAiTimeMinutes || Math.max(35, Math.round(manualMinutes * 0.25)));
  const saved = Math.max(Number(parsed?.impactMetrics?.estimatedTimeSavedMinutes || manualMinutes - aiMinutes), 0);
  const savedPercent = manualMinutes > 0 ? Number(parsed?.impactMetrics?.estimatedTimeSavedPercent || Math.round((saved / manualMinutes) * 100)) : 0;

  const smartActions: SmartAction[] = Array.isArray(parsed.smartActions)
    ? parsed.smartActions.map((item: any) => ({
        id: makeId('act'),
        action: String(item.action || 'Acción correctiva a definir'),
        responsible: String(item.responsible || 'Responsable a definir'),
        dueDate: addDays(now, Number(item.dueInDays || 7)).toISOString(),
        evidence: String(item.evidence || 'Evidencia a adjuntar'),
        priority: validPriority.has(item.priority) ? item.priority : 'media',
        status: 'pendiente',
        sourceFinding: item.sourceFinding ? String(item.sourceFinding) : undefined
      }))
    : [];

  const technicalDetails = parseTechnicalDetails(parsed.technicalDetails);
  const findings = asStringArray(parsed.findings);

  return {
    id: makeId('rep'),
    title: String(parsed.title || buildDefaultTitle(input)),
    executiveSummary: String(parsed.executiveSummary || 'Se generó un informe técnico con hallazgos, acciones de seguimiento y documentación relacionada para revisión profesional.'),
    generalDescription: String(parsed.generalDescription || 'Durante la visita o intervención realizada, se relevaron observaciones de campo, evidencias disponibles y condiciones que requieren registro técnico, ordenamiento documental y seguimiento operativo.'),
    technicalDetails: technicalDetails.length ? technicalDetails : buildDefaultTechnicalDetails(input),
    findings: findings.length ? findings : ['Observaciones cargadas y ordenadas para revisión técnica.', 'Se recomienda completar evidencia y seguimiento documental.'],
    riskLevel: validRisk.has(parsed.riskLevel) ? parsed.riskLevel : 'a revisar',
    probableCauses: asStringArray(parsed.probableCauses),
    smartActions,
    relatedNormatives: asStringArray(parsed.relatedNormatives),
    calendarSuggestions: Array.isArray(parsed.calendarSuggestions)
      ? parsed.calendarSuggestions.map((item: any) => ({
          title: String(item.title || 'Seguimiento de informe'),
          reason: String(item.reason || 'Seguimiento operativo'),
          suggestedDate: addDays(now, Number(item.dueInDays || 30)).toISOString(),
          reminderDaysBefore: Number(item.reminderDaysBefore || 5),
          linkedAction: item.linkedAction ? String(item.linkedAction) : undefined,
          googleCalendarReady: true
        }))
      : [{ title: 'Reinspección sugerida', reason: 'Seguimiento de acciones', suggestedDate: addMonths(now, 1).toISOString(), reminderDaysBefore: 5, googleCalendarReady: true }],
    finalStatus: asStringArray(parsed.finalStatus).length ? asStringArray(parsed.finalStatus) : ['Informe generado para revisión.', 'Acciones pendientes de seguimiento.', 'Evidencia documental a completar según corresponda.'],
    attachmentsSummary: String(parsed.attachmentsSummary || 'Se podrán adjuntar fotografías, registros, checklists, archivos de respaldo y evidencias vinculadas al informe.'),
    clientSummary: String(parsed.clientSummary || 'Se realizó relevamiento técnico, se organizaron hallazgos y se definieron acciones de seguimiento para revisión y cierre.'),
    conclusion: String(parsed.conclusion || 'La validación final queda a cargo del profesional responsable. Se recomienda completar evidencia de cierre y mantener seguimiento documentado.'),
    professionalDisclaimer: 'Normativa relacionada para revisión profesional. Validación final a cargo del responsable técnico.',
    impactMetrics: {
      estimatedManualTimeMinutes: manualMinutes,
      estimatedAiTimeMinutes: aiMinutes,
      estimatedTimeSavedMinutes: saved,
      estimatedTimeSavedPercent: savedPercent
    },
    decisionTrail: buildDecisionTrail(parsed.decisionTrail, now),
    qualityScore: {
      score: Number(parsed?.qualityScore?.score || 82),
      structure: String(parsed?.qualityScore?.structure || 'Estructura técnica completa'),
      actions: String(parsed?.qualityScore?.actions || `${smartActions.length} acciones generadas`),
      evidence: String(parsed?.qualityScore?.evidence || 'Evidencia vinculada o solicitada'),
      conclusion: String(parsed?.qualityScore?.conclusion || 'Conclusión técnica incluida')
    },
    generatedAt: now.toISOString(),
    aiProvider: provider
  };
}

function parseTechnicalDetails(value: unknown): TechnicalDetail[] {
  if (!Array.isArray(value)) return [];
  return value.map((item: any) => ({
    title: String(item.title || 'Detalle técnico'),
    description: String(item.description || ''),
    objective: item.objective ? String(item.objective) : undefined,
    benefit: item.benefit ? String(item.benefit) : undefined,
    evidence: item.evidence ? String(item.evidence) : undefined
  })).filter(item => item.description);
}

function buildDefaultTitle(input: ReportInput) {
  const reportType = input.reportType?.toLowerCase() || '';
  if (reportType.includes('mantenimiento')) return 'Informe de mejoras y mantenimiento de unidad';
  if (reportType.includes('cacería técnica') || reportType.includes('recorrido de hallazgos')) return 'Cacería técnica / recorrido de hallazgos';
  return `Informe técnico ${input.reportType || 'profesional'}`;
}

function buildDefaultTechnicalDetails(input: ReportInput): TechnicalDetail[] {
  return [
    {
      title: 'Relevamiento técnico de campo',
      description: input.fieldNotes || 'Se registraron observaciones técnicas para análisis y seguimiento.',
      objective: 'Ordenar la información relevada y transformarla en documentación profesional.',
      benefit: 'Permite disponer de una base clara para acciones correctivas, control posterior y presentación al cliente.',
      evidence: input.photoNotes || 'Evidencia fotográfica o documental a adjuntar.'
    }
  ];
}

function buildDecisionTrail(value: unknown, now: Date): AiDecisionTrailStep[] {
  if (!Array.isArray(value)) return [];
  return value.map((item: any) => ({
    id: makeId('trail'),
    type: validTrailTypes.has(item.type) ? item.type as DecisionTrailStepType : 'evidence',
    agentName: String(item.agentName || 'Informe360 Agent'),
    inputUsed: String(item.inputUsed || 'Input del informe'),
    recommendation: String(item.recommendation || 'Recomendación generada'),
    reasoning: String(item.reasoning || 'Criterio operativo del agente'),
    output: String(item.output || 'Salida registrada'),
    createdAt: now.toISOString()
  }));
}

function safeJson(raw: string): any {
  try { return JSON.parse(raw); } catch {}
  const match = raw.match(/\{[\s\S]*\}/);
  if (match) {
    try { return JSON.parse(match[0]); } catch {}
  }
  return {};
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String).filter(Boolean) : [];
}
