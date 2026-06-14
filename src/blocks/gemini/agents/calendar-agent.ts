export function buildCalendarAgentPrompt(actions: string[]) {
  return `Sugerí vencimientos, reinspecciones y recordatorios para estas acciones. Devolvé fechas relativas y motivo. Acciones: ${actions.join(' | ')}`;
}
