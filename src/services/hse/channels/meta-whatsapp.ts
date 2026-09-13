import { createHmac, timingSafeEqual } from 'node:crypto';
import type { HseChannelAttachment, HseChannelMessageType, MetaMediaDownload, NormalizedWhatsAppMessage } from './types';

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is not configured`);
  return value;
}

function graphVersion(): string {
  return requiredEnv('META_GRAPH_API_VERSION').replace(/^\/+|\/+$/g, '');
}

function accessToken(): string {
  return requiredEnv('META_WHATSAPP_ACCESS_TOKEN');
}

export function verifyMetaSignature(rawBody: string, signatureHeader: string | null, appSecret = process.env.META_APP_SECRET): boolean {
  if (!signatureHeader || !appSecret) return false;
  const expected = `sha256=${createHmac('sha256', appSecret).update(rawBody, 'utf8').digest('hex')}`;
  const expectedBuffer = Buffer.from(expected, 'utf8');
  const receivedBuffer = Buffer.from(signatureHeader, 'utf8');
  return expectedBuffer.length === receivedBuffer.length && timingSafeEqual(expectedBuffer, receivedBuffer);
}

export function verifyMetaChallenge(params: URLSearchParams, verifyToken = process.env.META_WHATSAPP_VERIFY_TOKEN): string | null {
  const mode = params.get('hub.mode');
  const token = params.get('hub.verify_token');
  const challenge = params.get('hub.challenge');
  if (mode !== 'subscribe' || !verifyToken || token !== verifyToken || !challenge) return null;
  return challenge;
}

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

function textValue(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function attachmentFromMessage(message: Record<string, unknown>, kind: HseChannelAttachment['kind']): HseChannelAttachment | null {
  const body = record(message[kind]);
  const id = textValue(body?.id);
  if (!id) return null;
  return {
    kind,
    id,
    mimeType: textValue(body?.mime_type),
    fileName: textValue(body?.filename),
    caption: textValue(body?.caption),
    sha256: textValue(body?.sha256),
  };
}

function messageBody(message: Record<string, unknown>): { type: HseChannelMessageType; text?: string; attachments: HseChannelAttachment[] } | null {
  const rawType = textValue(message.type) || 'system';
  if (rawType === 'text') {
    const text = textValue(record(message.text)?.body);
    return { type: 'text', text, attachments: [] };
  }
  if (rawType === 'audio' || rawType === 'image' || rawType === 'document' || rawType === 'video') {
    const attachment = attachmentFromMessage(message, rawType);
    const caption = attachment?.caption;
    return { type: rawType, text: caption, attachments: attachment ? [attachment] : [] };
  }
  if (rawType === 'interactive') {
    const interactive = record(message.interactive);
    const reply = record(interactive?.button_reply) || record(interactive?.list_reply);
    const text = textValue(reply?.title) || textValue(reply?.id);
    return { type: 'interactive', text, attachments: [] };
  }
  if (rawType === 'button') {
    const button = record(message.button);
    return { type: 'interactive', text: textValue(button?.text) || textValue(button?.payload), attachments: [] };
  }
  return { type: 'system', text: undefined, attachments: [] };
}

export function normalizeMetaWebhook(payload: unknown): NormalizedWhatsAppMessage[] {
  const root = record(payload);
  if (!root || root.object !== 'whatsapp_business_account' || !Array.isArray(root.entry)) return [];
  const normalized: NormalizedWhatsAppMessage[] = [];

  for (const entryValue of root.entry) {
    const entry = record(entryValue);
    if (!entry || !Array.isArray(entry.changes)) continue;
    for (const changeValue of entry.changes) {
      const change = record(changeValue);
      const value = record(change?.value);
      if (!value) continue;
      const metadata = record(value.metadata);
      const externalAccountId = textValue(metadata?.phone_number_id);
      if (!externalAccountId || !Array.isArray(value.messages)) continue;

      const contacts = new Map<string, string>();
      if (Array.isArray(value.contacts)) {
        for (const contactValue of value.contacts) {
          const contact = record(contactValue);
          const waId = textValue(contact?.wa_id);
          const profile = record(contact?.profile);
          const name = textValue(profile?.name);
          if (waId && name) contacts.set(waId, name);
        }
      }

      for (const messageValue of value.messages) {
        const message = record(messageValue);
        if (!message) continue;
        const providerMessageId = textValue(message.id);
        const externalUserId = textValue(message.from);
        if (!providerMessageId || !externalUserId) continue;
        const body = messageBody(message);
        if (!body) continue;
        const unixSeconds = Number(message.timestamp);
        const occurredAt = Number.isFinite(unixSeconds) && unixSeconds > 0
          ? new Date(unixSeconds * 1000).toISOString()
          : new Date().toISOString();
        normalized.push({
          provider: 'whatsapp',
          externalAccountId,
          externalUserId,
          providerMessageId,
          idempotencyKey: providerMessageId,
          displayName: contacts.get(externalUserId),
          messageType: body.type,
          text: body.text,
          attachments: body.attachments,
          occurredAt,
          metadata: {
            waba_id: textValue(entry.id),
            display_phone_number: textValue(metadata?.display_phone_number),
          },
        });
      }
    }
  }
  return normalized;
}

export async function downloadMetaMedia(mediaId: string, fallbackName = `whatsapp-${mediaId}`): Promise<MetaMediaDownload> {
  const token = accessToken();
  const metadataResponse = await fetch(`https://graph.facebook.com/${graphVersion()}/${encodeURIComponent(mediaId)}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if (!metadataResponse.ok) throw new Error(`Meta media metadata failed with status ${metadataResponse.status}`);
  const metadata = await metadataResponse.json() as { id?: string; url?: string; mime_type?: string; file_size?: number; sha256?: string };
  if (!metadata.url) throw new Error('Meta media URL missing');

  const mediaResponse = await fetch(metadata.url, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if (!mediaResponse.ok) throw new Error(`Meta media download failed with status ${mediaResponse.status}`);
  const bytes = await mediaResponse.arrayBuffer();
  const mimeType = metadata.mime_type || mediaResponse.headers.get('content-type') || 'application/octet-stream';
  const extension = mimeType.includes('/') ? mimeType.split('/')[1].split(';')[0].replace(/[^a-z0-9.+-]/gi, '') : 'bin';
  const fileName = fallbackName.includes('.') ? fallbackName : `${fallbackName}.${extension || 'bin'}`;
  return {
    id: metadata.id || mediaId,
    mimeType,
    fileName,
    byteSize: Number(metadata.file_size) || bytes.byteLength,
    sha256: metadata.sha256,
    file: new File([bytes], fileName, { type: mimeType }),
  };
}

export async function sendWhatsAppText(to: string, body: string, phoneNumberId = process.env.META_WHATSAPP_PHONE_NUMBER_ID): Promise<string | null> {
  const token = accessToken();
  if (!phoneNumberId) throw new Error('META_WHATSAPP_PHONE_NUMBER_ID is not configured');
  const response = await fetch(`https://graph.facebook.com/${graphVersion()}/${encodeURIComponent(phoneNumberId)}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'text',
      text: { body, preview_url: false },
    }),
    cache: 'no-store',
  });
  if (!response.ok) throw new Error(`Meta WhatsApp send failed with status ${response.status}`);
  const payload = await response.json().catch(() => null) as { messages?: Array<{ id?: string }> } | null;
  return payload?.messages?.[0]?.id || null;
}

export function getWhatsAppChannelStatus() {
  return {
    configured: Boolean(
      process.env.META_APP_SECRET &&
      process.env.META_WHATSAPP_VERIFY_TOKEN &&
      process.env.META_WHATSAPP_ACCESS_TOKEN &&
      process.env.META_WHATSAPP_PHONE_NUMBER_ID &&
      process.env.META_GRAPH_API_VERSION
    ),
  };
}
