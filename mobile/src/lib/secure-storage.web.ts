const memory = new Map<string, string>();
const safeKey = (key: string) => key.replace(/[^A-Za-z0-9_.-]/g, '_');

function browserStorage(): Storage | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export const secureStorage = {
  async getItem(key: string) {
    const base = safeKey(key);
    const storage = browserStorage();
    if (!storage) return memory.get(base) ?? null;
    try {
      return storage.getItem(base);
    } catch {
      return memory.get(base) ?? null;
    }
  },

  async setItem(key: string, value: string) {
    const base = safeKey(key);
    memory.set(base, value);
    const storage = browserStorage();
    if (!storage) return;
    try {
      storage.setItem(base, value);
    } catch {
      // Private browsing / storage quota failures fall back to memory for this session.
    }
  },

  async removeItem(key: string) {
    const base = safeKey(key);
    memory.delete(base);
    const storage = browserStorage();
    if (!storage) return;
    try {
      storage.removeItem(base);
    } catch {
      // Nothing else to clear when browser storage is unavailable.
    }
  },
};
