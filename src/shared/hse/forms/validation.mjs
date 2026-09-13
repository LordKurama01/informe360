const SUPPORTED_TYPES = new Set(['text','number','date','yes_no','compliance','select','photo','risk_matrix','repeater']);
const COMPLIANCE_VALUES = new Set(['complies','non_compliant','na']);

function isObject(value) { return Boolean(value) && typeof value === 'object' && !Array.isArray(value); }

function walkFields(fields, depth, errors, fieldIds) {
  if (!Array.isArray(fields)) { errors.push('fields must be an array'); return; }
  for (const field of fields) {
    if (!isObject(field)) { errors.push('field must be an object'); continue; }
    const id = typeof field.id === 'string' ? field.id.trim() : '';
    const label = typeof field.label === 'string' ? field.label.trim() : '';
    if (!id) errors.push('field id is required');
    else if (fieldIds.has(id)) errors.push(`duplicate field id: ${id}`);
    else fieldIds.add(id);
    if (!label) errors.push(`field ${id || '?'} label is required`);
    if (!SUPPORTED_TYPES.has(field.type)) errors.push(`unsupported field type: ${String(field.type)}`);
    if (field.type === 'select' && (!Array.isArray(field.options) || field.options.length === 0)) errors.push(`select ${id || '?'} requires at least one option`);
    if (field.type === 'repeater') {
      if (depth >= 1) errors.push(`repeater ${id || '?'} nesting deeper than one level is not supported`);
      walkFields(field.fields, depth + 1, errors, fieldIds);
    }
  }
}

export function validateFormSchema(schema) {
  const errors = [];
  if (!isObject(schema)) return { ok: false, errors: ['schema must be an object'] };
  if (!Number.isInteger(schema.version) || schema.version < 1) errors.push('version must be a positive integer');
  if (typeof schema.title !== 'string' || !schema.title.trim()) errors.push('title is required');
  if (!Array.isArray(schema.sections) || schema.sections.length === 0) errors.push('sections must contain at least one section');
  const sectionIds = new Set();
  const fieldIds = new Set();
  for (const section of Array.isArray(schema.sections) ? schema.sections : []) {
    if (!isObject(section)) { errors.push('section must be an object'); continue; }
    const id = typeof section.id === 'string' ? section.id.trim() : '';
    if (!id) errors.push('section id is required');
    else if (sectionIds.has(id)) errors.push(`duplicate section id: ${id}`);
    else sectionIds.add(id);
    if (typeof section.title !== 'string' || !section.title.trim()) errors.push(`section ${id || '?'} title is required`);
    walkFields(section.fields, 0, errors, fieldIds);
  }
  return { ok: errors.length === 0, errors };
}

function answerIsValid(field, value) {
  if (field.type === 'compliance') return COMPLIANCE_VALUES.has(value);
  if (field.type === 'yes_no') return value === true || value === false || value === 'yes' || value === 'no';
  if (field.type === 'number') return typeof value === 'number' && Number.isFinite(value);
  if (field.type === 'photo') return typeof value === 'string' ? value.length > 0 : Array.isArray(value) && value.length > 0;
  if (field.type === 'select') return typeof value === 'string' && field.options?.some(option => option.value === value);
  if (field.type === 'repeater') return Array.isArray(value) && value.length > 0;
  return value !== null && value !== undefined && String(value).trim().length > 0;
}

export function evaluateRequiredFields(schema, answers = {}) {
  const missing = [];
  const visit = fields => {
    for (const field of fields || []) {
      if (field.required && !answerIsValid(field, answers[field.id])) missing.push(field.id);
      if (field.type === 'repeater' && field.required && !Array.isArray(answers[field.id])) missing.push(field.id);
    }
  };
  for (const section of schema?.sections || []) visit(section.fields);
  return [...new Set(missing)];
}
