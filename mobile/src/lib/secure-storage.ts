import * as SecureStore from 'expo-secure-store';

const CHUNK = 1800;
const safeKey = (key: string) => key.replace(/[^A-Za-z0-9_.-]/g, '_');

export const secureStorage = {
  async getItem(key: string) {
    const base = safeKey(key);
    const countRaw = await SecureStore.getItemAsync(`${base}__count`);
    if (!countRaw) return SecureStore.getItemAsync(base);
    const count = Number(countRaw);
    const chunks = await Promise.all(Array.from({ length: count }, (_, i) => SecureStore.getItemAsync(`${base}__${i}`)));
    return chunks.every((value) => value !== null) ? chunks.join('') : null;
  },
  async setItem(key: string, value: string) {
    const base = safeKey(key);
    await this.removeItem(key);
    if (value.length <= CHUNK) return SecureStore.setItemAsync(base, value);
    const chunks = Array.from({ length: Math.ceil(value.length / CHUNK) }, (_, i) => value.slice(i * CHUNK, (i + 1) * CHUNK));
    await Promise.all(chunks.map((chunk, i) => SecureStore.setItemAsync(`${base}__${i}`, chunk)));
    await SecureStore.setItemAsync(`${base}__count`, String(chunks.length));
  },
  async removeItem(key: string) {
    const base = safeKey(key);
    const countRaw = await SecureStore.getItemAsync(`${base}__count`);
    const count = Number(countRaw || 0);
    await Promise.all([SecureStore.deleteItemAsync(base), SecureStore.deleteItemAsync(`${base}__count`), ...Array.from({ length: count }, (_, i) => SecureStore.deleteItemAsync(`${base}__${i}`))]);
  },
};
