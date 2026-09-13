export type HseSeverity = 'low' | 'medium' | 'high' | 'critical';
export type StructuredFindingDraft = {
  title: string;
  description: string | null;
  category: string | null;
  severity: HseSeverity;
  location_text: string | null;
  element_text: string | null;
  action: string | null;
  responsible_text: string | null;
  due_text: string | null;
  confidence: number;
};
export const HSE_FINDING_SCHEMA: Record<string, unknown>;
export function normalizeStructuredDraft(value?: Record<string, unknown>): StructuredFindingDraft;
