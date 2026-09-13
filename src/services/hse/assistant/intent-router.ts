import type { HseIntentClassification } from './types';

function normalized(text: string): string {
  return text.trim().toLocaleLowerCase('es-AR').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export function isConfirmationText(text: string): boolean {
  const value = normalized(text).replace(/[.!]+$/g, '').trim();
  return ['si', 'confirmar', 'confirmo', 'registrar', 'registra', 'dale', 'ok', 'okay', 'hacelo', 'guardalo'].includes(value);
}

export function isRejectionText(text: string): boolean {
  const value = normalized(text).replace(/[.!]+$/g, '').trim();
  return ['no', 'cancelar', 'cancela', 'descartar', 'descarta', 'dejalo', 'olvidalo'].includes(value);
}

export function classifyHseIntent(text: string): HseIntentClassification {
  const value = normalized(text);
  if (!value) return { intent: 'UNKNOWN', confidence: 1, reason: 'empty' };

  if (/\b(estoy|estamos|ahora estoy|ahora estamos|me fui|me voy|pasamos|llegue|llegamos)\b[\s\S]*\b(en|al|a la|a el)\b/.test(value)) {
    return { intent: 'SET_CONTEXT', confidence: 0.96, reason: 'field-context phrase' };
  }
  if (/\b(que tengo|que hay|mostrame|mostrar|listar|lista)\b[\s\S]*\b(pendiente|pendientes|vencido|vencidos|para hoy|para manana)\b/.test(value) || /^pendientes\??$/.test(value)) {
    return { intent: 'QUERY_PENDING', confidence: 0.97, reason: 'pending-query phrase' };
  }
  if (/\b(recordame|recorda me|acordame|agendame|agenda me|poneme un recordatorio|crea un recordatorio)\b/.test(value)) {
    return { intent: 'CREATE_REMINDER', confidence: 0.99, reason: 'explicit reminder request' };
  }
  if (/\b(pasa|pasalo|move|movelo|reprograma|reprogramalo|cambia)\b[\s\S]*\b(recordatorio|para el|para manana|para hoy)\b/.test(value)) {
    return { intent: 'RESCHEDULE_REMINDER', confidence: 0.9, reason: 'reschedule phrase' };
  }
  if (/\b(anota|anotame|guarda una nota|guardar nota|nota de campo|deja asentado)\b/.test(value)) {
    return { intent: 'FIELD_NOTE', confidence: 0.98, reason: 'explicit field note' };
  }
  if (/\b(cerra|cerrar|dalo por cerrado|resuelto|solucionado|ya lo arreglaron|ya esta arreglado)\b/.test(value)) {
    return { intent: 'CLOSE_FINDING', confidence: 0.88, reason: 'closure phrase' };
  }
  if (/\b(agrega|sumale|adjunta|adjuntale)\b[\s\S]*\b(evidencia|foto|imagen|audio)\b/.test(value)) {
    return { intent: 'ADD_EVIDENCE', confidence: 0.9, reason: 'evidence phrase' };
  }
  if (/\b(actualiza|cambia|modifica|seguimiento)\b[\s\S]*\b(hallazgo|hse|tema)\b/.test(value)) {
    return { intent: 'UPDATE_FINDING', confidence: 0.84, reason: 'finding-update phrase' };
  }
  if (/\b(resumen|resumime|como fue)\b[\s\S]*\b(hoy|dia|jornada|turno)\b/.test(value)) {
    return { intent: 'DAILY_SUMMARY', confidence: 0.95, reason: 'daily-summary phrase' };
  }
  if (/\b(que dice|segun|procedimiento|norma|normativa|ley|requisito)\b/.test(value)) {
    return { intent: 'QUERY_PROCEDURE', confidence: 0.78, reason: 'procedure/normative query' };
  }
  if (/\b(hallazgo|hallazgos)\b/.test(value) && /\b(mostrame|buscar|busca|cuales|que|listar|lista)\b/.test(value)) {
    return { intent: 'QUERY_FINDINGS', confidence: 0.86, reason: 'finding query' };
  }

  // In the field, a free-form observation is the dominant workflow. We do not
  // create it immediately: CREATE_FINDING only prepares a draft and requires
  // explicit confirmation in the processor.
  return { intent: 'CREATE_FINDING', confidence: 0.72, reason: 'free-form field observation' };
}

export function extractContextLabel(text: string): string | null {
  const value = text.trim();
  const patterns = [
    /(?:ahora\s+)?(?:estoy|estamos)\s+en\s+(.+)$/i,
    /(?:me\s+voy|pasamos|llegue|llegamos)\s+(?:a|al|a la|a el)\s+(.+)$/i,
  ];
  for (const pattern of patterns) {
    const match = value.match(pattern);
    if (match?.[1]?.trim()) return match[1].trim().replace(/[.!]+$/g, '');
  }
  return null;
}

export function reminderTitleFromText(text: string): string {
  return text
    .replace(/^\s*(recordame|recordá?me|acordame|agendame|agendá?me|poneme un recordatorio(?: para)?|crea un recordatorio(?: para)?)\s*/i, '')
    .replace(/\b(hoy|mañana)\b/gi, '')
    .replace(/\s+/g, ' ')
    .replace(/^[,:;\-\s]+|[,:;\-\s]+$/g, '')
    .trim() || 'Recordatorio HSE';
}
