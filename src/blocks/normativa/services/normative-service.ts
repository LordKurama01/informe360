import { baseNormatives } from '@/config/normative/base-normatives';
import type { NormativeFilters, NormativeItem, ReportNormativeContext } from '@/types/normative';

function normalize(value?: string) {
  return (value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

function includesNormalized(haystack: string, needle?: string) {
  const cleanNeedle = normalize(needle);
  if (!cleanNeedle) return true;
  return normalize(haystack).includes(cleanNeedle);
}

export function getNormatives() {
  return baseNormatives;
}

export function canUseNormativeForReport(normative: NormativeItem, context: ReportNormativeContext = {}) {
  const province = normalize(context.province);
  const locality = normalize(context.locality);

  if (normative.jurisdiction === 'nacional') return true;
  if (normative.jurisdiction === 'referencia' || normative.jurisdiction === 'internacional') return true;
  if (normative.jurisdiction === 'interna') return true;

  if (normative.jurisdiction === 'provincial') {
    return Boolean(province && normalize(normative.province) === province);
  }

  if (normative.jurisdiction === 'municipal') {
    return Boolean(
      province &&
      locality &&
      normalize(normative.province) === province &&
      normalize(normative.locality) === locality
    );
  }

  return false;
}

export function filterNormatives(filters: NormativeFilters = {}) {
  const search = normalize(filters.search);
  return baseNormatives.filter(item => {
    const searchable = [
      item.type,
      item.number,
      item.title,
      item.summary,
      item.organism,
      item.province,
      item.locality,
      ...item.topics,
      ...item.modules,
      ...(item.tags || [])
    ].filter(Boolean).join(' ');

    const matchesSearch = !search || includesNormalized(searchable, search);
    const matchesJurisdiction = !filters.jurisdiction || filters.jurisdiction === 'all' || item.jurisdiction === filters.jurisdiction;
    const matchesProvince = !filters.province || includesNormalized(item.province || '', filters.province) || item.jurisdiction === 'nacional' || item.jurisdiction === 'referencia';
    const matchesLocality = !filters.locality || includesNormalized(item.locality || '', filters.locality) || item.jurisdiction !== 'municipal';
    const matchesTopic = !filters.topic || item.topics.some(topic => includesNormalized(topic, filters.topic));
    const matchesModule = !filters.module || item.modules.some(module => includesNormalized(module, filters.module));
    const matchesOrganism = !filters.organism || includesNormalized(item.organism, filters.organism);
    const matchesStatus = !filters.status || filters.status === 'all' || item.status === filters.status;

    return matchesSearch && matchesJurisdiction && matchesProvince && matchesLocality && matchesTopic && matchesModule && matchesOrganism && matchesStatus;
  });
}

export function getApplicableNormatives(context: ReportNormativeContext) {
  return baseNormatives.filter(item => {
    if (!canUseNormativeForReport(item, context)) return false;
    const sector = normalize(context.sector);
    const topic = normalize(context.topic);
    const matchesSector = !sector || item.modules.some(module => normalize(module).includes(sector));
    const matchesTopic = !topic || item.topics.some(itemTopic => normalize(itemTopic).includes(topic));
    return matchesSector && matchesTopic;
  });
}

export function findRelatedNormatives(query: string, province?: string) {
  return filterNormatives({ search: query, province });
}

export function displayJurisdiction(item: NormativeItem) {
  if (item.jurisdiction === 'nacional') return 'Nacional';
  if (item.jurisdiction === 'provincial') return item.province ? `Provincial · ${item.province}` : 'Provincial';
  if (item.jurisdiction === 'municipal') return item.locality ? `Municipal · ${item.locality}` : 'Municipal';
  if (item.jurisdiction === 'internacional') return 'Internacional';
  if (item.jurisdiction === 'referencia') return 'Referencia técnica';
  return 'Interna';
}

export function displayStatus(status: NormativeItem['status']) {
  const labels: Record<NormativeItem['status'], string> = {
    vigente: 'Vigente',
    derogada: 'Derogada',
    referencia: 'Referencia',
    a_revisar: 'A revisar',
    borrador: 'Borrador'
  };
  return labels[status];
}
