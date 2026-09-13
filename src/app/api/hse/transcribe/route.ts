import { NextResponse } from 'next/server';
import { authenticateMobileRequest } from '@/services/hse/mobile-auth';
import { transcribeAudio } from '@/services/ai/hse/router';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const auth = await authenticateMobileRequest(request);
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const form = await request.formData();
  const file = form.get('file');
  if (!(file instanceof File)) return NextResponse.json({ error: 'Audio file is required' }, { status: 400 });
  if (file.size > 25 * 1024 * 1024) return NextResponse.json({ error: 'Audio exceeds 25 MB free-tier limit' }, { status: 413 });

  try {
    return NextResponse.json(await transcribeAudio(file));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Transcription unavailable' }, { status: 503 });
  }
}
