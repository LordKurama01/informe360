/** Render HSE metrics only after a successful read: missing data is not zero. */
export type HseDataStatus = 'loading' | 'ready' | 'error';

export function formatHseCount(value: number, status: HseDataStatus): string {
  if (status !== 'ready' || !Number.isFinite(value) || value < 0) return '—';
  return value.toLocaleString('es-AR');
}

export function formatClosureCompliance(
  summary: { closed: number; closureCompliancePct: number },
  status: HseDataStatus,
): string {
  if (status !== 'ready' || !Number.isFinite(summary.closed) || summary.closed <= 0) return '—';
  const percentage = summary.closureCompliancePct;
  if (!Number.isFinite(percentage)) return '—';
  return `${Math.round(Math.max(0, Math.min(100, percentage)))}%`;
}

export function hseDataStatusLabel(status: HseDataStatus): string {
  if (status === 'ready') return 'Datos actualizados';
  if (status === 'error') return 'Error al actualizar';
  return 'Actualizando datos…';
}
