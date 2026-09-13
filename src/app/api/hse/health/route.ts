import { NextResponse } from 'next/server';
import { getHseAIStatus } from '@/services/ai/hse/router';

export const runtime = 'nodejs';

export async function GET() {
  return NextResponse.json({ ok: true, product: 'HSE Copilot', providers: getHseAIStatus() });
}
