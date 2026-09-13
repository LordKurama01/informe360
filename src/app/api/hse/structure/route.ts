import { NextResponse } from 'next/server';
import { authenticateMobileRequest } from '@/services/hse/mobile-auth';
import { structureFieldEntry } from '@/services/ai/hse/router';
import { resolveUserDueText } from '@/shared/hse/date-resolution.mjs';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const auth = await authenticateMobileRequest(request);
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await request.json().catch(() => null) as { text?: string } | null;
  const text = body?.text?.trim() || '';
  if (text.length < 3) return NextResponse.json({ error: 'Text is too short' }, { status: 400 });
  if (text.length > 12000) return NextResponse.json({ error: 'Text is too long' }, { status: 413 });

  const result = await structureFieldEntry(text);
  const due = resolveUserDueText(text);
  return NextResponse.json({
    draft: { ...result.draft, due_text: due?.raw ?? null },
    due_at: due?.iso ?? null,
    provider: result.provider,
    model: result.model,
  });
}
