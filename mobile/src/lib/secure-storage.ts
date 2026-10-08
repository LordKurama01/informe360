import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { createWebKeyValueStore } from './web-storage';

// The native keychain is not available in React Native Web.
// In browsers Supabase persists its session in origin-scoped localStorage;
// on Android/iOS we retain the existing chunked SecureStore implementation.
const CHUNK = 1800;
const safeKey = (key: string) => key.replace(/[^A-Za-z0-9_.-]/g, '_');

function browserStorage(): Storage | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

const webStorage = createWebKeyValueStore(browserStorage);

export const secureStorage = {
  async getItem(key: string): Promise<string | null> {
    const base = safeKey(key);
    if (Platform.OS === 'web') {
      return webStorage.getItem(base);
    }
    const countRaw = await SecureStore.getItemAsync(`${base}__count`);
    if (!countRaw) return SecureStore.getItemAsync(base);
    const count = Number(countRaw);
    if (!Number.isSafeInteger(count) || count <= 0 || count > 512) return null;
    const chunks = await Promise.all(Array.from({ length: count }, (_, i) => SecureStore.getItemAsync(`${base}__${i}`)));
    return chunks.every(value => value !== null) ? chunks.join('') : null;
  },

  async setItem(key: string, value: string): Promise<void> {
    const base = safeKey(key);
    if (Platform.OS === 'web') {
      webStorage.setItem(base, value);
      return;
    }
    await this.removeItem(key);
    if (value.length <= CHUNK) {
      await SecureStore.setItemAsync(base, value);
      return;
    }
    const chunks = Array.from({ length: Math.ceil(value.length / CHUNK) }, (_, i) => value.slice(i * CHUNK, (i + 1) * CHUNK));
    await Promise.all(chunks.map((chunk, i) => SecureStore.setItemAsync(`${base}__${i}`, chunk)));
    await SecureStore.setItemAsync(`${base}__count`, String(chunks.length));
  },

  async removeItem(key: string): Promise<void> {
    const base = safeKey(key);
    if (Platform.OS === 'web') {
      webStorage.removeItem(base);
      return;
    }
    const countRaw = await SecureStore.getItemAsync(`${base}__count`);
    const count = Number(countRaw || 0);
    if (!Number.isSafeInteger(count) || count < 0 || count > 512) {
      throw new Error('Índice de almacenamiento nativo inválido.');
    }
    await Promise.all([
      SecureStore.deleteItemAsync(base),
      SecureStore.deleteItemAsync(`${base}__count`),
      ...Array.from({ length: count }, (_, i) => SecureStore.deleteItemAsync(`${base}__${i}`)),
    ]);
  },
};
