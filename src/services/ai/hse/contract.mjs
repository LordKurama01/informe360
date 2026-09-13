export const HSE_FINDING_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    title: { type: 'string' },
    description: { type: ['string', 'null'] },
    category: { type: ['string', 'null'] },
    severity: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
    responsible_text: { type: ['string', 'null'] },
    due_text: { type: ['string', 'null'], description: 'Only a due phrase explicitly stated by the user; never infer regulatory periodicity.' },
    confidence: { type: 'number', minimum: 0, maximum: 1 },
  },
  required: ['title', 'description', 'category', 'severity', 'responsible_text', 'due_text', 'confidence'],
};

export function normalizeStructuredDraft(value = {}) {
  const severityValues = new Set(['low', 'medium', 'high', 'critical']);
  return {
    title: typeof value.title === 'string' && value.title.trim() ? value.title.trim() : 'Hallazgo sin título',
    description: typeof value.description === 'string' ? value.description.trim() : null,
    category: typeof value.category === 'string' ? value.category.trim() : null,
    severity: severityValues.has(value.severity) ? value.severity : 'medium',
    responsible_text: typeof value.responsible_text === 'string' ? value.responsible_text.trim() : null,
    due_text: typeof value.due_text === 'string' ? value.due_text.trim() : null,
    confidence: Number.isFinite(value.confidence) ? Math.max(0, Math.min(1, value.confidence)) : 0,
  };
}
