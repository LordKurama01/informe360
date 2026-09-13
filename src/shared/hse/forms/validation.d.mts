import type { HseFormAnswers, HseFormSchema } from './types';
export declare function validateFormSchema(schema: unknown): { ok: boolean; errors: string[] };
export declare function evaluateRequiredFields(schema: HseFormSchema, answers?: HseFormAnswers): string[];
