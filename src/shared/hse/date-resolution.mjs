const DATE_ONLY_HOUR = 12;

function isoFromArgentinaDate(year, month, day) {
  const yyyy = String(year).padStart(4, '0');
  const mm = String(month).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return new Date(`${yyyy}-${mm}-${dd}T${String(DATE_ONLY_HOUR).padStart(2, '0')}:00:00-03:00`).toISOString();
}

function argentinaParts(date) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Argentina/Buenos_Aires',
    year: 'numeric', month: '2-digit', day: '2-digit',
  });
  const parts = Object.fromEntries(formatter.formatToParts(date).map((part) => [part.type, part.value]));
  return { year: Number(parts.year), month: Number(parts.month), day: Number(parts.day) };
}

export function resolveUserDueText(text, now = new Date()) {
  if (!text || typeof text !== 'string') return null;
  const normalized = text.trim().toLowerCase();

  const explicit = normalized.match(/\b(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})\b/);
  if (explicit) {
    const [, day, month, year] = explicit;
    return { source: 'user_explicit', raw: explicit[0], iso: isoFromArgentinaDate(Number(year), Number(month), Number(day)) };
  }

  const base = argentinaParts(now);
  if (/\bmañana\b/i.test(normalized)) {
    const localNoon = new Date(`${base.year}-${String(base.month).padStart(2, '0')}-${String(base.day).padStart(2, '0')}T12:00:00-03:00`);
    localNoon.setUTCDate(localNoon.getUTCDate() + 1);
    return { source: 'user_explicit', raw: 'mañana', iso: localNoon.toISOString() };
  }

  if (/\bhoy\b/i.test(normalized)) {
    return { source: 'user_explicit', raw: 'hoy', iso: isoFromArgentinaDate(base.year, base.month, base.day) };
  }

  return null;
}
