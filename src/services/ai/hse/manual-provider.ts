import type { StructuredFindingDraft } from './contract.mjs';
import type { HseAIProvider } from './types';

export class ManualHseProvider implements HseAIProvider {
  readonly name = 'manual';
  readonly model = 'manual-fallback';

  async structureFieldEntry(text: string): Promise<StructuredFindingDraft> {
    const clean = text.trim();
    const first = clean.split(/[.!?\n]/).find(Boolean)?.trim() || 'Hallazgo pendiente de completar';
    return {
      title: first.slice(0, 120),
      description: clean || null,
      category: null,
      severity: 'medium',
      location_text: null,
      element_text: null,
      action: null,
      responsible_text: null,
      due_text: null,
      confidence: 0.15,
    };
  }
}
