/**
 * Serialized local read/modify/write for existing Expo SQLite KV storage.
 * A rejected mutation leaves the previously persisted JSON untouched.
 * This is an in-process mutex; SQLite setItem is the durable commit.
 */
export type LocalKvStore = {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
};

const pending = new Map<string, Promise<unknown>>();

export function decodeLocalArray<T>(raw: string | null, key: string): T[] {
  if (raw === null) return [];
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    throw new Error(`Datos locales dañados (${key}). No se sobrescribieron: se requiere recuperación.`);
  }
  if (!Array.isArray(value)) {
    throw new Error(`Formato local inesperado (${key}). No se sobrescribieron los datos.`);
  }
  return value as T[];
}

export async function readLocalArray<T>(store: LocalKvStore, key: string): Promise<T[]> {
  // Wait for any in-process mutation, even one that failed, before reading storage.
  await pending.get(key)?.catch(() => undefined);
  return decodeLocalArray<T>(await store.getItem(key), key);
}

export async function updateLocalArray<T, R>(
  store: LocalKvStore,
  key: string,
  change: (items: T[]) => { items: T[]; result: R } | Promise<{ items: T[]; result: R }>,
): Promise<R> {
  const predecessor = pending.get(key) ?? Promise.resolve();
  const operation = predecessor.catch(() => undefined).then(async () => {
    const current = decodeLocalArray<T>(await store.getItem(key), key);
    const next = await change(current);
    if (!Array.isArray(next.items)) throw new Error('La escritura local requiere un arreglo.');
    await store.setItem(key, JSON.stringify(next.items));
    return next.result;
  });
  pending.set(key, operation);
  // Keep the queue healthy after a failure; do not create an unhandled rejection.
  void operation.then(
    () => { if (pending.get(key) === operation) pending.delete(key); },
    () => { if (pending.get(key) === operation) pending.delete(key); },
  );
  return operation;
}
