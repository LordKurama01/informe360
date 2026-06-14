export type GoogleIntegrationStatus = 'ready' | 'configured' | 'needs_env' | 'future';

export interface GoogleIntegrationItem {
  id: string;
  name: string;
  status: GoogleIntegrationStatus;
  purpose: string;
  evidence: string;
  requiredEnv?: string[];
}
