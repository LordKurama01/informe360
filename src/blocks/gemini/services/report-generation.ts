import type { ReportInput } from '@/types/report';
import { runReportOrchestrator } from './report-orchestrator';
import { logAiGeneration } from './ai-log-service';

export async function generateReportWithGemini(input: ReportInput, userId?: string) {
  const result = await runReportOrchestrator(input);
  await logAiGeneration({
    userId,
    provider: result.ai.provider,
    model: result.ai.model,
    promptType: 'multi_agent_report_generation',
    inputSummary: `${input.companyName} - ${input.reportType}`,
    outputPreview: result.report.executiveSummary,
    latencyMs: result.ai.latencyMs,
    rawResponse: result.ai.rawText
  });
  return result;
}
