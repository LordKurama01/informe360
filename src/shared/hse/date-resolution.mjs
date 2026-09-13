const DATE_ONLY_HOUR = 12;
const ARGENTINA_OFFSET = '-03:00';
const WEEKDAYS = {
  domingo: 0,
  lunes: 1,
  martes: 2,
  miercoles: 3,
  jueves: 4,
  viernes: 5,
  sabado: 6,
};

function isoFromArgentinaDateTime(year, month, day, hour = DATE_ONLY_HOUR, minute = 0) {
  const yyyy = String(year).padStart(4, '0');
  const mm = String(month).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  const hh = String(hour).padStart(2, '0');
  const min = String(minute).padStart(2, '0');
  return new Date(`${yyyy}-${mm}-${dd}T${hh}:${min}:00${ARGENTINA_OFFSET}`).toISOString();
}

function argentinaParts(date) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Argentina/Buenos_Aires',
    year: 'numeric', month: '2-digit', day: '2-digit',
  });
  const parts = Object.fromEntries(formatter.formatToParts(date).map((part) => [part.type, part.value]));
  return { year: Number(parts.year), month: Number(parts.month), day: Number(parts.day) };
}

function normalizedSpanish(text) {
  return text.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function explicitTime(normalized) {
  const spoken = normalized.match(/\ba\s+las?\s+(\d{1,2})(?::(\d{2}))?\b/);
  const clock = normalized.match(/\b(\d{1,2})(?::(\d{2}))\s*(?:hs?|horas?)\b/);
  const hourOnly = normalized.match(/\b(\d{1,2})\s*(?:hs|horas?)\b/);
  const match = spoken || clock || hourOnly;
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2] || 0);
  if (!Number.isInteger(hour) || !Number.isInteger(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  return { hour, minute };
}

function plusDays(base, days) {
  const anchor = new Date(`${base.year}-${String(base.month).padStart(2, '0')}-${String(base.day).padStart(2, '0')}T12:00:00${ARGENTINA_OFFSET}`);
  anchor.setUTCDate(anchor.getUTCDate() + days);
  return argentinaParts(anchor);
}

function weekdayOfArgentinaDate(base) {
  const anchor = new Date(`${base.year}-${String(base.month).padStart(2, '0')}-${String(base.day).padStart(2, '0')}T12:00:00${ARGENTINA_OFFSET}`);
  return anchor.getUTCDay();
}

function resolvedIso(parts, time) {
  return isoFromArgentinaDateTime(parts.year, parts.month, parts.day, time?.hour ?? DATE_ONLY_HOUR, time?.minute ?? 0);
}

export function resolveUserDueText(text, now = new Date()) {
  if (!text || typeof text !== 'string') return null;
  const normalized = normalizedSpanish(text);
  const time = explicitTime(normalized);

  const explicit = normalized.match(/\b(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})\b/);
  if (explicit) {
    const [, day, month, year] = explicit;
    return {
      source: 'user_explicit',
      raw: explicit[0],
      iso: isoFromArgentinaDateTime(Number(year), Number(month), Number(day), time?.hour ?? DATE_ONLY_HOUR, time?.minute ?? 0),
    };
  }

  const base = argentinaParts(now);
  if (/\bmanana\b/.test(normalized)) {
    const target = plusDays(base, 1);
    return { source: 'user_explicit', raw: 'mañana', iso: resolvedIso(target, time) };
  }

  if (/\bhoy\b/.test(normalized)) {
    return { source: 'user_explicit', raw: 'hoy', iso: resolvedIso(base, time) };
  }

  const weekdayPattern = /\b(domingo|lunes|martes|miercoles|jueves|viernes|sabado)\b/;
  const weekdayMatch = normalized.match(weekdayPattern);
  if (weekdayMatch) {
    const targetWeekday = WEEKDAYS[weekdayMatch[1]];
    const currentWeekday = weekdayOfArgentinaDate(base);
    let daysAhead = (targetWeekday - currentWeekday + 7) % 7;
    if (daysAhead === 0) daysAhead = 7;
    const target = plusDays(base, daysAhead);
    return { source: 'user_explicit', raw: weekdayMatch[1], iso: resolvedIso(target, time) };
  }

  return null;
}
