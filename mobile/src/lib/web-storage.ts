/** Narrow browser adapter: Expo SecureStore intentionally has no web implementation. */
export type BrowserKeyValue = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export function createWebKeyValueStore(resolve: () => BrowserKeyValue | null) {
  return {
    getItem(key: string): string | null {
      try {
        return resolve()?.getItem(key) ?? null;
      } catch {
        // Browsers can disable localStorage (private mode / site policy).
        return null;
      }
    },
    setItem(key: string, value: string): void {
      const storage = resolve();
      if (!storage) throw new Error('El almacenamiento del navegador no está disponible.');
      storage.setItem(key, value);
    },
    removeItem(key: string): void {
      resolve()?.removeItem(key);
    },
  };
}
