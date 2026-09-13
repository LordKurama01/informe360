export type ComplianceAnswer = 'complies' | 'non_compliant' | 'na';
export type HseFormOption = { value: string; label: string };
export type HseBaseField = { id: string; label: string; required?: boolean; helpText?: string };
export type HseLeafField =
  | (HseBaseField & { type: 'text'; multiline?: boolean })
  | (HseBaseField & { type: 'number'; min?: number; max?: number })
  | (HseBaseField & { type: 'date' })
  | (HseBaseField & { type: 'yes_no' })
  | (HseBaseField & { type: 'compliance'; createFindingOnFail?: boolean })
  | (HseBaseField & { type: 'select'; options: HseFormOption[] })
  | (HseBaseField & { type: 'photo' })
  | (HseBaseField & { type: 'risk_matrix'; likelihoodScale?: number; consequenceScale?: number });
export type HseFormField = HseLeafField | (HseBaseField & { type: 'repeater'; fields: HseLeafField[] });
export type HseFormSection = { id: string; title: string; description?: string; fields: HseFormField[] };
export type HseFormSchema = { version: number; title: string; description?: string; category?: string; sections: HseFormSection[] };
export type HseFormAnswers = Record<string, unknown>;
export type FormTemplateSummary = { id: string; name: string; category: string; description: string | null; status: string; publishedVersionId: string; version: number; schema: HseFormSchema };
export type FormRunBundle = { run: { id: string; organization_id: string; site_id: string | null; template_id: string; template_version_id: string; status: 'draft'|'in_progress'|'submitted'|'reviewed'|'cancelled'; started_at: string; submitted_at: string | null; notes: string | null }; template: { id: string; name: string; category: string }; version: { id: string; version: number; schema_json: HseFormSchema }; answers: HseFormAnswers };
