export type ReportStatus = 'draft' | 'generated' | 'reviewed' | 'exported' | 'archived';
export type RiskLevel = 'bajo' | 'medio' | 'alto' | 'crítico' | 'a revisar';
export type DecisionTrailStepType = 'input' | 'technical' | 'normative' | 'smart' | 'calendar' | 'executive' | 'evidence';
export type ReportStyleMode = 'informe360' | 'usuario' | 'formal_tecnico' | 'mantenimiento' | 'hse' | 'auditoria';

export type ReportUploadedFileCategory = 'evidence' | 'reference';

export interface ReportUploadedFileMetadata {
  id: string;
  name: string;
  size: number;
  type: string;
  extension: string;
  category: ReportUploadedFileCategory;
  description?: string;
  useInReport?: boolean;
  useAsAnnex?: boolean;
  useAsStyleReference?: boolean;
  previewUrl?: string;
}

export interface ReportInput {
  companyName: string;
  siteName: string;
  province: string;
  reportType: string;
  authorName?: string;
  professionalRole?: string;
  clientContact?: string;
  fieldNotes: string;
  audioTranscript?: string;
  photoNotes?: string;
  checklistItems?: string;
  inspectionDate?: string;
  locationAddress?: string;
  estimatedManualTimeMinutes?: number;
  reportStyleMode?: ReportStyleMode;
  reportTemplate?: string;
  referenceFileNames?: string[];
  referenceStyleNotes?: string;
  evidenceFileNames?: string[];
  uploadedFiles?: ReportUploadedFileMetadata[];
  desiredTone?: string;
}

export interface SmartAction {
  id: string;
  action: string;
  responsible: string;
  dueDate: string;
  evidence: string;
  priority: 'baja' | 'media' | 'alta' | 'crítica';
  status: 'pendiente' | 'en_proceso' | 'cerrada' | 'vencida';
  sourceFinding?: string;
}

export interface CalendarSuggestion {
  title: string;
  reason: string;
  suggestedDate: string;
  reminderDaysBefore: number;
  linkedAction?: string;
  googleCalendarReady?: boolean;
}

export interface ImpactMetrics {
  estimatedManualTimeMinutes: number;
  estimatedAiTimeMinutes: number;
  estimatedTimeSavedMinutes: number;
  estimatedTimeSavedPercent: number;
}

export interface AiDecisionTrailStep {
  id: string;
  type: DecisionTrailStepType;
  agentName: string;
  inputUsed: string;
  recommendation: string;
  reasoning: string;
  output: string;
  createdAt: string;
}

export interface TechnicalDetail {
  title: string;
  description: string;
  objective?: string;
  benefit?: string;
  evidence?: string;
}

export interface ReportQualityScore {
  score: number;
  structure: string;
  actions: string;
  evidence: string;
  conclusion: string;
}

export interface GeneratedReport {
  id: string;
  title: string;
  executiveSummary: string;
  generalDescription: string;
  technicalDetails: TechnicalDetail[];
  findings: string[];
  riskLevel: RiskLevel;
  probableCauses: string[];
  smartActions: SmartAction[];
  relatedNormatives: string[];
  calendarSuggestions: CalendarSuggestion[];
  finalStatus: string[];
  attachmentsSummary: string;
  clientSummary: string;
  conclusion: string;
  professionalDisclaimer: string;
  impactMetrics: ImpactMetrics;
  decisionTrail: AiDecisionTrailStep[];
  qualityScore: ReportQualityScore;
  generatedAt: string;
  aiProvider: 'gemini' | 'mock';
}
