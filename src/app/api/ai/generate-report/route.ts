import { NextResponse } from 'next/server';
import type { ReportInput } from '@/types/report';
import { generateReportWithGemini } from '@/blocks/gemini/services/report-generation';
import { trackServerEvent } from '@/services/tracking/track-server';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ReportInput;
    await trackServerEvent({ name: 'gemini_generation_started', path: '/api/ai/generate-report', metadata: { companyName: body.companyName, reportType: body.reportType } });
    const result = await generateReportWithGemini(body);
    await trackServerEvent({ name: 'gemini_generation_completed', path: '/api/ai/generate-report', metadata: { provider: result.ai.provider, reportId: result.report.id, latencyMs: result.ai.latencyMs } });
    return NextResponse.json(result);
  } catch (error: any) {
    await trackServerEvent({ name: 'gemini_generation_failed', path: '/api/ai/generate-report', metadata: { error: error.message } });
    return NextResponse.json({ error: error.message || 'Generation failed' }, { status: 500 });
  }
}
