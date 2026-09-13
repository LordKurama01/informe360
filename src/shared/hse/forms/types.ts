export type ComplianceAnswer = 'complies' | 'non_compliant' | 'na';
export type HseFormOption = { value: string; label: string };

type BaseField = { id: string; label: string; required?: boolean; helpText?: string };
export type HseFormField =
  | (BaseField & { type: 'text'; multiline?: boolean })
  | (BaseField & { type: 'number'; min?: number; max?: number })
  | (BaseField & { type: 'date' })
  | (BaseField & { type: 'yes_no' })
  | (BaseField & { type: 'compliance'; createFindingOnFail?: boolean })
  | (BaseField & { type: 'select'; options: HseFormOption[] })
  | (BaseField & { type: 'photo' })
  | (BaseField & { type: 'risk_matrix'; likelihoodScale?: number; consequenceScale?: number })
  | (BaseField & { type: 'repeater'; fields: Exclude<HseFormField, { type: 'repeater' }>[] });

export type HseFormSection = { id: string; title: string; description?: string; fields: HseFormField[] };
export type HseFormSchema = { version: number; title: string; description?: string; category?: string; sections: HseFormSection[] };
export type HseFormAnswers = Record<string, unknown>;
