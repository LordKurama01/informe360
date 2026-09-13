export type HseChannelMessageType = 'text' | 'audio' | 'image' | 'document' | 'video' | 'interactive' | 'system';

export type HseChannelAttachment = {
  kind: 'audio' | 'image' | 'document' | 'video';
  id: string;
  mimeType?: string;
  fileName?: string;
  caption?: string;
  sha256?: string;
};

export type NormalizedWhatsAppMessage = {
  provider: 'whatsapp';
  externalAccountId: string;
  externalUserId: string;
  providerMessageId: string;
  idempotencyKey: string;
  displayName?: string;
  messageType: HseChannelMessageType;
  text?: string;
  attachments: HseChannelAttachment[];
  occurredAt: string;
  metadata: Record<string, unknown>;
};

export type MetaMediaDownload = {
  id: string;
  mimeType: string;
  fileName: string;
  byteSize: number;
  sha256?: string;
  file: File;
};

export type HseChannelIdentity = {
  id: string;
  organization_id: string;
  user_id: string;
  site_id: string | null;
  provider: 'whatsapp';
  external_account_id: string;
  external_user_id: string;
  display_name: string | null;
  active: boolean;
};
