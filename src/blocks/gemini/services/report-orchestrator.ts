import type { AiDecisionTrailStep, GeneratedReport, ReportInput } from '@/types/report';
import { makeId } from '@/shared/utils/id';
import { buildInputAgentPrompt } from '../agents/input-agent';
import { buildTechnicalAgentPrompt } from '../agents/technical-agent';
import { buildNormativeAgentPrompt } from '../agents/normative-agent';
import { buildSmartAgentPrompt } from '../agents/smart-agent';
import { buildCalendarAgentPrompt } from '../agents/calendar-agent';
import { buildExecutiveAgentPrompt } from '../agents/executive-agent';
import { buildEvidenceAgentPrompt } from '../agents/evidence-agent';
import { buildReportPrompt } from '../prompts/report-prompt';
import { callGemini, callGeminiText, type GeminiCallResult } from './gemini-client';
import { parseGeminiReport } from '../parsers/report-parser';

interface AgentResult {
  agentName: string;
  type: AiDecisionTrailStep['type'];
  inputUsed: string;
  recommendation: string;
  reasoning: string;
  output: string;
}

export interface OrchestratedReportResult {
  report: GeneratedReport;
  ai: GeminiCallResult;
  agentTrail: AiDecisionTrailStep[];
}

const nowIso = () => new Date().toISOString();

function buildTrailStep(step: AgentResult): AiDecisionTrailStep {
  return {
    id: makeId('trail'),
    type: step.type,
    agentName: step.agentName,
    inputUsed: step.inputUsed,
    recommendation: step.recommendation,
    reasoning: step.reasoning,
    output: step.output,
    createdAt: nowIso()
  };
}

function summarize(text: string, fallback: string) {
  const clean = text.replace(/\s+/g, ' ').trim();
  return clean ? clean.slice(0, 900) : fallback;
}

async function runAgent(agent: Omit<AgentResult, 'output'> & { prompt: string }): Promise<AgentResult> {
  if (!process.env.GEMINI_API_KEY) {
    return { ...agent, output: agent.recommendation };
  }

  const response = await callGeminiText(`${agent.prompt}\n\nRespondé en español técnico, claro y accionable. No inventes datos.`, agent.agentName);
  return { ...agent, output: summarize(response.rawText, agent.recommendation) };
}

export async function runReportOrchestrator(input: ReportInput): Promise<OrchestratedReportResult> {
  const inputAgent = await runAgent({
    type: 'input',
    agentName: 'Input Agent',
    inputUsed: 'Datos generales, observaciones, checklist, audio, fotos y archivos de referencia',
    recommendation: 'Ordenar los datos crudos en un caso técnico único antes de redactar.',
    reasoning: 'La información de campo llega dispersa; primero debe normalizarse para evitar informes pobres o incompletos.',
    prompt: buildInputAgentPrompt(input)
  });

  const technicalAgent = await runAgent({
    type: 'technical',
    agentName: 'Technical Agent',
    inputUsed: inputAgent.output,
    recommendation: 'Detectar hallazgos, riesgos, tareas realizadas, beneficios técnicos y evidencia requerida.',
    reasoning: 'El informe debe explicar qué se observó o ejecutó, para qué sirve y qué evidencia lo respalda.',
    prompt: `${buildTechnicalAgentPrompt(input)}\n\nCaso ordenado por Input Agent:\n${inputAgent.output}`
  });

  const normativeAgent = await runAgent({
    type: 'normative',
    agentName: 'Normative Agent',
    inputUsed: `${input.reportType} · ${input.province} · ${technicalAgent.output}`,
    recommendation: 'Sugerir normativa relacionada solo como referencia para revisión profesional.',
    reasoning: 'La normativa orienta el análisis, pero no debe presentarse como dictamen definitivo sin validación del profesional responsable.',
    prompt: `${buildNormativeAgentPrompt(input)}\n\nAnálisis técnico:\n${technicalAgent.output}`
  });

  const smartAgent = await runAgent({
    type: 'smart',
    agentName: 'SMART Action Agent',
    inputUsed: technicalAgent.output,
    recommendation: 'Convertir hallazgos en acciones con responsable, prioridad, fecha sugerida y evidencia de cierre.',
    reasoning: 'Sin responsables, vencimientos y evidencia, el informe no genera seguimiento operativo real.',
    prompt: buildSmartAgentPrompt([technicalAgent.output])
  });

  const calendarAgent = await runAgent({
    type: 'calendar',
    agentName: 'Calendar Agent',
    inputUsed: smartAgent.output,
    recommendation: 'Proponer vencimientos, recordatorios y reinspecciones vinculadas a las acciones.',
    reasoning: 'El valor del producto aumenta cuando el informe queda conectado a seguimiento real y verificable.',
    prompt: buildCalendarAgentPrompt([smartAgent.output])
  });

  const executiveAgent = await runAgent({
    type: 'executive',
    agentName: 'Executive Summary Agent',
    inputUsed: `${technicalAgent.output}\n${smartAgent.output}\n${normativeAgent.output}`,
    recommendation: 'Preparar una síntesis técnica clara para cliente, gerencia o responsable operativo.',
    reasoning: 'El usuario necesita un informe completo y también un resumen rápido para comunicar resultados.',
    prompt: buildExecutiveAgentPrompt(`${technicalAgent.output}\n${smartAgent.output}\n${normativeAgent.output}`)
  });

  const evidenceAgent = await runAgent({
    type: 'evidence',
    agentName: 'Evidence Agent',
    inputUsed: `${input.companyName} · ${input.reportType} · ${executiveAgent.output}`,
    recommendation: 'Registrar trazabilidad del flujo: entradas, agentes, recomendaciones, acciones, PDF y seguimiento.',
    reasoning: 'La evidencia interna permite demostrar valor operativo, calidad del informe y uso real del sistema.',
    prompt: buildEvidenceAgentPrompt('report_generated', { companyName: input.companyName, reportType: input.reportType, provider: process.env.GEMINI_API_KEY ? 'gemini' : 'fallback' })
  });

  const trail = [inputAgent, technicalAgent, normativeAgent, smartAgent, calendarAgent, executiveAgent, evidenceAgent].map(buildTrailStep);
  const orchestratedPrompt = `${buildReportPrompt(input)}\n\nCONTEXTO MULTIAGENTE YA PROCESADO:\n${trail.map(step => `- ${step.agentName}: ${step.output}`).join('\n')}\n\nUsá estos resultados multiagente para devolver el JSON final del informe. La salida debe respetar el formato JSON solicitado y debe incluir decisionTrail completo.`;

  const ai = await callGemini(orchestratedPrompt);
  const report = parseGeminiReport(ai.rawText, input, ai.provider);

  if (!report.decisionTrail.length || ai.provider === 'gemini') {
    report.decisionTrail = mergeTrail(trail, report.decisionTrail);
  }

  return { report, ai, agentTrail: trail };
}

function mergeTrail(stageTrail: AiDecisionTrailStep[], reportTrail: AiDecisionTrailStep[]) {
  const byStageAgent = new Set(stageTrail.map(step => step.agentName));
  return [
    ...stageTrail,
    ...reportTrail.filter(step => !byStageAgent.has(step.agentName))
  ];
}
