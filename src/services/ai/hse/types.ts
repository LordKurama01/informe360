import type { StructuredFindingDraft } from './contract.mjs';

export type AIProviderResult = {
  draft: StructuredFindingDraft;
  provider: string;
  model: string;
};

export type TranscriptionResult = {
  text: string;
  provider: string;
  model: string;
};

export interface HseAIProvider {
  readonly name: string;
  readonly model: string;
  structureFieldEntry(text: string): Promise<StructuredFindingDraft>;
  transcribeAudio?(file: File): Promise<string>;
  analyzeImage?(file: File, note?: string): Promise<StructuredFindingDraft>;
}
