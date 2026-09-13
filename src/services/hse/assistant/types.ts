import type { StructuredFindingDraft } from '../../ai/hse/contract.mjs';
import type { HseChannelIdentity, NormalizedWhatsAppMessage } from '../channels/types';

export type HseAssistantIntent =
  | 'CREATE_FINDING'
  | 'UPDATE_FINDING'
  | 'ADD_EVIDENCE'
  | 'CREATE_REMINDER'
  | 'RESCHEDULE_REMINDER'
  | 'QUERY_PENDING'
  | 'QUERY_FINDINGS'
  | 'FIELD_NOTE'
  | 'SET_CONTEXT'
  | 'CLOSE_FINDING'
  | 'DAILY_SUMMARY'
  | 'QUERY_PROCEDURE'
  | 'UNKNOWN';

export type HseAssistantCommandStatus =
  | 'proposed'
  | 'awaiting_confirmation'
  | 'confirmed'
  | 'executed'
  | 'rejected'
  | 'failed';

export type HseIntentClassification = {
  intent: HseAssistantIntent;
  confidence: number;
  reason: string;
};

export type HseConversationContext = {
  activeSiteId: string | null;
  activeLocationText: string | null;
  activeFindingId: string | null;
};

export type ProposedFindingPayload = {
  kind: 'finding';
  fieldEntryId: string;
  draft: StructuredFindingDraft;
  dueAt: string | null;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  siteId: string | null;
  originalText: string;
  mediaPaths: string[];
};

export type ProposedClosePayload = {
  kind: 'close_finding';
  findingId: string;
  findingCode: string;
  findingTitle: string;
  comment: string;
};

export type AssistantProcessingContext = {
  identity: HseChannelIdentity;
  message: NormalizedWhatsAppMessage;
  transcript: string;
  context: HseConversationContext;
};
