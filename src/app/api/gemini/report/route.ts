import { NextResponse } from 'next/server';
import type { ReportInput } from '@/types/report';
import { generateReportWithGemini } from '@/blocks/gemini/services/report-generation';
import { trackServerEvent } from '@/services/tracking/track-server';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ReportInput;
    await trackServerEvent({ name: 'multi_agent_generation_started', path: '/api/gemini/report', metadata: { companyName: body.companyName, reportType: body.reportType, style: body.reportStyleMode } });
    const result = await generateReportWithGemini(body);
    await trackServerEvent({ name: 'multi_agent_generation_completed', path: '/api/gemini/report', metadata: { provider: result.ai.provider, reportId: result.report.id, latencyMs: result.ai.latencyMs, actions: result.report.smartActions.length } });
    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Generation failed';
    await trackServerEvent({ name: 'multi_agent_generation_failed', path: '/api/gemini/report', metadata: { error: message } });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
