export type NormativeJurisdiction = 'nacional' | 'provincial' | 'municipal' | 'internacional' | 'interna' | 'referencia';
export type NormativeStatus = 'vigente' | 'derogada' | 'referencia' | 'a_revisar' | 'borrador';

export interface NormativeItem {
  id: string;
  jurisdiction: NormativeJurisdiction;
  province?: string;
  locality?: string;
  type: string;
  number: string;
  year: number;
  title: string;
  summary: string;
  topics: string[];
  modules: string[];
  organism: string;
  status: NormativeStatus;
  sourceUrl?: string;
  pdfUrl?: string;
  officialSourceLabel?: string;
  tags?: string[];
  applicableTo?: string[];
  lastReviewedAt?: string;
}

export interface NormativeFilters {
  search?: string;
  jurisdiction?: 'all' | NormativeJurisdiction;
  province?: string;
  locality?: string;
  topic?: string;
  module?: string;
  organism?: string;
  status?: 'all' | NormativeStatus;
}

export interface ReportNormativeContext {
  province?: string;
  locality?: string;
  sector?: string;
  topic?: string;
}
