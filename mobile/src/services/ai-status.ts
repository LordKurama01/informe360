const baseUrl = (process.env.EXPO_PUBLIC_API_URL || '').replace(/\/$/, '');

export type AiRuntimeStatus = {
  state: 'ready' | 'manual' | 'offline';
  label: string;
  detail: string;
  providers?: unknown;
};

export async function getAiRuntimeStatus(): Promise<AiRuntimeStatus> {
  if (!baseUrl) return { state: 'manual', label: 'Modo manual', detail: 'Backend IA todavía no configurado' };
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);
    const response = await fetch(`${baseUrl}/api/hse/health`, { signal: controller.signal });
    clearTimeout(timeout);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const payload = await response.json();
    const providers = payload?.providers || {};
    const hasRemote = Boolean(providers?.groq?.available || providers?.ollama?.available);
    return hasRemote
      ? { state: 'ready', label: 'IA disponible', detail: providers?.groq?.available ? 'Groq + fallback manual' : 'IA local + fallback manual', providers }
      : { state: 'manual', label: 'Modo manual', detail: 'Captura y guardado disponibles sin IA', providers };
  } catch {
    return { state: 'offline', label: 'IA sin conexión', detail: 'La captura se guarda igual y puede sincronizarse después' };
  }
}
