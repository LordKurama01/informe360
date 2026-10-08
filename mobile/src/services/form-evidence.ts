import type { HseFormAnswers, HseFormSchema, HseLeafField } from '../types/forms';

/** Explicit storage reference, never a public bucket URL. */
export const FORM_PHOTO_PREFIX = 'hse-evidence:';

export function photoStoragePath(value: unknown): string | null {
  if (typeof value !== 'string' || !value.startsWith(FORM_PHOTO_PREFIX)) return null;
  const path = value.slice(FORM_PHOTO_PREFIX.length);
  return path && !path.includes('..') && !path.includes('://') ? path : null;
}

export function isLocalPhoto(value: unknown): value is string {
  return typeof value === 'string' && /^(file|content):\/\//.test(value);
}

export async function preparePhotoAnswers(
  schema: HseFormSchema,
  answers: HseFormAnswers,
  upload: (key: string, uri: string) => Promise<string>,
  allowedPathPrefix?: string,
): Promise<HseFormAnswers> {
  const result: HseFormAnswers = { ...answers };
  const transform = async (field: HseLeafField, value: unknown, key: string): Promise<unknown> => {
    if (field.type !== 'photo' || value === null || value === undefined || value === '') return value;
    const existingPath = photoStoragePath(value);
    if (existingPath) {
      if (allowedPathPrefix && !existingPath.startsWith(allowedPathPrefix)) throw new Error('Evidencia ajena a esta inspección.');
      return value;
    }
    if (!isLocalPhoto(value)) throw new Error('Formato de evidencia fotográfica no reconocido.');
    const path = await upload(key, value);
    if (!path || path.includes('..') || path.includes('://') || (allowedPathPrefix && !path.startsWith(allowedPathPrefix))) {
      throw new Error('La evidencia no obtuvo una ruta de almacenamiento válida.');
    }
    return FORM_PHOTO_PREFIX + path;
  };
  for (const section of schema.sections) {
    for (const field of section.fields) {
      if (!Object.prototype.hasOwnProperty.call(answers, field.id)) continue;
      const current = answers[field.id];
      if (field.type !== 'repeater') {
        result[field.id] = await transform(field, current, field.id);
        continue;
      }
      if (!Array.isArray(current)) continue;
      result[field.id] = await Promise.all(current.map(async (item, index) => {
        if (!item || typeof item !== 'object' || Array.isArray(item)) return item;
        const row = { ...(item as Record<string, unknown>) };
        for (const nested of field.fields) {
          if (nested.type === 'photo' && Object.prototype.hasOwnProperty.call(row, nested.id)) {
            row[nested.id] = await transform(nested, row[nested.id], field.id + '-' + index + '-' + nested.id);
          }
        }
        return row;
      }));
    }
  }
  return result;
}
