import { NextResponse } from 'next/server';
import { authenticateMobileRequest } from '@/services/hse/mobile-auth';
import { analyzeImage } from '@/services/ai/hse/router';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const auth = await authenticateMobileRequest(request);
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const form = await request.formData();
  const file = form.get('file');
  const note = String(form.get('note') || '');
  if (!(file instanceof File)) return NextResponse.json({ error: 'Image file is required' }, { status: 400 });
  if (!file.type.startsWith('image/')) return NextResponse.json({ error: 'Only images are accepted' }, { status: 415 });
  if (file.size > 20 * 1024 * 1024) return NextResponse.json({ error: 'Image exceeds 20 MB vision limit' }, { status: 413 });

  try {
    return NextResponse.json(await analyzeImage(file, note));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Vision unavailable' }, { status: 503 });
  }
}
