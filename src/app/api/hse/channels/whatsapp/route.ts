import { NextResponse } from 'next/server';
import { normalizeMetaWebhook, verifyMetaChallenge, verifyMetaSignature } from '../../../../../services/hse/channels/meta-whatsapp';
import { processWhatsAppMessage } from '../../../../../services/hse/assistant/processor';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const challenge = verifyMetaChallenge(new URL(request.url).searchParams);
  if (!challenge) return new NextResponse('Forbidden', { status: 403 });
  return new NextResponse(challenge, { status: 200, headers: { 'Content-Type': 'text/plain' } });
}

export async function POST(request: Request) {
  // Meta signs the exact raw body. Do not call request.json() before verification.
  const rawBody = await request.text();
  const signature = request.headers.get('X-Hub-Signature-256');
  if (!verifyMetaSignature(rawBody, signature)) {
    return NextResponse.json({ ok: false, error: 'invalid_signature' }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 });
  }

  const messages = normalizeMetaWebhook(payload);
  if (!messages.length) return NextResponse.json({ ok: true, received: 0 });

  const results = await Promise.allSettled(messages.map(message => processWhatsAppMessage(message)));
  const failed = results.filter(result => result.status === 'rejected');
  for (const result of failed) {
    if (result.status === 'rejected') console.error('WhatsApp webhook item failed', result.reason);
  }

  // A valid Meta delivery is acknowledged even if one item fails after durable audit.
  // This prevents a provider retry storm; failed channel rows retain processing_error.
  return NextResponse.json({ ok: true, received: messages.length, failed: failed.length });
}
