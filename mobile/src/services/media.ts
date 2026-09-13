import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system/legacy';

export async function compressEvidenceImage(uri: string) {
  const context = ImageManipulator.ImageManipulator.manipulate(uri);
  context.resize({ width: 1600, height: null });
  const rendered = await context.renderAsync();
  return rendered.saveAsync({ compress: 0.72, format: ImageManipulator.SaveFormat.JPEG });
}

export async function persistCaptureFile(uri: string, extension: 'jpg' | 'm4a') {
  if (!FileSystem.documentDirectory) throw new Error('Almacenamiento local no disponible');
  const dir = `${FileSystem.documentDirectory}hse-pending/`;
  await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  const target = `${dir}${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;
  await FileSystem.copyAsync({ from: uri, to: target });
  return target;
}

export async function deletePersistedCapture(uri?: string | null) {
  if (!uri) return;
  try { await FileSystem.deleteAsync(uri, { idempotent: true }); } catch { /* best effort */ }
}
