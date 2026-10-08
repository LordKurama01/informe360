export type InspectionTemplateLike = {
  id: string;
  name: string;
  category: string;
  status: string;
  description: string | null;
  publishedVersion?: { version: number } | null;
};
export type InspectionRunLike = {
  id: string;
  template_id: string;
  status: string;
  site_id: string | null;
  started_at: string;
};

export function selectHseInspections<T extends InspectionTemplateLike, R extends InspectionRunLike>(
  templates: readonly T[],
  runs: readonly R[],
  siteId: string | null,
) {
  const inspections = templates.filter(item => item.category === 'inspection');
  const names = new Map(inspections.map(item => [item.id, item.name]));
  const visibleRuns = runs.filter(run =>
    names.has(run.template_id) && (!siteId || run.site_id === siteId)
  );
  return { templates: inspections, runs: visibleRuns, names };
}

export function inspectionStatusLabel(status: string): string {
  switch (status) {
    case 'submitted': return 'Enviada';
    case 'completed': return 'Completada';
    case 'draft': return 'Borrador';
    case 'in_progress': return 'En curso';
    case 'cancelled': return 'Cancelada';
    default: return 'Estado no identificado';
  }
}
