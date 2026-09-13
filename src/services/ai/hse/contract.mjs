export const HSE_FINDING_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    title: { type: 'string' },
    description: { type: ['string', 'null'] },
    category: { type: ['string', 'null'] },
    severity: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
    location_text: { type: ['string', 'null'] },
    element_text: { type: ['string', 'null'] },
    action: { type: ['string', 'null'] },
    responsible_text: { type: ['string', 'null'] },
    due_text: { type: ['string', 'null'], description: 'Only a due phrase explicitly stated by the user; never infer regulatory periodicity.' },
    confidence: { type: 'number', minimum: 0, maximum: 1 },
  },
  required: ['title', 'description', 'category', 'severity', 'location_text', 'element_text', 'action', 'responsible_text', 'due_text', 'confidence'],
};

function optionalText(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

export function normalizeStructuredDraft(value = {}) {
  const severityValues = new Set(['low', 'medium', 'high', 'critical']);
  return {
    title: typeof value.title === 'string' && value.title.trim() ? value.title.trim() : 'Hallazgo sin título',
    description: optionalText(value.description),
    category: optionalText(value.category),
    severity: severityValues.has(value.severity) ? value.severity : 'medium',
    location_text: optionalText(value.location_text),
    element_text: optionalText(value.element_text),
    action: optionalText(value.action),
    responsible_text: optionalText(value.responsible_text),
    due_text: optionalText(value.due_text),
    confidence: Number.isFinite(value.confidence) ? Math.max(0, Math.min(1, value.confidence)) : 0,
  };
}
